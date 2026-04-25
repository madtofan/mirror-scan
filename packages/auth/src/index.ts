// import { expo } from "@better-auth/expo";
// import { createDb } from "@mirror-scan/db";
// import * as schema from "@mirror-scan/db/schema/auth";
// import { env } from "@mirror-scan/env/server";
// import { betterAuth } from "better-auth";
// import { drizzleAdapter } from "better-auth/adapters/drizzle";
//
// export function createAuth() {
// 	const db = createDb();
//
// 	return betterAuth({
// 		database: drizzleAdapter(db, {
// 			provider: "pg",
//
// 			schema: schema,
// 		}),
// 		trustedOrigins: [
// 			env.CORS_ORIGIN,
// 			"mirror-scan://",
// 			...(env.NODE_ENV === "development"
// 				? [
// 						"exp://",
// 						"exp://**",
// 						"exp://192.168.*.*:*/**",
// 						"http://localhost:8081",
// 					]
// 				: []),
// 		],
// 		emailAndPassword: {
// 			enabled: true,
// 		},
// 		secret: env.BETTER_AUTH_SECRET,
// 		baseURL: env.BETTER_AUTH_URL,
// 		advanced: {
// 			defaultCookieAttributes: {
// 				sameSite: "none",
// 				secure: true,
// 				httpOnly: true,
// 			},
// 		},
// 		plugins: [expo()],
// 	});
// }
//
// export const auth = createAuth();

import { expo } from "@better-auth/expo";
import { createDb } from "@mirror-scan/db";
import * as schema from "@mirror-scan/db/schema/auth";
import { env } from "@mirror-scan/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",

			schema: schema,
		}),
		trustedOrigins: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"http://Ahmads-MacBook-Air.local:3000",
			"http://Ahmads-MacBook-Air.local:3001",
			"exp://",
			"exp://**",
			"exp://192.168.*.*:*/**",
			"http://localhost:8081",
		],
		emailAndPassword: {
			enabled: true,
		},
		session: {
			cookieCache: { enabled: true }
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		// disableCookieCache: true,
		advanced: {
			defaultCookieAttributes: {
				secure: false,
				sameSite: "lax",
				httpOnly: true,
				allowLocalhostUnsecure: true,
			},
		},
		plugins: [expo()],
	});
}

export const auth = createAuth();
