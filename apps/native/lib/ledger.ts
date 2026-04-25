import type { SQLiteDatabase } from "expo-sqlite";
import { pushEntry } from "./sync";

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
`;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
	await db.execAsync("PRAGMA journal_mode = 'wal';");
	await db.execAsync(LEDGER_TABLE_SQL);
}

export const TxStatus = {
	PENDING: "pending",
	SENT: "sent",
	ACKNOWLEDGED: "acknowledged",
	REJECTED: "rejected",
} as const;

export type TxStatus = (typeof TxStatus)[keyof typeof TxStatus];

export interface LedgerRow {
	id: string;
	from_pub_key: string;
	to_pub_key: string;
	amount: number;
	prev_tx_hash: string | null;
	sequence_number: number;
	signature: string;
	status: TxStatus;
	created_at: number;
	updated_at: number;
}

export type NewLedgerRow = Omit<LedgerRow, "created_at" | "updated_at">;

export async function getLatestEntry(
	db: SQLiteDatabase,
): Promise<LedgerRow | null> {
	const result = await db.getFirstAsync<LedgerRow>(
		"SELECT * FROM ledger ORDER BY sequence_number DESC LIMIT 1",
	);
	return result;
}

export async function getNextSequenceNumber(
	db: SQLiteDatabase,
): Promise<number> {
	const latest = await getLatestEntry(db);
	return (latest?.sequence_number ?? 0) + 1;
}

export async function getBalance(
	db: SQLiteDatabase,
	userPubKey: string,
): Promise<number> {
	const received = await db.getAllAsync<{ total: number }>(
		"SELECT COALESCE(SUM(amount), 0) as total FROM ledger WHERE to_pub_key = ? AND status = ?",
		[userPubKey, TxStatus.ACKNOWLEDGED],
	);

	const sent = await db.getAllAsync<{ total: number }>(
		"SELECT COALESCE(SUM(amount), 0) as total FROM ledger WHERE from_pub_key = ? AND status = ?",
		[userPubKey, TxStatus.ACKNOWLEDGED],
	);

	return (received[0]?.total ?? 0) - (sent[0]?.total ?? 0);
}

export async function addTransaction(
	db: SQLiteDatabase,
	tx: NewLedgerRow,
): Promise<void> {
	await db.runAsync(
		`INSERT INTO ledger (id, from_pub_key, to_pub_key, amount, prev_tx_hash, sequence_number, signature, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			tx.id,
			tx.from_pub_key,
			tx.to_pub_key,
			tx.amount,
			tx.prev_tx_hash,
			tx.sequence_number,
			tx.signature,
			tx.status,
		],
	);

	try {
		await pushEntry(
			{
				id: tx.id,
				fromPubKey: tx.from_pub_key,
				toPubKey: tx.to_pub_key,
				amount: tx.amount,
				prevTxHash: tx.prev_tx_hash,
				sequenceNumber: tx.sequence_number,
				signature: tx.signature,
				status: tx.status,
			},
			db,
		);
	} catch (error) {
		console.error("Failed to push transaction, will retry when online:", error);
	}
}

export async function updateTransactionStatus(
	db: SQLiteDatabase,
	id: string,
	status: TxStatus,
): Promise<void> {
	await db.runAsync(
		"UPDATE ledger SET status = ?, updated_at = strftime('%s', 'now') WHERE id = ?",
		[status, id],
	);
}
