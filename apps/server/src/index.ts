import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@mirror-scan/api/context";
import { appRouter, runAiQuery } from "@mirror-scan/api/routers/index";
import { auth } from "@mirror-scan/auth";
import { env } from "@mirror-scan/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { processQuery } from "./query-engine";
import { db } from "@mirror-scan/db";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.post("/chat", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const { message, history = [] } = body;

	if (!message || typeof message !== "string" || message.trim().length === 0) {
		return c.json({ error: "message is required" }, 400);
	}
	if (message.length > 1000) {
		return c.json({ error: "message must be 1000 characters or fewer" }, 400);
	}

	const response = await processQuery({
		message,
		history,
		userId: session.user.id,
	});
	return response;
});

app.post("/ai/query", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

	const body = await c.req.json();
	const { prompt } = body;

	if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
		return c.json({ error: "prompt is required" }, 400);
	}
	if (prompt.length > 1000) {
		return c.json({ error: "prompt must be 1000 characters or fewer" }, 400);
	}

	try {
		const result = await runAiQuery({
			message: prompt,
			history: [],
			userId: session.user.id,
			llmApiKey: env.LLM_API_KEY!,
			llmBaseUrl: env.LLM_BASE_URL,
			llmModel: env.LLM_MODEL,
			db,
		});
		return c.json(result);
	} catch (err) {
		const message = err instanceof Error ? err.message : "AI query failed";
		return c.json({ error: message }, 500);
	}
});

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: context,
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: context,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
	return c.text("OK");
});

import { serve } from "@hono/node-server";

serve(
	{
		fetch: app.fetch,
		port: 3000,
		hostname: "0.0.0.0",
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
