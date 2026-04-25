import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const TxStatus = {
	PENDING: "pending",
	SENT: "sent",
	ACKNOWLEDGED: "acknowledged",
	REJECTED: "rejected",
} as const;

export type TxStatus = (typeof TxStatus)[keyof typeof TxStatus];

export const ledger = sqliteTable("ledger", {
	id: text("id").primaryKey(),
	fromPubKey: text("from_pub_key").notNull(),
	toPubKey: text("to_pub_key").notNull(),
	amount: integer("amount").notNull(),
	prevTxHash: text("prev_tx_hash"),
	sequenceNumber: integer("sequence_number").notNull(),
	signature: text("signature").notNull(),
	status: text("status", {
		enum: ["pending", "sent", "acknowledged", "rejected"],
	})
		.default("pending")
		.notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const ledgerRelations = relations(ledger, ({ many }) => ({
	transactions: many(ledger),
}));

export type Ledger = typeof ledger.$inferSelect;
export type NewLedger = typeof ledger.$inferInsert;
