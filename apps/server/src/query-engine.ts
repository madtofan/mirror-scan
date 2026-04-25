import { chat, streamToText, toServerSentEventsResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { db } from "@mirror-scan/db";
import { sql } from "drizzle-orm";
import { env } from "@mirror-scan/env/server";
import { SCHEMA_CONTEXT } from "./schema-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface ProcessQueryParams {
	message: string;
	history: ChatMessage[];
	userId: string;
}

// ---------------------------------------------------------------------------
// SafeQueryError
// ---------------------------------------------------------------------------

export class SafeQueryError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SafeQueryError";
	}
}

// ---------------------------------------------------------------------------
// SQL safety validator
// ---------------------------------------------------------------------------

const FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CALL)\b/i;

export function validateSafeQuery(sqlStr: string, userId: string): void {
	if (FORBIDDEN_KEYWORDS.test(sqlStr)) {
		throw new SafeQueryError(
			"Query contains forbidden DML/DDL keywords",
		);
	}
	if (!sqlStr.toLowerCase().includes(userId.toLowerCase())) {
		throw new SafeQueryError(
			"Query does not scope to the authenticated user",
		);
	}
	if (/private_key_encrypted/i.test(sqlStr)) {
		throw new SafeQueryError(
			"Query references forbidden column private_key_encrypted",
		);
	}
}

// ---------------------------------------------------------------------------
// Helper: wrap a plain text string as a minimal SSE stream response
// ---------------------------------------------------------------------------

function textToSseResponse(text: string): Response {
	const stream = chat({
		adapter: openaiText("gpt-4o-mini"),
		messages: [],
		// We don't actually call the LLM here — we produce a synthetic stream
		// by yielding a single text chunk directly.
	});
	// Build a minimal AG-UI compatible SSE response from a static string
	const encoder = new TextEncoder();
	const readable = new ReadableStream({
		start(controller) {
			// RUN_STARTED
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({ type: "RUN_STARTED", threadId: "t", runId: "r" })}\n\n`,
				),
			);
			// TEXT_MESSAGE_START
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({ type: "TEXT_MESSAGE_START", messageId: "m", role: "assistant" })}\n\n`,
				),
			);
			// TEXT_MESSAGE_CONTENT
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({ type: "TEXT_MESSAGE_CONTENT", messageId: "m", delta: text })}\n\n`,
				),
			);
			// TEXT_MESSAGE_END
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({ type: "TEXT_MESSAGE_END", messageId: "m" })}\n\n`,
				),
			);
			// RUN_FINISHED
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({ type: "RUN_FINISHED", threadId: "t", runId: "r" })}\n\n`,
				),
			);
			controller.close();
		},
	});

	return new Response(readable, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

export async function processQuery(
	params: ProcessQueryParams,
): Promise<Response> {
	const { message, history, userId } = params;

	// 1. Check LLM configuration
	if (!env.LLM_API_KEY) {
		return textToSseResponse(
			"The AI service is not configured. Please contact your administrator.",
		);
	}

	const model = env.LLM_MODEL ?? "gpt-4o";
	const adapter = openaiText(model, {
		apiKey: env.LLM_API_KEY,
		...(env.LLM_BASE_URL ? { baseURL: env.LLM_BASE_URL } : {}),
	});

	// 2. Build system prompt — inject the real userId in place of the placeholder
	const systemPrompt = SCHEMA_CONTEXT.replace(/<userId>/g, userId);

	// 3. LLM Call 1 (non-streaming) — translate natural language → SQL
	let sqlStr: string;
	try {
		const priorMessages: ChatMessage[] = [
			...history,
			{ role: "user", content: message },
		];

		sqlStr = await chat({
			adapter,
			stream: false,
			systemPrompt,
			messages: priorMessages.map((m) => ({
				role: m.role,
				content: m.content,
			})),
		});

		sqlStr = sqlStr.trim();
	} catch (err) {
		console.error("[query-engine] LLM Call 1 failed:", err);
		return textToSseResponse(
			"The AI service is currently unavailable. Please try again later.",
		);
	}

	// 4. Handle out-of-scope response
	if (sqlStr === "OUT_OF_SCOPE") {
		return textToSseResponse(
			"I can only answer questions about wallets and transactions in the system.",
		);
	}

	// 5. Validate SQL safety
	try {
		validateSafeQuery(sqlStr, userId);
	} catch (err) {
		if (err instanceof SafeQueryError) {
			return textToSseResponse(
				"I cannot execute that query for security reasons.",
			);
		}
		throw err;
	}

	// 6. Execute SQL with 10-second timeout
	let rows: unknown;
	try {
		rows = await Promise.race([
			db.execute(sql.raw(sqlStr)),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("timeout")), 10_000),
			),
		]);
	} catch (err) {
		if (err instanceof Error && err.message === "timeout") {
			return textToSseResponse(
				"The query took too long to execute. Please try a simpler question.",
			);
		}
		console.error("[query-engine] DB query failed:", err);
		return textToSseResponse(
			"A database error occurred. Please try again.",
		);
	}

	// 7. LLM Call 2 (streaming) — compose human-readable answer from results
	const resultsJson = JSON.stringify(rows, null, 2);
	const answerPrompt = `The user asked: "${message}"

The database returned the following results:
${resultsJson}

Please provide a clear, concise, human-readable answer based on these results.
If the results are empty, say that no matching records were found.
Do not expose raw SQL or internal field names unnecessarily.`;

	try {
		const answerStream = chat({
			adapter,
			messages: [{ role: "user", content: answerPrompt }],
		});

		return toServerSentEventsResponse(answerStream);
	} catch (err) {
		console.error("[query-engine] LLM Call 2 failed:", err);
		return textToSseResponse(
			"The AI service is currently unavailable. Please try again later.",
		);
	}
}
