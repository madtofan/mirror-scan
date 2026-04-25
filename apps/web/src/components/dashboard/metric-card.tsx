import type { LucideIcon } from "lucide-react"
import { cn } from "@mirror-scan/ui/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mirror-scan/ui/components/card"

interface MetricCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  variant?: "default" | "danger"
  description?: string
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  description,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("size-4 opacity-70", variant === "danger" && "text-destructive")} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variant === "danger" && "text-destructive")}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
