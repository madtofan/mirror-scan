import { BarChart3, Globe, Loader2, Sparkles, Terminal, X } from "lucide-react"
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"

import { Badge } from "@mirror-scan/ui/components/badge"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@mirror-scan/ui/components/card"
import { Button } from "@mirror-scan/ui/components/button"

import type { AIQueryResult } from "./mock-data"

interface AIInsightPanelProps {
	result: (AIQueryResult & { query: string }) | null
	loading: boolean
	onClose: () => void
}

export function AIInsightPanel({
	result,
	loading,
	onClose,
}: AIInsightPanelProps) {
	return (
		<Card className="glass flex h-full flex-col border-l-2 border-l-tng-cyan/15">
			{/* Header */}
			<CardHeader className="flex flex-row items-center justify-between border-b">
				<div className="flex items-center gap-2">
					<Sparkles className="size-4 text-tng-cyan" />
					<CardTitle>AI Insights</CardTitle>
					<Badge
						variant="outline"
						className="border-tng-blue/20 text-tng-cyan text-[10px]"
					>
						Qwen 3.6-Plus
					</Badge>
				</div>
				<Button size="icon-xs" variant="ghost" onClick={onClose}>
					<X className="size-3.5" />
				</Button>
			</CardHeader>

			{/* Body */}
			<CardContent className="flex-1 overflow-y-auto pt-4">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-16">
						<Loader2 className="size-8 animate-spin text-tng-cyan" />
						<p className="mt-4 text-xs text-muted-foreground">
							Generating SQL via Qwen 3.6-Plus...
						</p>
						<p className="mt-1 text-xs text-muted-foreground/60">
							Querying aya_mirrorscan_db on Alibaba Cloud RDS
						</p>
					</div>
				) : result ? (
					<div className="space-y-5">
						{/* User Query */}
						<section>
							<SectionLabel>YOUR QUERY</SectionLabel>
							<p className="text-sm text-foreground">
								&ldquo;{result.query}&rdquo;
							</p>
						</section>

						{/* Explanation */}
						<section>
							<SectionLabel>AI EXPLANATION</SectionLabel>
							<p className="text-xs leading-relaxed text-muted-foreground">
								{result.explanation}
							</p>
						</section>

						{/* Generated SQL */}
						<section>
							<div className="mb-2 flex items-center gap-1.5">
								<Terminal className="size-3 text-tng-cyan" />
								<SectionLabel>GENERATED SQL</SectionLabel>
							</div>
							<pre
								className="overflow-x-auto rounded-lg border border-tng-cyan/8 p-3.5 font-mono text-xs leading-relaxed"
								style={{
									background: "oklch(0.08 0.02 258 / 60%)",
									color: "oklch(0.80 0.10 220)",
								}}
							>
								{result.sql}
							</pre>
						</section>

						{/* Visualization */}
						<section>
							<div className="mb-2 flex items-center gap-1.5">
								<BarChart3 className="size-3 text-tng-cyan" />
								<SectionLabel>VISUALIZATION</SectionLabel>
							</div>
							<div
								className="rounded-lg border border-tng-cyan/6 p-3"
								style={{ background: "oklch(0.10 0.02 258 / 40%)" }}
							>
								<ResponsiveContainer width="100%" height={200}>
									{result.vizType === "area" ? (
										<AreaChart data={result.data}>
											<defs>
												<linearGradient
													id="areaGrad"
													x1="0"
													y1="0"
													x2="0"
													y2="1"
												>
													<stop
														offset="5%"
														stopColor="oklch(0.80 0.14 218)"
														stopOpacity={0.3}
													/>
													<stop
														offset="95%"
														stopColor="oklch(0.80 0.14 218)"
														stopOpacity={0}
													/>
												</linearGradient>
											</defs>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="oklch(1 0 0 / 4%)"
											/>
											<XAxis
												dataKey={result.xKey}
												tick={{ fontSize: 9, fill: "oklch(0.55 0 0)" }}
												axisLine={{
													stroke: "oklch(1 0 0 / 6%)",
												}}
												tickLine={false}
											/>
											<YAxis
												tick={{ fontSize: 9, fill: "oklch(0.55 0 0)" }}
												axisLine={false}
												tickLine={false}
											/>
											<Tooltip
												contentStyle={{
													background: "oklch(0.12 0.02 258 / 95%)",
													border: "1px solid oklch(0.80 0.14 218 / 20%)",
													borderRadius: 6,
													fontSize: 11,
													color: "oklch(0.9 0 0)",
												}}
											/>
											<Area
												type="monotone"
												dataKey={result.dataKey}
												stroke="oklch(0.80 0.14 218)"
												fill="url(#areaGrad)"
												strokeWidth={2}
											/>
										</AreaChart>
									) : (
										<BarChart data={result.data}>
											<defs>
												<linearGradient
													id="barGrad"
													x1="0"
													y1="0"
													x2="0"
													y2="1"
												>
													<stop
														offset="0%"
														stopColor="oklch(0.80 0.14 218)"
														stopOpacity={0.85}
													/>
													<stop
														offset="100%"
														stopColor="oklch(0.44 0.17 258)"
														stopOpacity={0.6}
													/>
												</linearGradient>
											</defs>
											<CartesianGrid
												strokeDasharray="3 3"
												stroke="oklch(1 0 0 / 4%)"
											/>
											<XAxis
												dataKey={result.xKey}
												tick={{ fontSize: 9, fill: "oklch(0.55 0 0)" }}
												axisLine={{
													stroke: "oklch(1 0 0 / 6%)",
												}}
												tickLine={false}
												angle={-15}
												textAnchor="end"
												height={45}
											/>
											<YAxis
												tick={{ fontSize: 9, fill: "oklch(0.55 0 0)" }}
												axisLine={false}
												tickLine={false}
											/>
											<Tooltip
												contentStyle={{
													background: "oklch(0.12 0.02 258 / 95%)",
													border: "1px solid oklch(0.80 0.14 218 / 20%)",
													borderRadius: 6,
													fontSize: 11,
													color: "oklch(0.9 0 0)",
												}}
											/>
											<Bar
												dataKey={result.dataKey}
												fill="url(#barGrad)"
												radius={[3, 3, 0, 0]}
											/>
										</BarChart>
									)}
								</ResponsiveContainer>
							</div>
						</section>

						{/* Integration pipeline */}
						<section
							className="rounded-lg border border-tng-blue/12 p-3.5"
							style={{ background: "oklch(0.44 0.17 258 / 6%)" }}
						>
							<div className="mb-1.5 flex items-center gap-1.5">
								<Globe className="size-3 text-tng-blue" />
								<span className="text-xs font-semibold text-muted-foreground">
									Integration Pipeline
								</span>
							</div>
							<p className="text-xs leading-relaxed text-muted-foreground/70">
								oRPC Client &rarr; AWS ECS Fargate &rarr; Qwen 3.6-Plus
								&rarr; Alibaba Cloud RDS{" "}
								<span className="opacity-60">(aya_mirrorscan_db)</span>{" "}
								&rarr; Visualization
							</p>
						</section>
					</div>
				) : null}
			</CardContent>
		</Card>
	)
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground">
			{children}
		</p>
	)
}
