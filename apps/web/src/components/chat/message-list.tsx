import { useEffect, useRef } from "react"
import { ScrollArea } from "@mirror-scan/ui/components/scroll-area"
import { Skeleton } from "@mirror-scan/ui/components/skeleton"
import { MessageBubble } from "./message-bubble"

interface Message {
	role: "user" | "assistant"
	content: string
}

interface MessageListProps {
	messages: Message[]
	isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages.length])

	return (
		<ScrollArea className="flex-1 overflow-y-auto">
			<div className="flex flex-col gap-3 p-2">
				{messages.length === 0 && !isLoading ? (
					<div className="flex h-full items-center justify-center py-16 text-center text-sm text-muted-foreground">
						Ask a question about your wallets or transactions.
					</div>
				) : (
					messages.map((m, i) => (
						<MessageBubble key={i} role={m.role} content={m.content} />
					))
				)}
				{isLoading && (
					<div className="flex justify-start">
						<Skeleton className="h-8 w-3/4 rounded-lg" />
					</div>
				)}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	)
}
