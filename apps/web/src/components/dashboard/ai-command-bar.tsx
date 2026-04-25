import { Sparkles } from "lucide-react"
import type { FormEvent } from "react"

const SUGGESTIONS = [
	"Show today's volume by hour",
	"Top 5 merchants by volume",
	"Sync failure rate by region",
]

interface AICommandBarProps {
	value: string
	onChange: (value: string) => void
	onSubmit: (query: string) => void
}

export function AICommandBar({ value, onChange, onSubmit }: AICommandBarProps) {
	function handleSubmit(e: FormEvent) {
		e.preventDefault()
		if (value.trim()) onSubmit(value)
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="glass tng-glow rounded-lg border border-tng-cyan/15">
				<div className="flex items-center gap-3 px-4 py-3">
					<Sparkles className="size-5 shrink-0 text-tng-cyan" />
					<input
						type="text"
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Ask AI about your transaction data..."
						className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
					/>
					<button
						type="submit"
						disabled={!value.trim()}
						className="rounded-md bg-gradient-to-r from-tng-blue to-tng-cyan px-4 py-1.5 text-xs font-semibold tracking-wide text-white transition-opacity disabled:opacity-30"
					>
						Query
					</button>
				</div>
				<div className="flex flex-wrap gap-2 px-4 pb-3">
					{SUGGESTIONS.map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => onChange(s.toLowerCase())}
							className="rounded-full border border-tng-cyan/10 bg-tng-cyan/5 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-tng-cyan/25 hover:text-tng-cyan"
						>
							{s}
						</button>
					))}
				</div>
			</div>
		</form>
	)
}
