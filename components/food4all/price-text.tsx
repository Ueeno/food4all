import { cn } from "@/lib/utils"

export function PriceText({
  price,
  originalPrice,
  unit,
  size = "sm",
  className,
}: {
  price: number
  originalPrice?: number
  unit?: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-3xl",
  }

  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <span className={cn("font-black text-primary", sizes[size])}>₱{price}</span>
      {originalPrice !== undefined && (
        <span className="text-[10px] text-muted-foreground line-through">
          ₱{originalPrice}
        </span>
      )}
      {unit && <span className="text-[10px] text-muted-foreground">/{unit}</span>}
    </div>
  )
}
