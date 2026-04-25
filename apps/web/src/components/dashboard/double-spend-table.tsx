import { useMemo } from "react"
import type { LedgerEntry } from "./mock-data"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mirror-scan/ui/components/table"

interface DoubleSpendTableProps {
	data: LedgerEntry[]
}

export function DoubleSpendTable({ data }: DoubleSpendTableProps) {
	const groups = useMemo(() => {
		const map = new Map<string, LedgerEntry[]>()

		for (const entry of data) {
			if (!entry.prevTxHash) continue
			const existing = map.get(entry.prevTxHash)
			if (existing) {
				existing.push(entry)
			} else {
				map.set(entry.prevTxHash, [entry])
			}
		}

		const doubleSpendGroups = Array.from(map.entries())
			.filter(([, entries]) => entries.length > 1)
			.map(([prevTxHash, entries]) => ({ prevTxHash, entries }))

		doubleSpendGroups.sort((a, b) => {
			const latestA = Math.max(
				...a.entries.map((e) => new Date(e.createdAt).getTime()),
			)
			const latestB = Math.max(
				...b.entries.map((e) => new Date(e.createdAt).getTime()),
			)
			return latestB - latestA
		})

		return doubleSpendGroups
	}, [data])

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>ID</TableHead>
					<TableHead>From</TableHead>
					<TableHead>To</TableHead>
					<TableHead>Amount</TableHead>
					<TableHead>Prev Tx Hash</TableHead>
					<TableHead>Seq #</TableHead>
					<TableHead>Created At</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{groups.flatMap(({ prevTxHash, entries }) =>
					entries.map((entry) => (
						<TableRow key={entry.id} className="bg-destructive/5">
							<TableCell className="font-mono">
								{entry.id.slice(0, 10)}…
							</TableCell>
							<TableCell className="font-mono">
								{entry.fromPubKey.slice(0, 14)}…
							</TableCell>
							<TableCell className="font-mono">
								{entry.toPubKey.slice(0, 14)}…
							</TableCell>
							<TableCell>{(entry.amount / 100).toFixed(2)}</TableCell>
							<TableCell className="font-mono">
								{prevTxHash.slice(0, 14)}…
							</TableCell>
							<TableCell>{entry.sequenceNumber}</TableCell>
							<TableCell>
								{new Date(entry.createdAt).toLocaleDateString()}
							</TableCell>
						</TableRow>
					)),
				)}
			</TableBody>
		</Table>
	)
}
