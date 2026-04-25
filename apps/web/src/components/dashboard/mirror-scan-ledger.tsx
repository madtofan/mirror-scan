import { useMemo, useState } from "react"
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mirror-scan/ui/components/table"

import { MOCK_TRANSACTIONS, type MirrorTransaction } from "./mock-data"

type SortField = keyof MirrorTransaction
type SortDir = "asc" | "desc"
type StatusFilter = "All" | "Synced" | "Pending"

const PAGE_SIZE = 10

const COLUMNS: { key: SortField; label: string }[] = [
	{ key: "id", label: "Transaction ID" },
	{ key: "sender", label: "Sender" },
	{ key: "receiver", label: "Receiver" },
	{ key: "amount", label: "Amount (RM)" },
	{ key: "status", label: "Status" },
	{ key: "timestamp", label: "Timestamp" },
]

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
	if (sortField !== field)
		return <ArrowUpDown className="size-3 opacity-25" />
	return sortDir === "asc" ? (
		<ChevronUp className="size-3 text-tng-cyan" />
	) : (
		<ChevronDown className="size-3 text-tng-cyan" />
	)
}

function StatusBadge({ status }: { status: MirrorTransaction["status"] }) {
	const synced = status === "Synced"
	return (
		<Badge
			variant="outline"
			className="gap-1.5 border-tng-success/25 text-tng-success"
			style={
				synced
					? {
							borderColor: "oklch(0.67 0.17 162 / 25%)",
							color: "var(--tng-success)",
							background: "oklch(0.67 0.17 162 / 8%)",
						}
					: {
							borderColor: "oklch(0.78 0.16 75 / 25%)",
							color: "var(--tng-warning)",
							background: "oklch(0.78 0.16 75 / 8%)",
						}
			}
		>
			<span
				className="inline-block size-1.5 rounded-full"
				style={{
					background: synced ? "var(--tng-success)" : "var(--tng-warning)",
					boxShadow: synced
						? "0 0 6px oklch(0.67 0.17 162 / 50%)"
						: "0 0 6px oklch(0.78 0.16 75 / 50%)",
				}}
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

export function MirrorScanLedger() {
	const [sortField, setSortField] = useState<SortField>("timestamp")
	const [sortDir, setSortDir] = useState<SortDir>("desc")
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
	const [searchTerm, setSearchTerm] = useState("")
	const [currentPage, setCurrentPage] = useState(1)

	const processedData = useMemo(() => {
		let data = [...MOCK_TRANSACTIONS]

		if (statusFilter !== "All") {
			data = data.filter((t) => t.status === statusFilter)
		}

		if (searchTerm) {
			const q = searchTerm.toLowerCase()
			data = data.filter(
				(t) =>
					t.id.toLowerCase().includes(q) ||
					t.sender.toLowerCase().includes(q) ||
					t.receiver.toLowerCase().includes(q),
			)
		}

		data.sort((a, b) => {
			let av: string | number = a[sortField]
			let bv: string | number = b[sortField]

			if (sortField === "amount") {
				av = Number(av)
				bv = Number(bv)
			}
			if (sortField === "timestamp") {
				av = new Date(av as string).getTime()
				bv = new Date(bv as string).getTime()
			}
			if (typeof av === "string" && typeof bv === "string") {
				return sortDir === "asc"
					? av.localeCompare(bv)
					: bv.localeCompare(av)
			}
			return sortDir === "asc"
				? (av as number) - (bv as number)
				: (bv as number) - (av as number)
		})

		return data
	}, [statusFilter, searchTerm, sortField, sortDir])

	const totalPages = Math.ceil(processedData.length / PAGE_SIZE)
	const pageData = processedData.slice(
		(currentPage - 1) * PAGE_SIZE,
		currentPage * PAGE_SIZE,
	)

	function handleSort(field: SortField) {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"))
		} else {
			setSortField(field)
			setSortDir("asc")
		}
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
						{processedData.length} records
					</span>
				</div>
				<div className="flex items-center gap-2">
					{/* Search */}
					<div className="relative">
						<Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value)
								setCurrentPage(1)
							}}
							placeholder="Search..."
							className="h-7 w-40 rounded-md border border-border bg-transparent pr-2 pl-7 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-tng-cyan/30"
						/>
					</div>
					{/* Status filters */}
					{(["All", "Synced", "Pending"] as const).map((s) => (
						<Button
							key={s}
							size="xs"
							variant={statusFilter === s ? "default" : "outline"}
							onClick={() => {
								setStatusFilter(s)
								setCurrentPage(1)
							}}
							className={
								statusFilter === s
									? "bg-gradient-to-r from-tng-blue to-tng-cyan text-white border-0"
									: ""
							}
						>
							{s}
						</Button>
					))}
				</div>
			</CardHeader>

			<CardContent className="p-0">
				{/* Table */}
				<Table>
					<TableHeader>
						<TableRow>
							{COLUMNS.map((col) => (
								<TableHead
									key={col.key}
									className="cursor-pointer select-none bg-card/80"
									onClick={() => handleSort(col.key)}
								>
									<div className="flex items-center gap-1.5">
										{col.label}
										<SortIcon
											field={col.key}
											sortField={sortField}
											sortDir={sortDir}
										/>
									</div>
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{pageData.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-12 text-center text-muted-foreground"
								>
									No transactions match your filters.
								</TableCell>
							</TableRow>
						) : (
							pageData.map((tx) => (
								<TableRow key={tx.id} className="hover:bg-tng-cyan/5">
									<TableCell className="font-mono text-xs text-tng-cyan">
										{tx.id}
									</TableCell>
									<TableCell>{tx.sender}</TableCell>
									<TableCell>
										<div>{tx.receiver}</div>
										<div className="text-xs text-muted-foreground/60">
											{tx.location}
										</div>
									</TableCell>
									<TableCell className="font-semibold">
										{tx.amount.toLocaleString("en-MY", {
											minimumFractionDigits: 2,
										})}
									</TableCell>
									<TableCell>
										<StatusBadge status={tx.status} />
									</TableCell>
									<TableCell className="text-muted-foreground">
										{formatTimestamp(tx.timestamp)}
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
						{processedData.length > 0
							? (currentPage - 1) * PAGE_SIZE + 1
							: 0}
						&ndash;
						{Math.min(currentPage * PAGE_SIZE, processedData.length)} of{" "}
						{processedData.length}
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
						{Array.from({ length: totalPages }, (_, i) => i + 1).map(
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
