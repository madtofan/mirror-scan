import type { LucideIcon } from "lucide-react"
import { Activity, CheckCircle2, MapPin, TrendingUp } from "lucide-react"

import {
	Card,
	CardContent,
	CardHeader,
} from "@mirror-scan/ui/components/card"
import { MOCK_KPI } from "./mock-data"

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

export function KPICards() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<KPIItem
				icon={Activity}
				label="Total Handshake Volume"
				value={`RM ${MOCK_KPI.totalVolume.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
				subtext="Total RM processed offline (72h window)"
				accentClass="tng-cyan"
			/>
			<KPIItem
				icon={CheckCircle2}
				label="Sync Success Rate"
				value={`${MOCK_KPI.syncRate}%`}
				subtext="Offline tokens synced to Alibaba RDS"
				accentClass="tng-success"
			/>
			<KPIItem
				icon={MapPin}
				label="Active Heartlands"
				value={MOCK_KPI.activeHeartlands}
				subtext="Unique merchant locations using Mirror Scan"
				accentClass="tng-blue"
			/>
		</div>
	)
}
