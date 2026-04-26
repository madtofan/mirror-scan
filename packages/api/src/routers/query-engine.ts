import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { sql, type SQL } from "drizzle-orm";

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface ProcessQueryParams {
	message: string;
	history: ChatMessage[];
	userId: string;
}

const FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CALL)\b/i;

export class SafeQueryError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SafeQueryError";
	}
}

export function validateSafeQuery(sqlStr: string, userId: string): void {
	if (FORBIDDEN_KEYWORDS.test(sqlStr)) {
		throw new SafeQueryError("Query contains forbidden DML/DDL keywords");
	}
	if (!sqlStr.toLowerCase().includes(userId.toLowerCase())) {
		throw new SafeQueryError("Query does not scope to the authenticated user");
	}
	if (/private_key_encrypted/i.test(sqlStr)) {
		throw new SafeQueryError("Query references forbidden column private_key_encrypted");
	}
}

export const SCHEMA_CONTEXT = `
You have access to a PostgreSQL database with the following tables:

TABLE: wallet
  id          TEXT  PRIMARY KEY
  user_id     TEXT  NOT NULL  REFERENCES user(id)
  name        TEXT  NOT NULL  DEFAULT 'My Wallet'
  balance     BIGINT NOT NULL DEFAULT 0   (amounts are in smallest currency unit, e.g. cents)
  currency    TEXT  NOT NULL  DEFAULT 'USD'
  created_at  TIMESTAMP NOT NULL
  updated_at  TIMESTAMP NOT NULL

TABLE: wallet_key
  id                    TEXT  PRIMARY KEY
  wallet_id             TEXT  NOT NULL  REFERENCES wallet(id)
  public_key            TEXT  NOT NULL
  created_at            TIMESTAMP NOT NULL
  NOTE: This table also contains a column called private_key_encrypted.
        You MUST NEVER select, reference, or mention private_key_encrypted under any circumstances.

TABLE: ledger
  id               TEXT  PRIMARY KEY
  user_id          TEXT  NOT NULL  REFERENCES user(id)
  from_pub_key     TEXT  NOT NULL
  to_pub_key       TEXT  NOT NULL
  amount           BIGINT NOT NULL  (in smallest currency unit)
  prev_tx_hash     TEXT  (nullable — hash of previous transaction in sender's chain)
  sequence_number  INTEGER NOT NULL
  signature        TEXT  NOT NULL
  status           TEXT  NOT NULL  one of: 'pending', 'sent', 'acknowledged', 'rejected'
  created_at       TIMESTAMP NOT NULL
  updated_at       TIMESTAMP NOT NULL

RULES YOU MUST FOLLOW — NO EXCEPTIONS:
1. ALWAYS filter every query with WHERE user_id = '<userId>' (or an equivalent JOIN condition)
   using the exact userId value provided. Never omit this filter.
2. NEVER SELECT, reference, or mention the column private_key_encrypted from wallet_key.
3. ONLY generate SELECT statements. NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER,
   TRUNCATE, CALL, or any other data-modifying or schema-altering statement.
4. If the user's question cannot be answered from the tables above, respond with the
   exact literal string: OUT_OF_SCOPE
   Do not add any other text when responding with OUT_OF_SCOPE.
5. Return only the raw SQL statement — no markdown fences, no explanation, no comments.
`.trim();

export interface AiQueryResult {
	sql: string;
	explanation: string;
	vizType: "area" | "bar";
	dataKey: string;
	xKey: string;
	data: Record<string, number | string>[];
}

export async function runAiQuery(params: {
	message: string;
	history: ChatMessage[];
	userId: string;
	llmApiKey: string;
	llmBaseUrl?: string;
	llmModel?: string;
	db: { execute: (query: SQL<unknown>) => Promise<unknown> };
}): Promise<AiQueryResult> {
	const { message, history, userId, llmApiKey, llmBaseUrl, llmModel, db } = params;

	const baseURL = llmBaseUrl ?? "https://api.openai.com/v1";
	const model = llmModel ?? "gpt-4o";

	const openai = createOpenAI({ apiKey: llmApiKey, baseURL });
	const systemPrompt = SCHEMA_CONTEXT.replace(/<userId>/g, userId);

	let sqlStr: string;
	try {
		const priorMessages = [
			...history.map((m) => ({ role: m.role, content: m.content })),
			{ role: "user" as const, content: message },
		];

		const result = await generateText({
			model: openai(model),
			system: systemPrompt,
			messages: priorMessages,
		});
		sqlStr = result.text.trim();
	} catch (err) {
		throw new Error("AI service unavailable. Please try again later.");
	}

	if (sqlStr === "OUT_OF_SCOPE") {
		return {
			sql: "-- Out of scope",
			explanation: "I can only answer questions about wallets and transactions.",
			vizType: "bar",
			dataKey: "value",
			xKey: "label",
			data: [{ label: "N/A", value: 0 }],
		};
	}

	validateSafeQuery(sqlStr, userId);

	let rows: unknown;
	try {
		rows = await Promise.race([
			db.execute(sql`${sqlStr}` as unknown as SQL<unknown>),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("timeout")), 10_000),
			),
		]);
	} catch (err) {
		if (err instanceof Error && err.message === "timeout") {
			throw new Error("Query took too long. Please try a simpler question.");
		}
		throw new Error("Database error. Please try again.");
	}

	const resultArray = Array.isArray(rows) ? rows : [];
	const explanation = `Found ${resultArray.length} result(s) for your query about "${message}".`;

	const data: Record<string, number | string>[] = resultArray.length > 0
		? resultArray.map((row) => {
				const record: Record<string, number | string> = {};
				for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
					record[key] = typeof value === "number" ? value : String(value ?? "");
				}
				return record;
			})
		: [{ label: "No data", value: 0 }];

	return {
		sql: sqlStr,
		explanation,
		vizType: "bar",
		dataKey: "value",
		xKey: "label",
		data,
	};
}