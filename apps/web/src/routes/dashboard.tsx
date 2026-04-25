import { createFileRoute, redirect } from "@tanstack/react-router"
import {
	AlertTriangle,
	ArrowUpDown,
	CheckCircle2,
	Clock,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mirror-scan/ui/components/card"

import { DoubleSpendTable } from "@/components/dashboard/double-spend-table"
import { EmptyState } from "@/components/dashboard/empty-state"
import { FloatingTransactionsTable } from "@/components/dashboard/floating-transactions-table"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
	MOCK_LEDGER,
	MOCK_STATUS_BREAKDOWN,
	MOCK_SUMMARY,
	MOCK_SYNC_ACTIVITY,
} from "@/components/dashboard/mock-data"
import { StatusPieChart } from "@/components/dashboard/status-pie-chart"
import { SyncActivityBarChart } from "@/components/dashboard/sync-activity-bar-chart"

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

	// Derive floating entries (sent = one side synced, awaiting acknowledgement)
	const floatingEntries = MOCK_LEDGER.filter((e) => e.status === "sent")

	// Derive double-spend entries (entries whose prevTxHash appears more than once)
	const prevTxHashCounts = MOCK_LEDGER.reduce<Record<string, number>>(
		(acc, e) => {
			if (e.prevTxHash) acc[e.prevTxHash] = (acc[e.prevTxHash] ?? 0) + 1
			return acc
		},
		{},
	)
	const doubleSpendEntries = MOCK_LEDGER.filter(
		(e) => e.prevTxHash && (prevTxHashCounts[e.prevTxHash] ?? 0) > 1,
	)

	return (
		<div className="overflow-y-auto p-6">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Page header */}
				<div>
					<h1 className="text-2xl font-semibold">Transaction Dashboard</h1>
					<p className="text-sm text-muted-foreground">
						Welcome, {session.data?.user.name}
					</p>
				</div>

				{/* Summary metric cards */}
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<MetricCard
						title="Total Entries"
						value={MOCK_SUMMARY.total}
						icon={ArrowUpDown}
						description="All ledger records"
					/>
					<MetricCard
						title="Sent / Floating"
						value={MOCK_SUMMARY.sent}
						icon={Clock}
						description="Awaiting acknowledgement"
					/>
					<MetricCard
						title="Acknowledged"
						value={MOCK_SUMMARY.acknowledged}
						icon={CheckCircle2}
						description="Fully synced"
					/>
					<MetricCard
						title="Double Spend"
						value={MOCK_SUMMARY.doubleSpendGroups}
						icon={AlertTriangle}
						variant="danger"
						description="Shared prevTxHash groups"
					/>
				</div>

				{/* Charts row */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Status Breakdown</CardTitle>
							<CardDescription>
								Distribution of ledger entry statuses
							</CardDescription>
						</CardHeader>
						<CardContent>
							<StatusPieChart data={MOCK_STATUS_BREAKDOWN} />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Sync Activity</CardTitle>
							<CardDescription>Last 7 days — acknowledged vs sent</CardDescription>
						</CardHeader>
						<CardContent>
							<SyncActivityBarChart data={MOCK_SYNC_ACTIVITY} />
						</CardContent>
					</Card>
				</div>

				{/* Floating transactions */}
				<Card>
					<CardHeader>
						<CardTitle>Sent / Floating Transactions</CardTitle>
						<CardDescription>
							{floatingEntries.length} entr
							{floatingEntries.length === 1 ? "y" : "ies"} awaiting
							acknowledgement
						</CardDescription>
					</CardHeader>
					<CardContent>
						{floatingEntries.length === 0 ? (
							<EmptyState message="No floating transactions" />
						) : (
							<FloatingTransactionsTable data={floatingEntries} />
						)}
					</CardContent>
				</Card>

				{/* Double-spend detections */}
				<Card>
					<CardHeader>
						<CardTitle className="text-destructive">
							Double-Spend Detections
						</CardTitle>
						<CardDescription>
							{MOCK_SUMMARY.doubleSpendGroups} group
							{MOCK_SUMMARY.doubleSpendGroups === 1 ? "" : "s"} detected —
							entries sharing the same prevTxHash
						</CardDescription>
					</CardHeader>
					<CardContent>
						{doubleSpendEntries.length === 0 ? (
							<EmptyState message="No double-spend events detected" />
						) : (
							<DoubleSpendTable data={doubleSpendEntries} />
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
