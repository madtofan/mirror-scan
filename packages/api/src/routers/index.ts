import { ORPCError, type RouterClient } from "@orpc/server";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db, ledger, wallet, walletKey } from "@mirror-scan/db";

import { protectedProcedure, publicProcedure } from "../index";

// ── Shared serialisers ────────────────────────────────────────────────────────

function serialiseLedger(r: {
	id: string;
	userId: string;
	fromPubKey: string;
	toPubKey: string;
	amount: number;
	prevTxHash: string | null;
	sequenceNumber: number;
	signature: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
}) {
	return {
		...r,
		amount: Number(r.amount),
		createdAt: r.createdAt.toISOString(),
		updatedAt: r.updatedAt.toISOString(),
	};
}

// ── Router ────────────────────────────────────────────────────────────────────

export const appRouter = {
	// ── Health / private ───────────────────────────────────────────────────────
	healthCheck: publicProcedure.handler(() => "OK"),

	privateData: protectedProcedure.handler(({ context }) => ({
		message: "This is private",
		user: context.session?.user,
	})),

	// ── Dashboard: KPI summary ─────────────────────────────────────────────────
	getDashboardKpi: protectedProcedure.handler(async () => {
		const rows = await db
			.select({
				status: ledger.status,
				totalAmount: sql<number>`COALESCE(SUM(${ledger.amount}), 0)`,
				txCount: count(),
			})
			.from(ledger)
			.groupBy(ledger.status);

		let totalVolume = 0;
		let syncedCount = 0;
		let totalCount = 0;

		for (const row of rows) {
			totalVolume += Number(row.totalAmount);
			totalCount += Number(row.txCount);
			if (row.status === "acknowledged" || row.status === "sent") {
				syncedCount += Number(row.txCount);
			}
		}

		const syncRate =
			totalCount > 0
				? Number(((syncedCount / totalCount) * 100).toFixed(1))
				: 0;

		const locationResult = await db
			.selectDistinct({ fromPubKey: ledger.fromPubKey })
			.from(ledger);

		return {
			totalVolume,
			syncRate,
			activeHeartlands: locationResult.length,
		};
	}),

	// ── Dashboard: Ledger entries (paginated) ──────────────────────────────────
	getLedgerEntries: protectedProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				pageSize: z.number().int().min(1).max(100).default(10),
				status: z
					.enum(["All", "pending", "sent", "acknowledged", "rejected"])
					.default("All"),
				search: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const { page, pageSize, status, search } = input;

			const allRows = await db
				.select({
					id: ledger.id,
					userId: ledger.userId,
					fromPubKey: ledger.fromPubKey,
					toPubKey: ledger.toPubKey,
					amount: ledger.amount,
					prevTxHash: ledger.prevTxHash,
					sequenceNumber: ledger.sequenceNumber,
					status: ledger.status,
					createdAt: ledger.createdAt,
					updatedAt: ledger.updatedAt,
				})
				.from(ledger)
				.where(status !== "All" ? eq(ledger.status, status) : undefined)
				.orderBy(sql`${ledger.createdAt} DESC`);

			const filtered = search
				? allRows.filter(
						(r) =>
							r.id.toLowerCase().includes(search.toLowerCase()) ||
							r.fromPubKey.toLowerCase().includes(search.toLowerCase()) ||
							r.toPubKey.toLowerCase().includes(search.toLowerCase()),
					)
				: allRows;

			const total = filtered.length;
			const offset = (page - 1) * pageSize;
			const entries = filtered
				.slice(offset, offset + pageSize)
				.map((r) => ({
					...r,
					amount: Number(r.amount),
					createdAt: r.createdAt.toISOString(),
					updatedAt: r.updatedAt.toISOString(),
				}));

			return { entries, total, page, pageSize };
		}),

	// ── Native Sync ────────────────────────────────────────────────────────────
	sync: {
		// ── sync.pull ────────────────────────────────────────────────────────────
		pull: protectedProcedure.handler(async ({ context }) => {
			const userId = context.session.user.id;

			// 1. Fetch wallets for this user
			const wallets = await db
				.select()
				.from(wallet)
				.where(eq(wallet.userId, userId));

			// 2. Fetch walletKeys for those wallets
			const walletIds = wallets.map((w) => w.id);
			const walletKeys =
				walletIds.length > 0
					? await db
							.select()
							.from(walletKey)
							.where(
								sql`${walletKey.walletId} = ANY(ARRAY[${sql.join(
									walletIds.map((id) => sql`${id}`),
									sql`, `,
								)}]::text[])`,
							)
					: [];

			// 3. Fetch ledger entries for this user
			const ledgerEntries = await db
				.select()
				.from(ledger)
				.where(eq(ledger.userId, userId))
				.orderBy(sql`${ledger.sequenceNumber} ASC`);

			return {
				wallets: wallets.map((w) => ({
					id: w.id,
					userId: w.userId,
					name: w.name,
					balance: Number(w.balance),
					currency: w.currency,
					createdAt: w.createdAt.toISOString(),
					updatedAt: w.updatedAt.toISOString(),
				})),
				walletKeys: walletKeys.map((k) => ({
					id: k.id,
					walletId: k.walletId,
					publicKey: k.publicKey,
					privateKeyEncrypted: k.privateKeyEncrypted,
					createdAt: k.createdAt.toISOString(),
				})),
				ledgerEntries: ledgerEntries.map(serialiseLedger),
			};
		}),

		// ── sync.push ────────────────────────────────────────────────────────────
		push: protectedProcedure
			.input(
				z.object({
					id: z.string().min(1),
					fromPubKey: z.string().min(1),
					toPubKey: z.string().min(1),
					amount: z.number().int().positive(),
					prevTxHash: z.string().nullable().optional(),
					sequenceNumber: z.number().int().positive(),
					signature: z.string().min(1),
					status: z
						.enum(["pending", "sent", "acknowledged", "rejected"])
						.default("sent"),
				}),
			)
			.handler(async ({ input, context }) => {
				const userId = context.session.user.id;
				const {
					id,
					fromPubKey,
					toPubKey,
					amount,
					prevTxHash,
					sequenceNumber,
					signature,
					status,
				} = input;

				// ── Step 1: Check if entry already exists ──────────────────────────
				const [existing] = await db
					.select({ id: ledger.id, userId: ledger.userId })
					.from(ledger)
					.where(eq(ledger.id, id))
					.limit(1);

				if (existing) {
					if (existing.userId !== userId) {
						throw new ORPCError("FORBIDDEN", {
							message: "This ledger entry belongs to a different user.",
						});
					}
					// Same user — upsert directly (idempotent retry, skip chain validation)
					const [upserted] = await db
						.update(ledger)
						.set({ fromPubKey, toPubKey, amount, prevTxHash: prevTxHash ?? null, sequenceNumber, signature, status })
						.where(and(eq(ledger.id, id), eq(ledger.userId, userId)))
						.returning();

					return { entry: serialiseLedger(upserted!) };
				}

				// ── Step 2: Chain validation (new entry only) ──────────────────────
				const normalizedPrevHash = prevTxHash ?? null;

				if (normalizedPrevHash !== null) {
					// prevTxHash provided — verify it references an existing entry for this user
					const [prevEntry] = await db
						.select({ id: ledger.id })
						.from(ledger)
						.where(
							and(
								eq(ledger.id, normalizedPrevHash),
								eq(ledger.userId, userId),
							),
						)
						.limit(1);

					if (!prevEntry) {
						throw new ORPCError("BAD_REQUEST", {
							message: `prevTxHash '${normalizedPrevHash}' does not reference a known ledger entry for this user.`,
						});
					}
				} else {
					// No prevTxHash — only valid if this is the user's first entry (genesis)
					const [firstEntry] = await db
						.select({ id: ledger.id })
						.from(ledger)
						.where(eq(ledger.userId, userId))
						.limit(1);

					if (firstEntry) {
						throw new ORPCError("BAD_REQUEST", {
							message:
								"prevTxHash is required for non-genesis ledger entries.",
						});
					}
				}

				// ── Step 3: Double-spend detection ─────────────────────────────────
				if (normalizedPrevHash !== null) {
					const [conflicting] = await db
						.select({ id: ledger.id })
						.from(ledger)
						.where(
							and(
								eq(ledger.prevTxHash, normalizedPrevHash),
								eq(ledger.userId, userId),
							),
						)
						.limit(1);

					if (conflicting) {
						// Mark the existing conflicting entry as rejected
						await db
							.update(ledger)
							.set({ status: "rejected" })
							.where(eq(ledger.id, conflicting.id));

						// Insert the incoming entry as rejected too
						await db.insert(ledger).values({
							id,
							userId,
							fromPubKey,
							toPubKey,
							amount,
							prevTxHash: normalizedPrevHash,
							sequenceNumber,
							signature,
							status: "rejected",
						});

						throw new ORPCError("CONFLICT", {
							message:
								"Double-spend detected: another entry with the same prevTxHash already exists.",
						});
					}
				}

				// ── Step 4: Insert new entry ───────────────────────────────────────
				const [inserted] = await db
					.insert(ledger)
					.values({
						id,
						userId,
						fromPubKey,
						toPubKey,
						amount,
						prevTxHash: normalizedPrevHash,
						sequenceNumber,
						signature,
						status,
					})
					.returning();

				return { entry: serialiseLedger(inserted!) };
			}),
	},
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
