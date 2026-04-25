import { cn } from "@mirror-scan/ui/lib/utils"
import type * as React from "react"

function ScrollArea({
	className,
	children,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="scroll-area"
			className={cn("relative overflow-auto", className)}
			{...props}
		>
			{children}
		</div>
	)
}

export { ScrollArea }
