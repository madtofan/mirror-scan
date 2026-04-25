import type { LedgerEntry } from "./mock-data"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mirror-scan/ui/components/table"
import { Badge } from "@mirror-scan/ui/components/badge"

interface FloatingTransactionsTableProps {
	data: LedgerEntry[]
}

export function FloatingTransactionsTable({
	data,
}: FloatingTransactionsTableProps) {
	const sorted = [...data].sort(
		(a, b) =>
			new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	)

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>ID</TableHead>
					<TableHead>From</TableHead>
					<TableHead>To</TableHead>
					<TableHead>Amount</TableHead>
					<TableHead>Seq #</TableHead>
					<TableHead>Updated At</TableHead>
					<TableHead>Synced Side</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{sorted.map((entry) => (
					<TableRow key={entry.id}>
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
						<TableCell>{entry.sequenceNumber}</TableCell>
						<TableCell>
							{new Date(entry.updatedAt).toLocaleDateString()}
						</TableCell>
						<TableCell>
							<Badge variant="outline">Sender</Badge>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}
