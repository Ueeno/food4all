import type { ButtonHTMLAttributes } from "react"
import Image from "next/image"
import { Flame, MapPin, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"
import { DiscountBadge } from "./discount-badge"
import { ExpiryBadge } from "./expiry-badge"
import { PriceText } from "./price-text"

export interface ProductCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  product: Product
  variant?: "compact" | "grid"
  showSeller?: boolean
  showLocation?: boolean
  showRating?: boolean
  showSavings?: boolean
}

export function ProductCard({
  product,
  variant = "grid",
  showSeller = true,
  showLocation = false,
  showRating = false,
  showSavings = false,
  className,
  ...props
}: ProductCardProps) {
  const compact = variant === "compact"

  return (
    <button
      className={cn(
        "glass-card overflow-hidden text-left shadow-md transition-all hover:shadow-lg active:scale-[0.97]",
        compact ? "w-36 shrink-0 rounded-2xl" : "w-full rounded-2xl",
        className,
      )}
      aria-label={`${product.name}, ${product.discountPercent}% off, ₱${product.discountedPrice}`}
      {...props}
    >
      <div className="relative w-full bg-muted" style={{ aspectRatio: "4/3" }}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes={compact ? "144px" : "(max-width: 480px) 45vw, 200px"}
        />
        <DiscountBadge
          percent={product.discountPercent}
          className="absolute top-2 left-2"
        />
        {product.isHot && !compact && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Flame className="w-2.5 h-2.5" aria-hidden="true" />
            HOT
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
          <ExpiryBadge
            expiryDate={product.expiryDate}
            daysUntilExpiry={product.daysUntilExpiry}
            compact
            overlay
          />
        </div>
      </div>

      <div className={cn(compact ? "p-2.5" : "p-3")}>
        <p
          className={cn(
            "font-bold text-foreground leading-tight line-clamp-2",
            compact ? "mb-1 text-[11px]" : "mb-1 text-[12px]",
          )}
        >
          {product.name}
        </p>

        {showSeller && (
          <p className="mb-1.5 text-[10px] text-muted-foreground truncate">
            {product.seller}
          </p>
        )}

        {showLocation && (
          <div className="mb-1.5 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-[10px] text-muted-foreground truncate">{product.barangay}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <PriceText
            price={product.discountedPrice}
            originalPrice={product.originalPrice}
            size="sm"
          />
          {showSavings && (
            <span className="badge-savings rounded-full px-1.5 py-0.5 text-[9px]">
              Save ₱{product.originalPrice - product.discountedPrice}
            </span>
          )}
        </div>

        {showRating && (
          <div className="mt-1.5 flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-foreground/70">
              {product.sellerRating}
            </span>
            <span className="ml-auto text-[9px] text-muted-foreground">
              {product.quantity} left
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
