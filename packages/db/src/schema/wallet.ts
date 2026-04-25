import { relations } from "drizzle-orm";
import {
  bigint,
  integer,
  pgTable,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const wallet = pgTable(
  "wallet",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("My Wallet"),
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("wallet_userId_idx").on(table.userId)],
);

export const walletKey = pgTable(
  "wallet_key",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => wallet.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(),
    privateKeyEncrypted: text("private_key_encrypted").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("wallet_key_walletId_idx").on(table.walletId)],
);

export const ledger = pgTable(
  "ledger",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fromPubKey: text("from_pub_key").notNull(),
    toPubKey: text("to_pub_key").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    prevTxHash: text("prev_tx_hash"),
    sequenceNumber: integer("sequence_number").notNull(),
    signature: text("signature").notNull(),
    status: text("status", {
      enum: ["pending", "sent", "acknowledged", "rejected"],
    })
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("ledger_userId_idx").on(table.userId),
    index("ledger_status_idx").on(table.status),
  ],
);

export const walletRelations = relations(wallet, ({ one, many }) => ({
  user: one(user, {
    fields: [wallet.userId],
    references: [user.id],
  }),
  keys: many(walletKey),
}));

export const walletKeyRelations = relations(walletKey, ({ one }) => ({
  wallet: one(wallet, {
    fields: [walletKey.walletId],
    references: [wallet.id],
  }),
}));

export const ledgerRelations = relations(ledger, ({ one }) => ({
  user: one(user, {
    fields: [ledger.userId],
    references: [user.id],
  }),
}));
