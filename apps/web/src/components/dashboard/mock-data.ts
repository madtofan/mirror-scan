// ── Seeded PRNG for stable mock data ──────────────────────────────────
function seededRandom(seed: number) {
	let s = seed
	return () => {
		s = (s * 16807) % 2147483647
		return (s - 1) / 2147483646
	}
}

// ── Transaction types ─────────────────────────────────────────────────
export interface MirrorTransaction {
	id: string
	sender: string
	receiver: string
	amount: number
	status: "Synced" | "Pending"
	location: string
	timestamp: string
	type: "Merchant" | "P2P"
}

// ── Reference data ────────────────────────────────────────────────────
const NAMES = [
	"Ahmad Razif",
	"Siti Nurhaliza",
	"Lee Wei Ming",
	"Priya Nair",
	"Mohd Faizal",
	"Tan Siew Leng",
	"Arun Prakash",
	"Noraini Hassan",
	"Chong Wai Kit",
	"Kavitha Devi",
	"Ismail Omar",
	"Wong Mei Ling",
	"Rajesh Kumar",
	"Fatimah Zahra",
	"Lim Chee Keong",
	"Deepa Subramaniam",
	"Azman Shah",
	"Chen Xiu Mei",
	"Ganesh Muthu",
	"Nur Aisyah",
	"Daniel Khoo",
	"Saravanan Pillai",
	"Halimah Yusof",
	"Vincent Tan",
	"Ranjit Singh",
	"Nor Azizah",
	"Tommy Ooi",
	"Uma Devi",
	"Hafiz Rahman",
	"Elaine Goh",
] as const

const MERCHANTS = [
	"Kedai Runcit Ah Huat",
	"Warung Pak Mat",
	"7-Eleven PJ SS2",
	"Mamak Corner Bangsar",
	"Pasar Malam Taman Jaya",
	"Restoran Ali Maju",
	"Nasi Kandar Pelita",
	"Old Town White Coffee",
	"Mydin Subang",
	"Giant Hypermart KJ",
	"Petronas Mesra USJ",
	"Shell Select Damansara",
	"Tesco Mutiara Damansara",
	"Aeon Big Shah Alam",
	"Econsave Klang",
	"99 Speedmart Ampang",
	"KK Super Mart Cheras",
	"Family Mart KLCC",
	"Village Grocer Bangsar",
	"Lotus's Puchong",
] as const

const LOCATIONS = [
	"Petaling Jaya",
	"Shah Alam",
	"Johor Bahru",
	"Kuala Lumpur",
	"Penang",
	"Ipoh",
	"Subang Jaya",
	"Klang",
	"Seremban",
	"Melaka",
	"Kota Kinabalu",
	"Kuching",
	"Ampang",
	"Cheras",
	"Bangsar",
	"Damansara",
	"Puchong",
	"Cyberjaya",
	"Putrajaya",
	"Batu Caves",
] as const

function pick<T>(arr: readonly T[], rng: () => number): T {
	return arr[Math.floor(rng() * arr.length)]!
}

function generateTransactions(count: number): MirrorTransaction[] {
	const rng = seededRandom(42)
	const txs: MirrorTransaction[] = []

	for (let i = 0; i < count; i++) {
		const sender = pick(NAMES, rng)
		const isMerchant = rng() > 0.38
		let receiver: string

		if (isMerchant) {
			receiver = pick(MERCHANTS, rng)
		} else {
			do {
				receiver = pick(NAMES, rng)
			} while (receiver === sender)
		}

		const amount = isMerchant
			? Number.parseFloat((rng() * 480 + 5).toFixed(2))
			: Number.parseFloat((rng() * 200 + 1).toFixed(2))
		const status: MirrorTransaction["status"] =
			rng() > 0.17 ? "Synced" : "Pending"
		const hoursAgo = Math.floor(rng() * 72)
		const ts = new Date(Date.now() - hoursAgo * 3_600_000)
		const seq = String(1_000_000 + Math.floor(rng() * 9_000_000))

		txs.push({
			id: `TNG-2026-${seq}`,
			sender,
			receiver,
			amount,
			status,
			location: pick(LOCATIONS, rng),
			timestamp: ts.toISOString(),
			type: isMerchant ? "Merchant" : "P2P",
		})
	}

	return txs.sort(
		(a, b) =>
			new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	)
}

export const MOCK_TRANSACTIONS = generateTransactions(50)

// ── KPI Summaries ─────────────────────────────────────────────────────
const syncedCount = MOCK_TRANSACTIONS.filter(
	(t) => t.status === "Synced",
).length
const uniqueLocations = new Set(MOCK_TRANSACTIONS.map((t) => t.location))

export const MOCK_KPI = {
	totalVolume: MOCK_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0),
	syncRate: Number(
		((syncedCount / MOCK_TRANSACTIONS.length) * 100).toFixed(1),
	),
	activeHeartlands: uniqueLocations.size,
}

// ═══════════════════════════════════════════════════════════════════════
//  AI INTEGRATION SCAFFOLD  (Qwen 3.6-Plus via oRPC)
// ═══════════════════════════════════════════════════════════════════════
//
//  In production, add to packages/api/src/routers/index.ts:
//
//    import { z } from "zod"
//
//    export const appRouter = {
//      ...existingRoutes,
//      ai: {
//        queryData: protectedProcedure
//          .input(z.object({ prompt: z.string().min(1) }))
//          .handler(async ({ input, context }) => {
//            // 1. Forward NL prompt to Qwen 3.6-Plus (Alibaba Cloud Model Studio)
//            // 2. Receive generated SQL
//            // 3. Execute SQL on aya_mirrorscan_db (Alibaba Cloud RDS PostgreSQL)
//            // 4. Return { sql, explanation, data, visualizationHint }
//          }),
//      },
//    }
//
//  Frontend usage with oRPC:
//    const result = orpc.ai.queryData.queryOptions({ input: { prompt } })
//
//  Infra: AWS ECS Fargate <-> Alibaba Cloud Model Studio + RDS (PostgreSQL)
//
// ═══════════════════════════════════════════════════════════════════════

export interface AIQueryResult {
	sql: string
	explanation: string
	vizType: "area" | "bar"
	dataKey: string
	xKey: string
	data: Record<string, number | string>[]
}

export const AI_MOCK_RESPONSES: Record<string, AIQueryResult> = {
	volume: {
		sql: `SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*)                       AS tx_count,
  SUM(amount)                    AS total_rm
FROM mirror_transactions
WHERE created_at >= CURRENT_DATE
  AND created_at <  CURRENT_DATE + INTERVAL '1 day'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour;`,
		explanation:
			"Aggregating today's transactions by hour from mirror_transactions on aya_mirrorscan_db. This reveals peak activity windows for offline token handshakes.",
		vizType: "area",
		dataKey: "total_rm",
		xKey: "hour",
		data: [
			{ hour: "06:00", tx_count: 42, total_rm: 5200 },
			{ hour: "07:00", tx_count: 78, total_rm: 8900 },
			{ hour: "08:00", tx_count: 156, total_rm: 18400 },
			{ hour: "09:00", tx_count: 189, total_rm: 22100 },
			{ hour: "10:00", tx_count: 210, total_rm: 25600 },
			{ hour: "11:00", tx_count: 195, total_rm: 23200 },
			{ hour: "12:00", tx_count: 220, total_rm: 27800 },
			{ hour: "13:00", tx_count: 185, total_rm: 21500 },
			{ hour: "14:00", tx_count: 175, total_rm: 19800 },
			{ hour: "15:00", tx_count: 168, total_rm: 18900 },
			{ hour: "16:00", tx_count: 192, total_rm: 23400 },
			{ hour: "17:00", tx_count: 215, total_rm: 26100 },
			{ hour: "18:00", tx_count: 198, total_rm: 24300 },
			{ hour: "19:00", tx_count: 145, total_rm: 16800 },
			{ hour: "20:00", tx_count: 98, total_rm: 11200 },
			{ hour: "21:00", tx_count: 65, total_rm: 7400 },
		],
	},
	merchant: {
		sql: `SELECT
  m.name         AS merchant,
  COUNT(t.id)    AS tx_count,
  SUM(t.amount)  AS total_rm
FROM mirror_transactions t
  JOIN merchants m ON t.receiver_id = m.id
WHERE t.type = 'merchant'
  AND t.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY m.name
ORDER BY total_rm DESC
LIMIT 5;`,
		explanation:
			"Ranking the top 5 merchants by total transaction volume over the past 7 days. This highlights which Heartland locations generate the most offline-to-online activity.",
		vizType: "bar",
		dataKey: "total_rm",
		xKey: "merchant",
		data: [
			{ merchant: "Mydin Subang", total_rm: 42850 },
			{ merchant: "Giant KJ", total_rm: 38200 },
			{ merchant: "Petronas USJ", total_rm: 31400 },
			{ merchant: "Aeon Shah Alam", total_rm: 28900 },
			{ merchant: "Mamak Bangsar", total_rm: 24100 },
		],
	},
	sync: {
		sql: `SELECT
  location                                              AS region,
  COUNT(*) FILTER (WHERE status = 'pending')            AS pending,
  COUNT(*)                                              AS total,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'pending')::numeric
    / NULLIF(COUNT(*), 0)::numeric * 100, 2
  )                                                     AS failure_pct
FROM mirror_transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY location
ORDER BY failure_pct DESC;`,
		explanation:
			"Calculating sync failure rates by merchant location over the last 24 hours. High failure percentages in East Malaysia suggest intermittent connectivity in those regions.",
		vizType: "bar",
		dataKey: "failure_pct",
		xKey: "region",
		data: [
			{ region: "Kota Kinabalu", failure_pct: 24.5, total: 89 },
			{ region: "Kuching", failure_pct: 18.2, total: 102 },
			{ region: "Ipoh", failure_pct: 12.8, total: 156 },
			{ region: "Seremban", failure_pct: 8.4, total: 201 },
			{ region: "Kuala Lumpur", failure_pct: 3.1, total: 1420 },
		],
	},
}

export function resolveAIQuery(query: string): AIQueryResult {
	const q = query.toLowerCase()
	if (q.includes("merchant") || q.includes("top"))
		return AI_MOCK_RESPONSES.merchant
	if (q.includes("sync") || q.includes("fail") || q.includes("pending"))
		return AI_MOCK_RESPONSES.sync
	return AI_MOCK_RESPONSES.volume
}
