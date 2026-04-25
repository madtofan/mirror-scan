import * as SQLite from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import type { AppRouterClient } from "@mirror-scan/api/routers/index";
import {
	getPendingPushFlag,
	setPendingPushFlag,
} from "./network";

export interface PullResponse {
	wallets: {
		id: string;
		userId: string;
		name: string;
		balance: number;
		currency: string;
		createdAt: string;
		updatedAt: string;
	}[];
	walletKeys: {
		id: string;
		walletId: string;
		publicKey: string;
		privateKeyEncrypted: string;
		createdAt: string;
	}[];
	ledgerEntries: {
		id: string;
		userId: string;
		fromPubKey: string;
		toPubKey: string;
		amount: number;
		prevTxHash: string | null;
		sequenceNumber: number;
		signature: string;
		status: string;
		createdAt: string;
		updatedAt: string;
	}[];
}

const LEDGER_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ledger (
  id TEXT PRIMARY KEY NOT NULL,
  from_pub_key TEXT NOT NULL,
  to_pub_key TEXT NOT NULL,
  amount INTEGER NOT NULL,
  prev_tx_hash TEXT,
  sequence_number INTEGER NOT NULL,
  signature TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance INTEGER DEFAULT 0 NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_keys (
  id TEXT PRIMARY KEY NOT NULL,
  wallet_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')) NOT NULL,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);
`;

async function getDb(): Promise<SQLiteDatabase> {
	return SQLite.openDatabaseAsync("sqlite-local.db");
}

async function migrateIfNeeded(db: SQLiteDatabase): Promise<void> {
	await db.execAsync("PRAGMA journal_mode = 'wal';");
	const tables = await db.getAllAsync<{ name: string }>(
		"SELECT name FROM sqlite_master WHERE type='table'",
	);
	const tableNames = new Set(tables.map((t) => t.name));
	if (!tableNames.has("ledger")) {
		await db.execAsync(LEDGER_TABLE_SQL);
	}
}

let client: AppRouterClient;

async function getClient(): Promise<AppRouterClient> {
	if (!client) {
		client = (await import("@/utils/orpc")).client;
	}
	return client;
}

export async function pull(db?: SQLiteDatabase): Promise<PullResponse> {
	const database = db ?? await getDb();
	await migrateIfNeeded(database);

	const rpcClient = await getClient();
	const response = await rpcClient.sync.pull();

	const { wallets, walletKeys, ledgerEntries } = response;

	for (const wallet of wallets) {
		await database.runAsync(
			`INSERT OR REPLACE INTO wallets (id, user_id, name, balance, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				wallet.id,
				wallet.userId,
				wallet.name,
				wallet.balance,
				wallet.currency,
				Math.floor(new Date(wallet.createdAt).getTime() / 1000),
				Math.floor(new Date(wallet.updatedAt).getTime() / 1000),
			],
		);
	}

	for (const key of walletKeys) {
		await database.runAsync(
			`INSERT OR REPLACE INTO wallet_keys (id, wallet_id, public_key, private_key_encrypted, created_at)
       VALUES (?, ?, ?, ?, ?)`,
			[
				key.id,
				key.walletId,
				key.publicKey,
				key.privateKeyEncrypted,
				Math.floor(new Date(key.createdAt).getTime() / 1000),
			],
		);
	}

	for (const entry of ledgerEntries) {
		await database.runAsync(
			`INSERT OR REPLACE INTO ledger (id, from_pub_key, to_pub_key, amount, prev_tx_hash, sequence_number, signature, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				entry.id,
				entry.fromPubKey,
				entry.toPubKey,
				entry.amount,
				entry.prevTxHash,
				entry.sequenceNumber,
				entry.signature,
				entry.status,
				Math.floor(new Date(entry.createdAt).getTime() / 1000),
				Math.floor(new Date(entry.updatedAt).getTime() / 1000),
			],
		);
	}

	return response;
}

export type PushInput = {
	id: string;
	fromPubKey: string;
	toPubKey: string;
	amount: number;
	prevTxHash: string | null;
	sequenceNumber: number;
	signature: string;
	status?: "pending" | "sent" | "acknowledged" | "rejected";
};

export async function pushEntry(
	input: PushInput,
	db?: SQLiteDatabase,
): Promise<void> {
	const database = db ?? await getDb();
	await migrateIfNeeded(database);

	const rpcClient = await getClient();

	try {
		await rpcClient.sync.push({
			...input,
			status: input.status ?? "sent",
		});

		await database.runAsync(
			"UPDATE ledger SET status = ?, updated_at = strftime('%s', 'now') WHERE id = ?",
			["sent", input.id],
		);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		const isOfflineError =
			errorMessage.includes("fetch") ||
			errorMessage.includes("network") ||
			errorMessage.includes("ENOENT") ||
			errorMessage.includes("ECONNREFUSED") ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("Failed to fetch");

		if (isOfflineError) {
			await database.runAsync(
				"UPDATE ledger SET status = 'pending', updated_at = strftime('%s', 'now') WHERE id = ?",
				[input.id],
			);
			await setPendingPushFlag(true);
			return;
		}

		throw error;
	}
}

export async function getPendingEntries(
	db?: SQLiteDatabase,
): Promise<
	{
		id: string;
		from_pub_key: string;
		to_pub_key: string;
		amount: number;
		prev_tx_hash: string | null;
		sequence_number: number;
		signature: string;
		status: string;
	}[]
> {
	const database = db ?? await getDb();
	await migrateIfNeeded(database);

	const entries = await database.getAllAsync<{
		id: string;
		from_pub_key: string;
		to_pub_key: string;
		amount: number;
		prev_tx_hash: string | null;
		sequence_number: number;
		signature: string;
		status: string;
	}>("SELECT * FROM ledger WHERE status = 'pending' ORDER BY sequence_number ASC");

	return entries;
}

export async function retryPendingPush(db?: SQLiteDatabase): Promise<number> {
	const database = db ?? await getDb();
	await migrateIfNeeded(database);

	const pending = await getPendingEntries(database);
	const rpcClient = await getClient();
	let successCount = 0;

	for (const entry of pending) {
		try {
			await rpcClient.sync.push({
				id: entry.id,
				fromPubKey: entry.from_pub_key,
				toPubKey: entry.to_pub_key,
				amount: entry.amount,
				prevTxHash: entry.prev_tx_hash,
				sequenceNumber: entry.sequence_number,
				signature: entry.signature,
				status: "sent",
			});

			await database.runAsync(
				"UPDATE ledger SET status = 'sent', updated_at = strftime('%s', 'now') WHERE id = ?",
				[entry.id],
			);

			successCount++;
		} catch {
			break;
		}
	}

	const remaining = await getPendingEntries(database);
	if (remaining.length === 0) {
		await setPendingPushFlag(false);
	} else {
		await setPendingPushFlag(true);
	}

	return successCount;
}

export type TopUpResponse = {
	entry: {
		id: string;
		userId: string;
		fromPubKey: string;
		toPubKey: string;
		amount: number;
		prevTxHash: string | null;
		sequenceNumber: number;
		signature: string;
		status: string;
		createdAt: string;
		updatedAt: string;
	};
	walletId: string;
	newBalance: number;
};

export async function handleTopUpResponse(
	topUpResponse: TopUpResponse,
	db?: SQLiteDatabase,
): Promise<void> {
	const database = db ?? await getDb();
	await migrateIfNeeded(database);

	const { entry } = topUpResponse;

	await database.runAsync(
		`INSERT OR REPLACE INTO ledger (id, from_pub_key, to_pub_key, amount, prev_tx_hash, sequence_number, signature, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			entry.id,
			entry.fromPubKey,
			entry.toPubKey,
			entry.amount,
			entry.prevTxHash,
			entry.sequenceNumber,
			entry.signature,
			entry.status,
			Math.floor(new Date(entry.createdAt).getTime() / 1000),
			Math.floor(new Date(entry.updatedAt).getTime() / 1000),
		],
	);
}
