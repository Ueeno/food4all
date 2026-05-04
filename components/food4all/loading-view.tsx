import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function LoadingView({
  label = "Loading...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn("flex min-h-40 flex-col items-center justify-center gap-3 text-muted-foreground", className)}
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-6 text-primary" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}
