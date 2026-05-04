"use client"

import Image from "next/image"
import { useState } from "react"
import { useAppState } from "@/lib/app-state"
import { BottomNav } from "@/components/bottom-nav"
import { AppButton, EmptyStateWidget } from "@/components/food4all"
import { createOrder } from "@/lib/services/order-service"
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Clock,
  ChevronLeft,
  Tag,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react"

// ─── Cart Screen ───────────────────────────────────────────────
export function BuyerCartScreen() {
  const { cartItems, decrementCartItem, incrementCartItem, removeFromCart, cartTotal, navigate } = useAppState()
  const [selectedPickup, setSelectedPickup] = useState(0)

  const savings = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice - item.price) * item.quantity,
    0
  )

  const pickupTimes = ["Today 2:00 PM", "Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 2:00 PM"]

  if (cartItems.length === 0) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="sky-gradient-deep pt-12 pb-6 px-5 shrink-0">
          <h1 className="text-white font-bold text-2xl">My Cart</h1>
        </div>

        <EmptyStateWidget
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse Davao City's best deals and start reserving near-expiry bulk foods."
          className="flex-1 px-8 -mt-4"
          action={
            <AppButton variant="primary" size="lg" onClick={() => navigate("buyer-product-list")}>
              Browse Products
            </AppButton>
          }
        />

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-5 px-5 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-2xl">My Cart</h1>
          <div className="flex items-center gap-2">
            <span className="glass px-3 py-1 rounded-full text-white/85 text-xs font-semibold">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
            </span>
            {savings > 0 && (
              <div className="flex items-center gap-1 bg-success/20 border border-success/30 px-2.5 py-1 rounded-full">
                <TrendingDown className="w-3 h-3 text-white" aria-hidden="true" />
                <span className="text-white text-[11px] font-bold">Save ₱{savings}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-48" style={{ scrollbarWidth: "none" }}>
        {/* Cart items */}
        <div className="flex flex-col gap-3 mb-5">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-2xl p-4 shadow-md flex gap-3 items-start"
            >
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground line-clamp-2 leading-tight mb-1">
                  {item.name}
                </p>
                <div className="flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3 text-muted-foreground shrink-0" aria-hidden="true" />
                  <p className="text-[10px] text-muted-foreground truncate">{item.location}</p>
                </div>

                <div className="flex items-center justify-between">
                  {/* Price */}
                  <div>
                    <span className="text-sm font-black text-primary">₱{item.price}</span>
                    <span className="text-[10px] text-muted-foreground line-through ml-1.5">
                      ₱{item.originalPrice}
                    </span>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center glass-card rounded-xl overflow-hidden border border-border">
                    <button
                      onClick={() => decrementCartItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-primary/8 transition-all"
                      aria-label={`Decrease quantity for ${item.name}`}
                    >
                      <Minus className="w-3 h-3 text-primary" />
                    </button>
                    <span
                      className="w-7 text-center font-bold text-foreground text-xs"
                      aria-label={`Quantity for ${item.name}`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => incrementCartItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-primary/8 transition-all"
                      aria-label={`Increase quantity for ${item.name}`}
                    >
                      <Plus className="w-3 h-3 text-primary" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="flex items-center justify-between mt-2">
                  <div className="badge-savings text-[9px] px-2 py-0.5 rounded-full">
                    Save ₱{(item.originalPrice - item.price) * item.quantity}
                  </div>
                  <span className="text-xs font-black text-foreground">
                    ₱{item.price * item.quantity}
                  </span>
                </div>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-danger hover:bg-danger/8 active:scale-90 transition-all"
                aria-label={`Remove ${item.name} from cart`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Pickup time selector */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            Schedule Pickup
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {pickupTimes.map((time, i) => (
              <button
                key={time}
                onClick={() => setSelectedPickup(i)}
                className={`text-xs font-semibold py-2.5 px-3 rounded-xl transition-all ${
                  selectedPickup === i
                    ? "sky-gradient text-white shadow-md shadow-primary/20"
                    : "glass-card text-foreground/65 hover:bg-muted border border-border"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Trust block */}
        <div className="glass-card rounded-2xl p-3 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-success shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">100% Safe & FDA Certified</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Reserved items held for 2 hours. Secure in-person pickup.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky checkout bar */}
      <div className="absolute bottom-0 left-0 right-0 glass-nav px-5 pt-3 pb-safe">
        {/* Order summary */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Order Total</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-foreground">₱{cartTotal.toFixed(0)}</span>
              {savings > 0 && (
                <span className="badge-savings text-[10px] px-2 py-0.5 rounded-full">
                  Saved ₱{savings}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Pickup: {pickupTimes[selectedPickup]}</p>
          </div>
        </div>

        <AppButton
          variant="primary"
          size="xl"
          fullWidth
          onClick={() => navigate("buyer-checkout")}
          className="mb-3"
        >
          <Tag className="w-4 h-4" />
          Reserve &amp; Checkout
        </AppButton>
      </div>
    </div>
  )
}

// ─── Checkout Screen ───────────────────────────────────────────
export function BuyerCheckoutScreen() {
  const { cartItems, cartTotal, clearCart, navigate, selectOrder } = useAppState()
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const savings = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice - item.price) * item.quantity,
    0
  )

  const handleConfirm = async () => {
    setLoading(true)
    setCheckoutError(null)

    try {
      const order = await createOrder({
        items: cartItems,
        pickupDate: new Date().toISOString(),
        pickupTime: "2:00 PM",
      })
      selectOrder(order)
      clearCart()
      navigate("buyer-pickup-qr")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout failed. Please try again."

      setCheckoutError(message)
      setLoading(false)
    }
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-5 px-5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("buyer-cart")}
            className="glass w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">Checkout</h1>
            <p className="text-white/65 text-xs">Review and confirm your order</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-40" style={{ scrollbarWidth: "none" }}>
        {/* Order summary */}
        <div className="glass-card-strong rounded-2xl p-4 mb-4 shadow-sm">
          <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-primary" />
            Order Summary
          </h3>
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-xs font-semibold text-foreground line-clamp-1">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  ₱{item.price} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-bold text-foreground shrink-0">
                ₱{item.price * item.quantity}
              </span>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">₱{(cartTotal + savings).toFixed(0)}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-success">Savings</span>
                <span className="font-bold text-success">-₱{savings}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black pt-1 border-t border-border mt-1">
              <span className="text-foreground">Total</span>
              <span className="text-primary">₱{cartTotal.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Pickup details */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Pickup Details
          </h3>
          {cartItems.slice(0, 1).map((item) => (
            <div key={item.id} className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">{item.seller || "Seller"}</p>
              <p className="text-[11px] text-muted-foreground">{item.location}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">Today, 2:00 PM</span>
              </div>
            </div>
          ))}
        </div>

        {/* Savings block */}
        {savings > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-4 border border-success/20 bg-success-bg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-success" />
              <span className="text-success font-bold text-sm">Your Savings</span>
            </div>
            <p className="text-success font-black text-2xl">₱{savings}</p>
            <p className="text-success/70 text-xs mt-0.5">
              By choosing near-expiry, you reduce waste and save big.
            </p>
          </div>
        )}

        {/* Trust */}
        <div className="space-y-2">
          {[
            "All products FDA-certified and safe to consume",
            "Reservation held for 2 hours after confirmation",
            "No payment required — pay at pickup",
          ].map((text) => (
            <div key={text} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky confirm bar */}
      <div className="absolute bottom-0 left-0 right-0 glass-nav px-5 pt-3 pb-safe">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">You pay at pickup</p>
            <span className="text-xl font-black text-foreground">₱{cartTotal.toFixed(0)}</span>
          </div>
          {savings > 0 && (
            <div className="badge-savings text-sm font-bold px-3 py-1 rounded-xl">
              Save ₱{savings}
            </div>
          )}
        </div>
        {checkoutError && (
          <div role="alert" className="text-xs text-danger font-semibold text-center mb-2">
            {checkoutError}
          </div>
        )}
        <AppButton
          variant="primary"
          size="xl"
          fullWidth
          loading={loading}
          onClick={() => void handleConfirm()}
          className="mb-3"
        >
          Confirm Reservation
        </AppButton>
      </div>
    </div>
  )
}
