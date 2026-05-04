import type { ElementType } from "react"

import { cn } from "@/lib/utils"

export function DashboardMetricCard({
  label,
  value,
  trend,
  icon: Icon,
  color = "#4DA6FF",
  className,
}: {
  label: string
  value: string
  trend?: string
  icon: ElementType
  color?: string
  className?: string
}) {
  return (
    <div
      className={cn("glass-card-strong rounded-2xl p-4 shadow-xl glossy-reflect", className)}
      style={{ borderTop: `2px solid ${color}50` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-md"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
      </div>
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight mb-1">{label}</p>
      {trend && (
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {trend}
        </span>
      )}
    </div>
  )
}
