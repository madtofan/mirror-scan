import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"

interface SyncActivityBarChartProps {
	data: Array<{ date: string; acknowledged: number; sent: number }>
}

export function SyncActivityBarChart({ data }: SyncActivityBarChartProps) {
	return (
		<div style={{ height: 300 }}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
				>
					<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
					<XAxis
						dataKey="date"
						tick={{ fontSize: 12 }}
						className="text-muted-foreground"
					/>
					<YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
					<Tooltip />
					<Legend />
					<Bar
						dataKey="acknowledged"
						name="Acknowledged"
						fill="hsl(var(--chart-2))"
						radius={[2, 2, 0, 0]}
					/>
					<Bar
						dataKey="sent"
						name="Sent"
						fill="hsl(var(--chart-4))"
						radius={[2, 2, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	)
}
