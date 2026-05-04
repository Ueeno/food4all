import type { ElementType, ReactNode } from "react"

import { cn } from "@/lib/utils"

export function EmptyStateWidget({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: ElementType
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 px-8 py-16 text-center", className)}>
      <div className="w-20 h-20 rounded-full glass-card-strong flex items-center justify-center shadow-xl">
        <Icon className="w-9 h-9 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
