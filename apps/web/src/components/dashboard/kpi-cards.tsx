import type { LucideIcon } from "lucide-react"
import { Activity, CheckCircle2, MapPin, TrendingUp } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import {
	Card,
	CardContent,
	CardHeader,
} from "@mirror-scan/ui/components/card"
import { Skeleton } from "@mirror-scan/ui/components/skeleton"
import { orpc } from "@/utils/orpc"

interface KPIItemProps {
	icon: LucideIcon
	label: string
	value: string | number
	subtext: string
	accentClass: string
}

function KPIItem({ icon: Icon, label, value, subtext, accentClass }: KPIItemProps) {
	return (
		<Card className="glass flex-1 border-t-2" style={{ borderTopColor: `var(--${accentClass})` }}>
			<CardHeader className="flex flex-row items-center justify-between pb-1">
				<div
					className="flex size-9 items-center justify-center rounded-lg"
					style={{ background: `oklch(from var(--${accentClass}) l c h / 12%)` }}
				>
					<Icon className="size-4" style={{ color: `var(--${accentClass})` }} />
				</div>
				<TrendingUp className="size-3.5 text-tng-success opacity-60" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold tracking-tight">{value}</div>
				<p className="mt-0.5 text-sm font-medium text-muted-foreground">
					{label}
				</p>
				<p className="text-xs text-muted-foreground/60">{subtext}</p>
			</CardContent>
		</Card>
	)
}

function KPISkeleton() {
	return (
		<Card className="glass flex-1">
			<CardHeader className="pb-1">
				<Skeleton className="h-9 w-9 rounded-lg" />
			</CardHeader>
			<CardContent className="space-y-2">
				<Skeleton className="h-8 w-24" />
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-40" />
			</CardContent>
		</Card>
	)
}

export function KPICards() {
	const { data, isLoading } = useQuery(
		orpc.getDashboardKpi.queryOptions({ refetchInterval: 30_000 }),
	)

	if (isLoading || !data) {
		return (
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<KPISkeleton />
				<KPISkeleton />
				<KPISkeleton />
			</div>
		)
	}

	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<KPIItem
				icon={Activity}
				label="Total Handshake Volume"
				value={`RM ${(data.totalVolume / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
				subtext="Total RM processed offline"
				accentClass="tng-cyan"
			/>
			<KPIItem
				icon={CheckCircle2}
				label="Sync Success Rate"
				value={`${data.syncRate}%`}
				subtext="Offline tokens synced to server"
				accentClass="tng-success"
			/>
			<KPIItem
				icon={MapPin}
				label="Active Heartlands"
				value={data.activeHeartlands}
				subtext="Unique sender nodes in ledger"
				accentClass="tng-blue"
			/>
		</div>
	)
}
