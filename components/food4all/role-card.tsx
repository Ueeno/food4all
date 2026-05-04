import type { ElementType } from "react"
import { CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

export function RoleCard({
  icon: Icon,
  title,
  description,
  tags,
  selected,
  onClick,
  className,
}: {
  icon: ElementType
  title: string
  description: string
  tags: string[]
  selected: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative glass-card rounded-3xl p-6 text-left transition-all duration-200 glossy-reflect",
        selected
          ? "ring-2 ring-white/80 shadow-2xl scale-[1.02] bg-white/35"
          : "hover:bg-white/28 active:scale-[0.98]",
        className,
      )}
    >
      {selected && <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-primary" />}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all",
            selected ? "sky-gradient" : "bg-sky-100/60",
          )}
        >
          <Icon className={cn("w-7 h-7", selected ? "text-white" : "text-primary")} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium",
                  selected ? "bg-primary/15 text-primary" : "bg-white/40 text-foreground/70",
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
