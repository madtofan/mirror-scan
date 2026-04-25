import { cn } from "@mirror-scan/ui/lib/utils"

interface MessageBubbleProps {
	role: "user" | "assistant"
	content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
	const isUser = role === "user"

	return (
		<div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[80%] rounded-lg px-4 py-2",
					isUser
						? "bg-primary text-primary-foreground"
						: "bg-muted text-foreground",
				)}
			>
				<pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
			</div>
		</div>
	)
}
