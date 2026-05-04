import { Tag } from "lucide-react"

import { cn } from "@/lib/utils"

export function DiscountBadge({
  percent,
  className,
  showIcon = true,
}: {
  percent: number
  className?: string
  showIcon?: boolean
}) {
  return (
    <span
      className={cn(
        "badge-discount inline-flex items-center justify-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black",
        className,
      )}
    >
      {showIcon && <Tag className="w-2.5 h-2.5" aria-hidden="true" />}
      -{percent}%
    </span>
  )
}
