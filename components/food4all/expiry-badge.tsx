import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

export function ExpiryBadge({
  expiryDate,
  daysUntilExpiry,
  className,
  compact = false,
  overlay = false,
}: {
  expiryDate: string
  daysUntilExpiry: number
  className?: string
  compact?: boolean
  overlay?: boolean
}) {
  const urgent = daysUntilExpiry <= 7
  const warning = daysUntilExpiry <= 14
  const Icon = urgent ? AlertTriangle : warning ? Clock : CheckCircle2
  const label = urgent
    ? compact
      ? `${daysUntilExpiry}d left`
      : `Only ${daysUntilExpiry}d left`
    : compact
      ? `Exp: ${expiryDate}`
      : `Expires ${expiryDate}`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
        overlay
          ? "bg-black/55 text-orange-100 backdrop-blur-sm"
          : urgent
            ? "bg-danger-bg text-danger"
            : warning
              ? "badge-urgency"
              : "badge-savings",
        className,
      )}
    >
      <Icon className="w-2.5 h-2.5" aria-hidden="true" />
      {label}
    </span>
  )
}
