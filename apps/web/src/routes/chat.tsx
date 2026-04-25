import { createFileRoute, redirect } from "@tanstack/react-router"
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react"
import { authClient } from "@/lib/auth-client"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@mirror-scan/ui/components/card"
import { MessageList } from "@/components/chat/message-list"
import { ChatInput } from "@/components/chat/chat-input"

export const Route = createFileRoute("/chat")({
	component: ChatPage,
	beforeLoad: async () => {
		const session = await authClient.getSession()
		if (!session.data) {
			redirect({ to: "/login", throw: true })
		}
		return { session }
	},
})

function ChatPage() {
	const { session } = Route.useRouteContext()
	const serverUrl =
		(import.meta.env.VITE_SERVER_URL as string | undefined) ??
		"http://localhost:3000"

	const { messages, sendMessage, isLoading, error } = useChat({
		connection: fetchServerSentEvents(`${serverUrl}/chat`, {
			credentials: "include",
		}),
	})

	// Map UIMessage objects to the simple shape our components expect
	const chatMessages = messages
		.filter((m) => m.role === "user" || m.role === "assistant")
		.map((m) => ({
			role: m.role as "user" | "assistant",
			content:
				typeof m.content === "string"
					? m.content
					: Array.isArray(m.content)
						? m.content
								.filter((p: { type: string }) => p.type === "text")
								.map((p: { type: string; text?: string }) => p.text ?? "")
								.join("")
						: "",
		}))

	return (
		<div className="flex h-full flex-col p-6">
			<div className="mb-4">
				<h1 className="text-2xl font-semibold">AI Assistant</h1>
				<p className="text-sm text-muted-foreground">
					Welcome, {session.data?.user.name}
				</p>
			</div>

			<Card className="flex flex-1 flex-col overflow-hidden">
				<CardHeader className="border-b pb-3">
					<CardTitle>Chat</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
					<MessageList messages={chatMessages} isLoading={isLoading} />
					{error && (
						<p className="text-sm text-destructive">
							{error instanceof Error
								? error.message
								: "An error occurred. Please try again."}
						</p>
					)}
					<ChatInput onSend={sendMessage} isLoading={isLoading} />
				</CardContent>
			</Card>
		</div>
	)
}
