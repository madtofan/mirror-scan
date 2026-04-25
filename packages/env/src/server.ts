import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		LLM_API_KEY: z.string().min(1),
		LLM_MODEL: z.string().default("gpt-4o"),
		LLM_BASE_URL: z.url().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
