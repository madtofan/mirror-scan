import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface StatusPieChartProps {
	data: Array<{ name: string; value: number; fill: string }>
}

export function StatusPieChart({ data }: StatusPieChartProps) {
	return (
		<div style={{ height: 300 }}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={60}
						outerRadius={100}
						paddingAngle={3}
						dataKey="value"
					>
						{data.map((entry) => (
							<Cell key={entry.name} fill={entry.fill} />
						))}
					</Pie>
					<Tooltip
						formatter={(value: number, name: string) => [value, name]}
					/>
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</div>
	)
}
