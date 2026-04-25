// TODO: Replace static mock data with real API calls:
// const floatingData = useQuery(orpc.transactions.getFloatingTransactions.queryOptions({ refetchInterval: 30_000 }))
// const doubleSpendData = useQuery(orpc.transactions.getDoubleSpendTransactions.queryOptions({ refetchInterval: 30_000 }))
// const summary = useQuery(orpc.transactions.getTransactionSummary.queryOptions({ refetchInterval: 30_000 }))

export interface LedgerEntry {
  id: string
  userId: string
  fromPubKey: string
  toPubKey: string
  amount: number
  prevTxHash: string | null
  sequenceNumber: number
  signature: string
  status: "pending" | "sent" | "acknowledged" | "rejected"
  createdAt: string
  updatedAt: string
}

export const MOCK_LEDGER: LedgerEntry[] = [
  // --- acknowledged (complete) entries ---
  {
    id: "ldg_001",
    userId: "usr_alice",
    fromPubKey: "0xabc123def456...",
    toPubKey: "0xbbb222ccc333...",
    amount: 5000,
    prevTxHash: "0xhash_genesis",
    sequenceNumber: 1,
    signature: "0xsig_001",
    status: "acknowledged",
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-01-10T08:05:00Z",
  },
  {
    id: "ldg_002",
    userId: "usr_bob",
    fromPubKey: "0xbbb222ccc333...",
    toPubKey: "0xddd444eee555...",
    amount: 2500,
    prevTxHash: "0xhash_001",
    sequenceNumber: 1,
    signature: "0xsig_002",
    status: "acknowledged",
    createdAt: "2025-01-11T09:00:00Z",
    updatedAt: "2025-01-11T09:10:00Z",
  },
  {
    id: "ldg_003",
    userId: "usr_carol",
    fromPubKey: "0xccc333fff666...",
    toPubKey: "0xaaa111bbb222...",
    amount: 7500,
    prevTxHash: "0xhash_002",
    sequenceNumber: 2,
    signature: "0xsig_003",
    status: "acknowledged",
    createdAt: "2025-01-12T10:15:00Z",
    updatedAt: "2025-01-12T10:20:00Z",
  },
  // --- sent (floating) entries ---
  {
    id: "ldg_004",
    userId: "usr_dave",
    fromPubKey: "0xddd444ggg777...",
    toPubKey: "0xeee555hhh888...",
    amount: 12050,
    prevTxHash: "0xhash_003",
    sequenceNumber: 1,
    signature: "0xsig_004",
    status: "sent",
    createdAt: "2025-01-15T13:10:00Z",
    updatedAt: "2025-01-15T13:10:00Z",
  },
  {
    id: "ldg_005",
    userId: "usr_eve",
    fromPubKey: "0xeee555iii999...",
    toPubKey: "0xfff666jjj000...",
    amount: 3000,
    prevTxHash: "0xhash_004",
    sequenceNumber: 3,
    signature: "0xsig_005",
    status: "sent",
    createdAt: "2025-01-15T11:45:00Z",
    updatedAt: "2025-01-15T11:45:00Z",
  },
  {
    id: "ldg_010",
    userId: "usr_frank",
    fromPubKey: "0xhhh888kkk111...",
    toPubKey: "0xiii999lll222...",
    amount: 8800,
    prevTxHash: "0xhash_005",
    sequenceNumber: 2,
    signature: "0xsig_010",
    status: "sent",
    createdAt: "2025-01-16T09:00:00Z",
    updatedAt: "2025-01-16T09:00:00Z",
  },
  // --- double-spend group A (shared prevTxHash) ---
  {
    id: "ldg_006",
    userId: "usr_mallory",
    fromPubKey: "0xfff666kkk111...",
    toPubKey: "0xaaa111bbb222...",
    amount: 20000,
    prevTxHash: "0xhash_doublespend_A",
    sequenceNumber: 2,
    signature: "0xsig_006",
    status: "sent",
    createdAt: "2025-01-15T12:00:00Z",
    updatedAt: "2025-01-15T12:00:00Z",
  },
  {
    id: "ldg_007",
    userId: "usr_mallory",
    fromPubKey: "0xfff666kkk111...",
    toPubKey: "0xbbb222ccc333...",
    amount: 20000,
    prevTxHash: "0xhash_doublespend_A",
    sequenceNumber: 2,
    signature: "0xsig_007",
    status: "sent",
    createdAt: "2025-01-15T12:01:00Z",
    updatedAt: "2025-01-15T12:01:00Z",
  },
  // --- double-spend group B (shared prevTxHash) ---
  {
    id: "ldg_008",
    userId: "usr_oscar",
    fromPubKey: "0xggg777lll222...",
    toPubKey: "0xccc333mmm333...",
    amount: 9000,
    prevTxHash: "0xhash_doublespend_B",
    sequenceNumber: 1,
    signature: "0xsig_008",
    status: "acknowledged",
    createdAt: "2025-01-14T09:30:00Z",
    updatedAt: "2025-01-14T09:35:00Z",
  },
  {
    id: "ldg_009",
    userId: "usr_oscar",
    fromPubKey: "0xggg777lll222...",
    toPubKey: "0xddd444nnn444...",
    amount: 9000,
    prevTxHash: "0xhash_doublespend_B",
    sequenceNumber: 1,
    signature: "0xsig_009",
    status: "sent",
    createdAt: "2025-01-14T09:31:00Z",
    updatedAt: "2025-01-14T09:31:00Z",
  },
]

// Count unique prevTxHash values that appear more than once
const _prevTxHashCounts = MOCK_LEDGER.reduce<Record<string, number>>((acc, e) => {
  if (e.prevTxHash) acc[e.prevTxHash] = (acc[e.prevTxHash] ?? 0) + 1
  return acc
}, {})

export const MOCK_SUMMARY = {
  total: MOCK_LEDGER.length,
  sent: MOCK_LEDGER.filter((e) => e.status === "sent").length,
  acknowledged: MOCK_LEDGER.filter((e) => e.status === "acknowledged").length,
  pending: MOCK_LEDGER.filter((e) => e.status === "pending").length,
  rejected: MOCK_LEDGER.filter((e) => e.status === "rejected").length,
  doubleSpendGroups: Object.values(_prevTxHashCounts).filter((count) => count > 1).length,
}

export const MOCK_STATUS_BREAKDOWN = [
  { name: "Acknowledged", value: MOCK_SUMMARY.acknowledged, fill: "hsl(var(--chart-2))" },
  { name: "Sent",         value: MOCK_SUMMARY.sent,         fill: "hsl(var(--chart-4))" },
  { name: "Pending",      value: MOCK_SUMMARY.pending,      fill: "hsl(var(--chart-3))" },
  { name: "Rejected",     value: MOCK_SUMMARY.rejected,     fill: "hsl(var(--chart-1))" },
]

export const MOCK_SYNC_ACTIVITY = [
  { date: "Jan 10", acknowledged: 3, sent: 1 },
  { date: "Jan 11", acknowledged: 5, sent: 2 },
  { date: "Jan 12", acknowledged: 8, sent: 3 },
  { date: "Jan 13", acknowledged: 4, sent: 1 },
  { date: "Jan 14", acknowledged: 6, sent: 2 },
  { date: "Jan 15", acknowledged: 5, sent: 4 },
]
