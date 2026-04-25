import { useCallback, useState } from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"

import { AICommandBar } from "@/components/dashboard/ai-command-bar"
import { AIInsightPanel } from "@/components/dashboard/ai-insight-panel"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { MirrorScanLedger } from "@/components/dashboard/mirror-scan-ledger"
import {
	resolveAIQuery,
	type AIQueryResult,
} from "@/components/dashboard/mock-data"

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await authClient.getSession()
		if (!session.data) {
			redirect({
				to: "/login",
				throw: true,
			})
		}
		return { session }
	},
})

function RouteComponent() {
	const { session } = Route.useRouteContext()

	const [aiQuery, setAiQuery] = useState("")
	const [aiPanelOpen, setAiPanelOpen] = useState(false)
	const [aiResult, setAiResult] = useState<
		(AIQueryResult & { query: string }) | null
	>(null)
	const [aiLoading, setAiLoading] = useState(false)

	const handleAiSubmit = useCallback(
		(query: string) => {
			setAiLoading(true)
			setAiPanelOpen(true)
			setAiResult(null)

			// Simulates: orpc.ai.queryData.mutate({ prompt: query })
			// In production, replace with actual oRPC call to Qwen 3.6-Plus
			setTimeout(() => {
				const mock = resolveAIQuery(query)
				setAiResult({ ...mock, query })
				setAiLoading(false)
			}, 1800)
		},
		[],
	)

	return (
		<div className="overflow-y-auto p-6">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Page header */}
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Transaction Dashboard
					</h1>
					<p className="text-sm text-muted-foreground">
						Welcome, {session.data?.user.name} &mdash; Mirror Scan Analytics
					</p>
				</div>

				{/* AI Command Bar */}
				<AICommandBar
					value={aiQuery}
					onChange={setAiQuery}
					onSubmit={handleAiSubmit}
				/>

				{/* KPI Summary Cards */}
				<KPICards />

				{/* Main content area: Ledger + AI Panel */}
				<div className="flex items-start gap-4">
					<div
						className="min-w-0 flex-1 transition-all duration-300"
						style={{ flex: aiPanelOpen ? "1 1 0%" : "1 1 100%" }}
					>
						<MirrorScanLedger />
					</div>

					{aiPanelOpen && (
						<div className="w-[420px] shrink-0 transition-all duration-300">
							<AIInsightPanel
								result={aiResult}
								loading={aiLoading}
								onClose={() => setAiPanelOpen(false)}
							/>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between text-xs text-muted-foreground/40">
					<span>
						Touch 'n Go eWallet &middot; Mirror Scan v2.4.0 &middot;
						aya_mirrorscan_db
					</span>
					<span>Powered by Alibaba Cloud RDS + AWS ECS Fargate</span>
				</div>
			</div>
		</div>
	)
}
