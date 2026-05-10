import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface ValueBoxProps {
  title: string
  value: string
  subtitle?: string
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  variant?: "default" | "success" | "warning" | "danger"
  className?: string
  large?: boolean
}

export function ValueBox({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  className,
  large = false,
}: ValueBoxProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        large && "p-6",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p
            className={cn(
              "tabular-nums font-bold tracking-tight",
              large ? "text-3xl" : "text-2xl",
              variant === "success" && "text-emerald-600 dark:text-emerald-400",
              variant === "warning" && "text-amber-600 dark:text-amber-400",
              variant === "danger" && "text-red-600 dark:text-red-400"
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  "font-medium",
                  trend === "up" && "text-red-500",
                  trend === "down" && "text-emerald-500",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" ? "\u2191" : trend === "down" ? "\u2193" : "\u2192"}{" "}
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "rounded-lg p-2",
              variant === "default" && "bg-primary/10 text-primary",
              variant === "success" &&
                "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
              variant === "warning" &&
                "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
              variant === "danger" &&
                "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}
