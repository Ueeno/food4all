"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useAppState } from "@/lib/app-state"
import { GlassButton } from "@/components/glass-button"
import { LoadingView } from "@/components/food4all"
import { getProductById, getProducts } from "@/lib/services/product-service"
import type { Product } from "@/lib/types"
import {
  ChevronLeft,
  Heart,
  Share2,
  Star,
  MapPin,
  Clock,
  ShoppingCart,
  Store,
  AlertTriangle,
  Plus,
  Minus,
  ShieldCheck,
  CheckCircle2,
  Tag,
} from "lucide-react"

export function BuyerProductDetailScreen() {
  const { navigate, selectedProductId, addToCart } = useAppState()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [liked, setLiked] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadProduct() {
      const selectedProduct = selectedProductId
        ? await getProductById(selectedProductId)
        : null
      const fallbackProducts = selectedProduct ? [] : await getProducts()
      const nextProduct = selectedProduct ?? fallbackProducts[0] ?? null

      if (ignore) return

      setProduct(nextProduct)
      setQty(1)
      setLoading(false)
    }

    loadProduct()

    return () => {
      ignore = true
    }
  }, [selectedProductId])

  if (loading || !product) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        <LoadingView label="Loading product..." className="flex-1" />
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.discountedPrice,
      originalPrice: product.originalPrice,
      quantity: qty,
      image: product.image,
      seller: product.seller,
      location: product.location,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2200)
  }

  const handleReserveNow = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.discountedPrice,
      originalPrice: product.originalPrice,
      quantity: qty,
      image: product.image,
      seller: product.seller,
      location: product.location,
    })
    navigate("buyer-cart")
  }

  const daysLeft = product.daysUntilExpiry
  const urgencyLevel: "critical" | "warning" | "ok" =
    daysLeft <= 7 ? "critical" : daysLeft <= 14 ? "warning" : "ok"

  const urgencyConfig = {
    critical: {
      bg: "bg-danger-bg",
      text: "text-danger",
      border: "border-danger/20",
      label: `Only ${daysLeft} days left — reserve now!`,
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    warning: {
      bg: "bg-warning-bg",
      text: "text-warning",
      border: "border-warning/20",
      label: `${daysLeft} days until expiry`,
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    ok: {
      bg: "bg-success-bg",
      text: "text-success",
      border: "border-success/20",
      label: `Expires ${product.expiryDate}`,
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  }[urgencyLevel]

  const savingsAmt = (product.originalPrice - product.discountedPrice) * qty
  const totalPrice = product.discountedPrice * qty

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Product image hero */}
      <div
        className="relative w-full bg-muted shrink-0"
        style={{ aspectRatio: "4/3", maxHeight: "300px" }}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 480px"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/15" aria-hidden="true" />

        {/* Top controls */}
        <div className="absolute top-12 left-0 right-0 flex items-center justify-between px-4 z-10">
          <button
            onClick={() => navigate("buyer-product-list")}
            className="glass w-10 h-10 rounded-full flex items-center justify-center"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="glass w-10 h-10 rounded-full flex items-center justify-center"
              aria-label={liked ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={`w-5 h-5 transition-all duration-200 ${liked ? "fill-red-500 text-red-500" : "text-white"}`}
              />
            </button>
            <button
              className="glass w-10 h-10 rounded-full flex items-center justify-center"
              aria-label="Share product"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Discount badge */}
        <div className="absolute bottom-3 left-4 badge-discount text-sm font-black px-4 py-1.5 rounded-full shadow-lg">
          -{product.discountPercent}% OFF
        </div>

        {/* Expiry badge */}
        <div
          className={`absolute bottom-3 right-4 ${urgencyConfig.bg} border ${urgencyConfig.border} backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow`}
        >
          <span className={urgencyConfig.text}>{urgencyConfig.icon}</span>
          <span className={`text-xs font-bold ${urgencyConfig.text}`}>
            {urgencyConfig.label}
          </span>
        </div>
      </div>

      {/* Scrollable detail body */}
      <div className="flex-1 overflow-y-auto pb-28" style={{ scrollbarWidth: "none" }}>
        {/* Main info card */}
        <div className="px-5 pt-4 pb-3">
          {/* Category + brand */}
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-trust text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
              {product.category}
            </span>
            <span className="text-muted-foreground text-[11px]">{product.brand}</span>
          </div>

          <h1 className="text-xl font-black text-foreground leading-tight mb-2 text-balance">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= Math.round(product.sellerRating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-muted-foreground/30"
                }`}
                aria-hidden="true"
              />
            ))}
            <span className="text-sm font-semibold text-foreground">{product.sellerRating}</span>
            <span className="text-muted-foreground text-xs">from {product.seller}</span>
          </div>

          {/* Pricing */}
          <div className="glass-card-strong rounded-2xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">₱{product.discountedPrice}</span>
                  <span className="text-muted-foreground text-base line-through">₱{product.originalPrice}</span>
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">per {product.unit}</p>
              </div>
              <div className="text-right">
                <div className="badge-savings text-sm font-black px-3 py-1 rounded-xl">
                  Save ₱{product.originalPrice - product.discountedPrice}
                </div>
                <p className="text-muted-foreground text-[10px] mt-1">
                  {product.quantity} {product.unit} available
                </p>
              </div>
            </div>

            {/* Qty selector */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-8 h-8 rounded-full glass-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                >
                  <Minus className="w-3.5 h-3.5 text-foreground" />
                </button>
                <span className="text-lg font-black text-foreground w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.quantity, qty + 1))}
                  className="w-8 h-8 rounded-full glass-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Increase quantity"
                  disabled={qty >= product.quantity}
                >
                  <Plus className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
            </div>

            {qty > 1 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <div className="flex items-center gap-2">
                  <span className="text-success font-bold text-xs">Save ₱{savingsAmt}</span>
                  <span className="font-black text-foreground">₱{totalPrice}</span>
                </div>
              </div>
            )}
          </div>

          {/* Seller info */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl sky-gradient flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm">{product.seller}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">{product.sellerRating} rating</span>
                </div>
                <div className="flex items-start gap-1 mt-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground leading-tight">{product.location}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">Pickup: {product.pickupHours}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product details */}
          <div className="glass-card rounded-2xl p-4 mb-4">
            <h3 className="font-bold text-foreground text-sm mb-3">Product Details</h3>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-3">
              {[
                { label: "Weight", value: product.weight },
                { label: "Pack Size", value: product.packSize },
                { label: "Category", value: product.category },
                { label: "Brand", value: product.brand },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-xs font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-xs text-foreground/75 leading-relaxed">{product.description}</p>
            </div>
          </div>

          {/* Safety assurance */}
          <div className="glass-card rounded-2xl p-4 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-success" />
              <h3 className="font-bold text-success text-sm">Safety Assurance</h3>
            </div>
            <div className="space-y-2">
              {[
                "FDA-registered product, safe for consumption",
                "Cold-chain maintained throughout storage",
                "Certified within legal sale window",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-foreground/75">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div className="absolute bottom-0 left-0 right-0 glass-nav px-5 pt-3 pb-safe">
        <div className="pb-3 flex gap-3">
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-sm border transition-all ${
              addedToCart
                ? "bg-success/10 border-success/30 text-success"
                : "glass-btn-outline"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {addedToCart ? "Added!" : "Add to Cart"}
          </button>
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleReserveNow}
            className="flex-[2]"
          >
            <Tag className="w-4 h-4" />
            Reserve Now
          </GlassButton>
        </div>
      </div>
    </div>
  )
}
