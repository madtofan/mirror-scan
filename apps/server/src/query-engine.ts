import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { db } from "@mirror-scan/db";
import { sql } from "drizzle-orm";
import { env } from "@mirror-scan/env/server";
import { SCHEMA_CONTEXT } from "./schema-context";

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface ProcessQueryParams {
	message: string;
	history: ChatMessage[];
	userId: string;
}

export class SafeQueryError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SafeQueryError";
	}
}

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

function createLLM() {
	if (!env.LLM_API_KEY) {
		throw new Error("LLM_API_KEY not configured");
	}

	const baseURL = env.LLM_BASE_URL ?? "https://api.openai.com/v1";

	return createOpenAI({
		apiKey: env.LLM_API_KEY,
		baseURL,
	});
}

function errorToSseResponse(errorMessage: string): Response {
	const encoder = new TextEncoder();
	const readable = new ReadableStream({
		start(controller) {
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`,
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

function toDataStreamResponse(
	stream: ReturnType<typeof streamText>,
	sql?: string,
): Response {
	const encoder = new TextEncoder();
	const readable = new ReadableStream({
		async start(controller) {
			if (sql) {
				controller.enqueue(
					encoder.encode(`data: ${JSON.stringify({ type: "sql", content: sql })}\n\n`),
				);
			}
			for await (const chunk of stream.textStream) {
				const data = JSON.stringify({ type: "text", content: chunk });
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			}
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

export async function processQuery(
	params: ProcessQueryParams,
): Promise<Response> {
	const { message, history, userId } = params;

	if (!env.LLM_API_KEY) {
		return errorToSseResponse(
			"The AI service is not configured. Please contact your administrator.",
		);
	}

	const openai = createLLM();
	const model = env.LLM_MODEL ?? "gpt-4o";

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
		console.log({ sqlStr });
	} catch (err) {
		console.error("[query-engine] LLM Call 1 (SQL generation) failed:", err);
		return errorToSseResponse(
			"The AI service is currently unavailable. Please try again later.",
		);
	}

	if (sqlStr === "OUT_OF_SCOPE") {
		return errorToSseResponse(
			"I can only answer questions about wallets and transactions in the system.",
		);
	}

	try {
		validateSafeQuery(sqlStr, userId);
	} catch (err) {
		if (err instanceof SafeQueryError) {
			return errorToSseResponse(
				"I cannot execute that query for security reasons.",
			);
		}
		throw err;
	}

	let rows: unknown;
	try {
		rows = await Promise.race([
			db.execute(sql.raw(sqlStr) as any),
			new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("timeout")), 10_000),
			),
		]);
	} catch (err) {
		if (err instanceof Error && err.message === "timeout") {
			return errorToSseResponse(
				"The query took too long to execute. Please try a simpler question.",
			);
		}
		console.error("[query-engine] DB query failed:", err);
		return errorToSseResponse(
			"A database error occurred. Please try again.",
		);
	}

	const resultsJson = JSON.stringify(rows, null, 2);
	const answerPrompt = `The user asked: "${message}"

The database returned the following results:
${resultsJson}

Please provide a clear, concise, human-readable answer based on these results.
If the results are empty, say that no matching records were found.
Do not expose raw SQL or internal field names unnecessarily.`;

	try {
		const result = streamText({
			model: openai(model),
			messages: [{ role: "user", content: answerPrompt }],
		});

		return toDataStreamResponse(result, sqlStr);
	} catch (err) {
		console.error("[query-engine] LLM Call 2 (answer generation) failed:", err);
		return errorToSseResponse(
			"The AI service is currently unavailable. Please try again later.",
		);
	}
}
