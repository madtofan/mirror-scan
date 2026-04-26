import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import type { AppRouterClient } from "@mirror-scan/api/routers/index";
import { env } from "@mirror-scan/env/web";
import { toast } from "sonner";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(`Error: ${error.message}`, {
				action: {
					label: "retry",
					onClick: query.invalidate,
				},
			});
		},
	}),
});

export const link = new RPCLink({
	url: `${env.VITE_SERVER_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const client: AppRouterClient = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);

export interface AiQueryResult {
	sql: string;
	explanation: string;
	vizType: "area" | "bar";
	dataKey: string;
	xKey: string;
	data: Record<string, number | string>[];
}

export async function runAiQuery(prompt: string): Promise<AiQueryResult> {
	const response = await fetch(`${env.VITE_SERVER_URL}/ai/query`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ prompt }),
	});

	if (!response.ok) {
		throw new Error(`AI query failed: ${response.statusText}`);
	}

	return response.json();
}
