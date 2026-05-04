import type { ButtonHTMLAttributes } from "react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { DiscountBadge } from "./discount-badge"

export interface CategoryCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: string
  color: string
  count?: number
  bestDiscount?: number
  variant?: "compact" | "grid"
}

export function CategoryCard({
  label,
  icon,
  color,
  count,
  bestDiscount,
  variant = "grid",
  className,
  ...props
}: CategoryCardProps) {
  const compact = variant === "compact"

  if (compact) {
    return (
      <button
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all hover:bg-muted active:scale-95",
          className,
        )}
        {...props}
      >
        <span
          className="flex w-11 h-11 items-center justify-center rounded-2xl text-xl shadow-sm"
          style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}25` }}
          role="img"
          aria-label={label}
        >
          {icon}
        </span>
        <span className="text-[9px] font-semibold text-foreground/65 leading-tight text-center">
          {label}
        </span>
      </button>
    )
  }

  return (
    <button
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl p-4 text-left transition-all hover:shadow-lg active:scale-[0.97]",
        className,
      )}
      {...props}
    >
      <span
        className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span
        className="mb-3 flex w-12 h-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
        style={{ backgroundColor: `${color}15`, border: `1.5px solid ${color}30` }}
        role="img"
        aria-label={label}
      >
        {icon}
      </span>
      <h3 className="font-bold text-foreground text-sm mb-0.5">{label}</h3>
      {count !== undefined && (
        <p className="text-muted-foreground text-[11px] mb-2">
          {count} {count === 1 ? "product" : "products"} available
        </p>
      )}
      {bestDiscount ? <DiscountBadge percent={bestDiscount} showIcon={false} /> : null}
      <span className="mt-2 flex justify-end">
        <ChevronRight className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
      </span>
    </button>
  )
}
