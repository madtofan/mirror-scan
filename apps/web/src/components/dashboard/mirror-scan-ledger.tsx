import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
	ArrowUpDown,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Database,
	Search,
} from "lucide-react"

import { Badge } from "@mirror-scan/ui/components/badge"
import { Button } from "@mirror-scan/ui/components/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@mirror-scan/ui/components/card"
import { Skeleton } from "@mirror-scan/ui/components/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mirror-scan/ui/components/table"

import { orpc } from "@/utils/orpc"

type StatusFilter = "All" | "pending" | "sent" | "acknowledged" | "rejected"
type SortDir = "asc" | "desc"

const PAGE_SIZE = 10

interface LedgerEntry {
	id: string
	userId: string
	fromPubKey: string
	toPubKey: string
	amount: number
	prevTxHash: string | null
	sequenceNumber: number
	status: string
	createdAt: string
	updatedAt: string
}

function StatusBadge({ status }: { status: string }) {
	const synced = status === "acknowledged"
	const sent = status === "sent"
	const rejected = status === "rejected"

	const style = synced
		? {
			borderColor: "oklch(0.67 0.17 162 / 25%)",
			color: "var(--tng-success)",
			background: "oklch(0.67 0.17 162 / 8%)",
		}
		: rejected
			? {
				borderColor: "oklch(0.65 0.22 25 / 25%)",
				color: "oklch(0.65 0.22 25)",
				background: "oklch(0.65 0.22 25 / 8%)",
			}
			: sent
				? {
					borderColor: "oklch(0.78 0.16 75 / 25%)",
					color: "var(--tng-warning)",
					background: "oklch(0.78 0.16 75 / 8%)",
				}
				: {
					borderColor: "oklch(0.6 0.05 258 / 25%)",
					color: "oklch(0.6 0.05 258)",
					background: "oklch(0.6 0.05 258 / 8%)",
				}

	const dot = synced
		? "var(--tng-success)"
		: rejected
			? "oklch(0.65 0.22 25)"
			: sent
				? "var(--tng-warning)"
				: "oklch(0.6 0.05 258)"

	return (
		<Badge variant="outline" style={style} className="gap-1.5">
			<span
				className="inline-block size-1.5 rounded-full"
				style={{ background: dot }}
			/>
			{status}
		</Badge>
	)
}

function formatTimestamp(iso: string) {
	return new Date(iso).toLocaleString("en-MY", {
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	})
}

function truncate(str: string, len = 14) {
	return str.length > len ? `${str.slice(0, len)}…` : str
}

export function MirrorScanLedger() {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
	const [search, setSearch] = useState("")
	const [searchInput, setSearchInput] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const [sortDir, setSortDir] = useState<SortDir>("desc")

	const { data, isLoading } = useQuery(
		orpc.getLedgerEntries.queryOptions({
			input: {
				page: currentPage,
				pageSize: PAGE_SIZE,
				status: statusFilter,
				search: search || undefined,
			},
			refetchInterval: 1_000,
		}),
	)

	const entries: LedgerEntry[] = data?.entries ?? []
	const total = data?.total ?? 0
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

	function handleSearch() {
		setSearch(searchInput)
		setCurrentPage(1)
	}

	function handleStatusFilter(s: StatusFilter) {
		setStatusFilter(s)
		setCurrentPage(1)
	}

	function toggleSort() {
		setSortDir((d) => (d === "asc" ? "desc" : "asc"))
		setCurrentPage(1)
	}

	return (
		<Card className="glass overflow-hidden">
			{/* Toolbar */}
			<CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b">
				<div className="flex items-center gap-2.5">
					<Database className="size-4 text-tng-cyan" />
					<CardTitle>Mirror Scan Ledger</CardTitle>
					<span className="rounded-sm bg-tng-cyan/10 px-2 py-0.5 text-xs font-medium text-tng-cyan">
						{total} records
					</span>
				</div>
				<div className="flex items-center gap-2">
					{/* Search */}
					<div className="relative flex items-center gap-1">
						<Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder="Search ID / pubkey..."
							className="h-7 w-44 rounded-md border border-border bg-transparent pr-2 pl-7 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-tng-cyan/30"
						/>
					</div>
					{/* Status filters */}
					{(["All", "sent", "acknowledged", "pending", "rejected"] as const).map(
						(s) => (
							<Button
								key={s}
								size="xs"
								variant={statusFilter === s ? "default" : "outline"}
								onClick={() => handleStatusFilter(s)}
								className={
									statusFilter === s
										? "bg-gradient-to-r from-tng-blue to-tng-cyan text-white border-0"
										: ""
								}
							>
								{s === "All" ? "All" : s}
							</Button>
						),
					)}
				</div>
			</CardHeader>

			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>From</TableHead>
							<TableHead>To</TableHead>
							<TableHead>Amount (RM)</TableHead>
							<TableHead>Status</TableHead>
							<TableHead
								className="cursor-pointer select-none"
								onClick={toggleSort}
							>
								<div className="flex items-center gap-1.5">
									Timestamp
									{sortDir === "asc" ? (
										<ChevronUp className="size-3 text-tng-cyan" />
									) : (
										<ChevronDown className="size-3 text-tng-cyan" />
									)}
									<ArrowUpDown className="size-3 opacity-25" />
								</div>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: PAGE_SIZE }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 6 }).map((_, j) => (
										<TableCell key={j}>
											<Skeleton className="h-4 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : entries.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-12 text-center text-muted-foreground"
								>
									No transactions match your filters.
								</TableCell>
							</TableRow>
						) : (
							entries.map((entry) => (
								<TableRow key={entry.id} className="hover:bg-tng-cyan/5">
									<TableCell className="font-mono text-xs text-tng-cyan">
										{truncate(entry.id, 16)}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{truncate(entry.fromPubKey)}
									</TableCell>
									<TableCell className="font-mono text-xs">
										{truncate(entry.toPubKey)}
									</TableCell>
									<TableCell className="font-semibold">
										{(entry.amount / 100).toLocaleString("en-MY", {
											minimumFractionDigits: 2,
										})}
									</TableCell>
									<TableCell>
										<StatusBadge status={entry.status} />
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatTimestamp(entry.updatedAt)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{/* Pagination */}
				<div className="flex items-center justify-between border-t px-4 py-3">
					<span className="text-xs text-muted-foreground">
						Showing{" "}
						{total > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}
						&ndash;
						{Math.min(currentPage * PAGE_SIZE, total)} of {total}
					</span>
					<div className="flex items-center gap-1">
						<Button
							size="icon-xs"
							variant="ghost"
							disabled={currentPage === 1}
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
						>
							<ChevronLeft className="size-3.5" />
						</Button>
						{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(
							(p) => (
								<button
									key={p}
									type="button"
									onClick={() => setCurrentPage(p)}
									className="flex size-6 items-center justify-center rounded-md text-xs font-medium transition-colors"
									style={
										p === currentPage
											? {
												background:
													"linear-gradient(135deg, var(--tng-blue), var(--tng-cyan))",
												color: "white",
											}
											: { color: "var(--muted-foreground)" }
									}
								>
									{p}
								</button>
							),
						)}
						<Button
							size="icon-xs"
							variant="ghost"
							disabled={currentPage === totalPages}
							onClick={() =>
								setCurrentPage((p) => Math.min(totalPages, p + 1))
							}
						>
							<ChevronRight className="size-3.5" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
