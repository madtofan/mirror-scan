import type { RouterClient } from "@orpc/server";
import { count, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db, ledger } from "@mirror-scan/db";

import { protectedProcedure, publicProcedure } from "../index";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),

	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),

	// ── Dashboard: KPI summary ──────────────────────────────────────────
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

		// Count unique locations via fromPubKey distinct (proxy for active nodes)
		const locationResult = await db
			.selectDistinct({ fromPubKey: ledger.fromPubKey })
			.from(ledger);

		return {
			totalVolume,
			syncRate,
			activeHeartlands: locationResult.length,
		};
	}),

	// ── Dashboard: Ledger entries (paginated) ───────────────────────────
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

			// Build WHERE conditions
			const conditions = [];

			if (status !== "All") {
				conditions.push(eq(ledger.status, status));
			}

			// Fetch all matching rows (Drizzle doesn't support dynamic LIKE easily
			// without raw SQL, so we filter in JS for the search term)
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
				.where(conditions.length > 0 ? conditions[0] : undefined)
				.orderBy(sql`${ledger.createdAt} DESC`);

			// Client-side search filter
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
			const entries = filtered.slice(offset, offset + pageSize).map((r) => ({
				...r,
				amount: Number(r.amount),
				createdAt: r.createdAt.toISOString(),
				updatedAt: r.updatedAt.toISOString(),
			}));

			return { entries, total, page, pageSize };
		}),
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
