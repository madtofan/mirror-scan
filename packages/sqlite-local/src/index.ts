import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "sqlite-local.db";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function initDatabase() {
	const expoDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
	db = drizzle(expoDb, { schema });
	return db;
}

export function getDatabase() {
	if (!db) {
		throw new Error("Database not initialized. Call initDatabase() first.");
	}
	return db;
}

export type { Ledger, NewLedger } from "./schema";
export { ledger, TxStatus } from "./schema";
