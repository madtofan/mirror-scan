import { useState } from "react"
import { Textarea } from "@mirror-scan/ui/components/textarea"
import { Button } from "@mirror-scan/ui/components/button"
import { SendHorizonal } from "lucide-react"

interface ChatInputProps {
	onSend: (message: string) => void
	isLoading: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
	const [value, setValue] = useState("")

	function handleSend() {
		if (value.trim().length === 0) return
		onSend(value.trim())
		setValue("")
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<div className="flex items-end gap-2">
			<Textarea
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Ask a question about your wallets or transactions… (Enter to send, Shift+Enter for new line)"
				maxLength={1000}
				disabled={isLoading}
				className="min-h-[60px] flex-1 resize-none"
				rows={2}
			/>
			<Button
				onClick={handleSend}
				disabled={isLoading || value.trim().length === 0}
				size="icon"
				aria-label="Send message"
			>
				<SendHorizonal className="size-4" />
			</Button>
		</div>
	)
}
