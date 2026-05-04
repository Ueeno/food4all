"use client"

import Image from "next/image"
import { useEffect, useId, useState } from "react"
import { useAppState } from "@/lib/app-state"
import { BottomNav } from "@/components/bottom-nav"
import { GlassButton } from "@/components/glass-button"
import { LoadingView } from "@/components/food4all"
import { getSellerOrders, verifyPickupCode } from "@/lib/services/order-service"
import { getSellerProducts } from "@/lib/services/seller-service"
import type { Order, Product } from "@/lib/types"
import {
  ChevronLeft,
  Upload,
  Camera,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  TrendingUp,
  Tag,
  Edit3,
  Trash2,
  Sparkles,
  Store,
  Bell,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  ShieldCheck,
  Star,
  Leaf,
  ArrowUpRight,
  Info,
  Phone,
} from "lucide-react"

type SellerProductForm = {
  name: string
  brand: string
  category: string
  originalPrice: string
  discountedPrice: string
  quantity: string
  weight: string
  expiryDate: string
  pickupAddress: string
  pickupHours: string
  description: string
}

type SellerProductFormErrors = Partial<Record<keyof SellerProductForm, string>>

function validateSellerProductForm(form: SellerProductForm) {
  const errors: SellerProductFormErrors = {}
  const originalPrice = Number(form.originalPrice)
  const discountedPrice = Number(form.discountedPrice)

  if (!form.name.trim()) {
    errors.name = "Product name is required."
  }

  if (!form.category.trim()) {
    errors.category = "Category is required."
  }

  if (!form.originalPrice.trim()) {
    errors.originalPrice = "Original price is required."
  } else if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    errors.originalPrice = "Original price must be a positive number."
  }

  if (!form.discountedPrice.trim()) {
    errors.discountedPrice = "Discounted price is required."
  } else if (!Number.isFinite(discountedPrice) || discountedPrice <= 0) {
    errors.discountedPrice = "Discounted price must be a positive number."
  }

  if (!errors.originalPrice && !errors.discountedPrice) {
    const discount = (1 - discountedPrice / originalPrice) * 100

    if (discount < 0 || discount > 100) {
      errors.discountedPrice = "Discount must be between 0 and 100%."
    }
  }

  if (!form.expiryDate.trim()) {
    errors.expiryDate = "Expiry date is required."
  } else if (Number.isNaN(new Date(`${form.expiryDate}T00:00:00`).getTime())) {
    errors.expiryDate = "Enter a valid expiry date."
  }

  if (form.quantity.trim()) {
    const quantity = Number(form.quantity)

    if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 0) {
      errors.quantity = "Quantity must be a non-negative whole number."
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

function SellerFormField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
}: {
  label: string
  placeholder: string
  type?: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`

  return (
    <div>
      <label className="text-xs font-semibold text-foreground/80 mb-1.5 block" htmlFor={generatedId}>
        {label}
      </label>
      <input
        id={generatedId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`glass-input w-full px-4 py-3 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${
          error ? "border-red-400" : ""
        }`}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Add Product Screen
// ──────────────────────────────────────────────
export function SellerAddProductScreen() {
  const { navigate } = useAppState()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<SellerProductFormErrors>({})
  const [form, setForm] = useState<SellerProductForm>({
    name: "",
    brand: "",
    category: "hotdogs",
    originalPrice: "",
    discountedPrice: "",
    quantity: "",
    weight: "",
    expiryDate: "",
    pickupAddress: "",
    pickupHours: "",
    description: "",
  })

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((current) => ({ ...current, [k]: undefined }))
  }

  const handleSubmit = () => {
    const result = validateSellerProductForm(form)

    setErrors(result.errors)

    if (!result.isValid) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate("seller-products")
    }, 1400)
  }

  const categories = ["Hotdogs", "Sausages", "Tocino", "Bacon", "Ham", "Frozen Foods", "Bundle Deals"]

  const suggestedDiscount = form.expiryDate
    ? (() => {
        const today = new Date()
        const exp = new Date(form.expiryDate)
        const days = Math.ceil((exp.getTime() - today.getTime()) / 86400000)
        if (days <= 3) return 55
        if (days <= 7) return 40
        if (days <= 14) return 30
        return 20
      })()
    : null

  const originalPriceValue = Number(form.originalPrice)
  const discountedPriceValue = Number(form.discountedPrice)

  const aiSuggestedPrice =
    suggestedDiscount && Number.isFinite(originalPriceValue) && originalPriceValue > 0
      ? Math.round(originalPriceValue * (1 - suggestedDiscount / 100))
      : null

  const rawDiscountCalc =
    form.originalPrice && form.discountedPrice && Number.isFinite(originalPriceValue) && originalPriceValue > 0
      ? Math.round((1 - discountedPriceValue / originalPriceValue) * 100)
      : null

  const discountCalc =
    rawDiscountCalc !== null && rawDiscountCalc >= 0 && rawDiscountCalc <= 100 ? rawDiscountCalc : null

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-5 px-5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("seller-dashboard")}
            className="glass w-9 h-9 rounded-full flex items-center justify-center text-white"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">Upload Product</h1>
            <p className="text-white/65 text-xs">Create a new near-expiry listing</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-32 space-y-4" style={{ scrollbarWidth: "none" }}>

        {/* Image upload */}
        <section className="glass-card-strong rounded-3xl p-5 shadow-xl">
          <h3 className="font-bold text-foreground text-sm mb-3">Product Photo</h3>
          {preview ? (
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <Image src={preview} alt="Product preview" fill className="object-cover" sizes="320px" />
              <button
                onClick={() => setPreview(null)}
                className="absolute top-2 right-2 glass w-8 h-8 rounded-full flex items-center justify-center text-white shadow"
                aria-label="Remove image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Camera className="w-6 h-6 text-primary" />, label: "Take Photo", img: "/images/hotdogs.jpg" },
                { icon: <Upload className="w-6 h-6 text-primary" />, label: "Upload Image", img: "/images/tocino.jpg" },
              ].map(({ icon, label, img }) => (
                <button
                  key={label}
                  onClick={() => setPreview(img)}
                  className="glass-btn-outline rounded-2xl py-6 flex flex-col items-center gap-2 hover:bg-primary/5 transition-all active:scale-95"
                >
                  {icon}
                  <span className="text-xs font-semibold text-primary">{label}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Product info */}
        <section className="glass-card-strong rounded-3xl p-5 shadow-xl space-y-3">
          <h3 className="font-bold text-foreground text-sm">Product Information</h3>
          <SellerFormField
            label="Product Name"
            placeholder="e.g. Purefoods Tender Juicy Hotdog"
            value={form.name}
            onChange={(value) => update("name", value)}
            error={errors.name}
          />
          <SellerFormField
            label="Brand"
            placeholder="e.g. Purefoods"
            value={form.brand}
            onChange={(value) => update("brand", value)}
          />

          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update("category", cat.toLowerCase())}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    form.category === cat.toLowerCase()
                      ? "sky-gradient text-white shadow-md"
                      : "bg-muted text-foreground/70 hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.category}</p>
            )}
          </div>

          <SellerFormField
            label="Weight / Pack Size"
            placeholder="e.g. 500g · 1 pack = 20 pcs"
            value={form.weight}
            onChange={(value) => update("weight", value)}
          />

          <div>
            <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe your product — brand, condition, resell tips..."
              aria-label="Description"
              rows={3}
              className="glass-input w-full px-4 py-3 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all resize-none"
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="glass-card-strong rounded-3xl p-5 shadow-xl space-y-3">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Pricing & Quantity
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <SellerFormField
              label="Original Price (₱)"
              placeholder="285"
              type="number"
              value={form.originalPrice}
              onChange={(value) => update("originalPrice", value)}
              error={errors.originalPrice}
            />
            <SellerFormField
              label="Discounted Price (₱)"
              placeholder="185"
              type="number"
              value={form.discountedPrice}
              onChange={(value) => update("discountedPrice", value)}
              error={errors.discountedPrice}
            />
          </div>

          {discountCalc !== null && (
            <div className="rounded-2xl p-3 flex items-center justify-between"
              style={{ background: "var(--primary-light)" }}>
              <div>
                <p className="text-xs text-muted-foreground">Discount applied</p>
                <p className="text-xl font-black text-primary">{discountCalc}% OFF</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Buyers save</p>
                <p className="text-lg font-black" style={{ color: "var(--success)" }}>
                  ₱{Number(form.originalPrice) - Number(form.discountedPrice)}
                </p>
              </div>
            </div>
          )}

          <SellerFormField
            label="Available Quantity"
            placeholder="e.g. 48"
            type="number"
            value={form.quantity}
            onChange={(value) => update("quantity", value)}
            error={errors.quantity}
          />
        </section>

        {/* Expiry & Pickup */}
        <section className="glass-card-strong rounded-3xl p-5 shadow-xl space-y-3">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Expiry & Pickup
          </h3>
          <SellerFormField
            label="Expiry Date"
            placeholder="May 12, 2026"
            type="date"
            value={form.expiryDate}
            onChange={(value) => update("expiryDate", value)}
            error={errors.expiryDate}
          />

          {/* AI Price Suggestion */}
          {suggestedDiscount !== null && aiSuggestedPrice !== null && (
            <div className="rounded-2xl p-4 border"
              style={{ background: "oklch(0.92 0.06 235 / 0.4)", borderColor: "oklch(0.56 0.19 235 / 0.25)" }}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 sky-gradient rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary flex items-center gap-1">
                    AI Suggested Price
                    <Info className="w-3 h-3 text-primary/60" />
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                    Based on expiry in ~{Math.ceil(
                      (new Date(form.expiryDate).getTime() - new Date().getTime()) / 86400000
                    )} days, we recommend a <strong className="text-primary">{suggestedDiscount}% discount</strong> to maximize sell-through.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-black text-primary">₱{aiSuggestedPrice}</span>
                    <button
                      onClick={() => update("discountedPrice", String(aiSuggestedPrice))}
                      className="text-[10px] font-bold text-white sky-gradient px-3 py-1 rounded-full shadow-sm"
                    >
                      Apply Price
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <SellerFormField
            label="Pickup Address"
            placeholder="e.g. Magsaysay Market, Poblacion District, Davao City"
            value={form.pickupAddress}
            onChange={(value) => update("pickupAddress", value)}
          />
          <SellerFormField
            label="Store Hours"
            placeholder="e.g. 7:00 AM – 5:00 PM"
            value={form.pickupHours}
            onChange={(value) => update("pickupHours", value)}
          />
        </section>
      </div>

      {/* Submit bar */}
      <div className="absolute bottom-0 left-0 right-0 glass-nav px-5 pt-3 pb-8">
        <GlassButton
          variant="primary"
          size="xl"
          fullWidth
          loading={loading}
          onClick={handleSubmit}
          icon={<Upload className="w-5 h-5" />}
        >
          Publish Listing
        </GlassButton>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Seller Products Screen
// ──────────────────────────────────────────────
export function SellerProductsScreen() {
  const { navigate } = useAppState()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadProducts() {
      const nextProducts = await getSellerProducts()

      if (ignore) return

      setProducts(nextProducts)
      setLoading(false)
    }

    loadProducts()

    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        <LoadingView label="Loading seller products..." className="flex-1" />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      <div className="sky-gradient-deep pt-12 pb-5 px-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl">My Products</h1>
            <p className="text-white/65 text-xs mt-0.5">{products.length} listings active</p>
          </div>
          <button
            onClick={() => navigate("seller-add-product")}
            className="glass-btn px-4 py-2 rounded-full text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24" style={{ scrollbarWidth: "none" }}>
        <div className="flex flex-col gap-3">
          {products.map((product) => (
            <div key={product.id} className="glass-card rounded-2xl overflow-hidden flex shadow-md">
              <div className="relative w-20 shrink-0 bg-muted self-stretch">
                <Image src={product.image} alt={product.name} fill className="object-cover" sizes="80px" />
                {product.daysUntilExpiry <= 7 && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-1 mb-1">
                  <p className="text-xs font-bold text-foreground line-clamp-1 flex-1">{product.name}</p>
                  <div className="flex gap-1.5 shrink-0">
                    <button className="w-7 h-7 glass-card rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors"
                      aria-label={`Edit ${product.name}`}>
                      <Edit3 className="w-3 h-3 text-primary" />
                    </button>
                    <button className="w-7 h-7 glass-card rounded-xl flex items-center justify-center hover:bg-red-50/60 transition-colors"
                      aria-label={`Delete ${product.name}`}>
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm font-black text-primary">₱{product.discountedPrice}</span>
                  <span className="text-[10px] text-muted-foreground line-through">₱{product.originalPrice}</span>
                  <span className="badge-discount text-[9px] px-1.5 py-0.5 rounded-full">
                    -{product.discountPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{product.quantity} left</span>
                  </div>
                  <div className={`flex items-center gap-1 ${product.daysUntilExpiry <= 7 ? "text-red-500" : "text-orange-500"}`}>
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-semibold">{product.daysUntilExpiry}d left</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// ──────────────────────────────────────────────
// Seller Orders Screen
// ──────────────────────────────────────────────
type SellerOrderTab = "new" | "preparing" | "ready" | "completed"

export function SellerOrdersScreen() {
  const { navigate } = useAppState()
  const [activeTab, setActiveTab] = useState<SellerOrderTab>("new")
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadOrders() {
      const nextOrders = await getSellerOrders()

      if (ignore) return

      setAllOrders(nextOrders)
      setLoading(false)
    }

    loadOrders()

    return () => {
      ignore = true
    }
  }, [])

  const tabMap: Record<SellerOrderTab, string[]> = {
    new: ["reserved"],
    preparing: ["preparing"],
    ready: ["ready"],
    completed: ["completed"],
  }

  const tabs: { key: SellerOrderTab; label: string }[] = [
    { key: "new", label: "New" },
    { key: "preparing", label: "Preparing" },
    { key: "ready", label: "Ready" },
    { key: "completed", label: "Done" },
  ]

  const filtered = allOrders.filter((o) => tabMap[activeTab].includes(o.status))

  const statusStyle: Record<string, { label: string; pill: string; text: string }> = {
    reserved:  { label: "New Order",   pill: "bg-primary/10",  text: "text-primary"       },
    preparing: { label: "Preparing",   pill: "bg-amber-50",    text: "text-amber-700"     },
    ready:     { label: "Ready",       pill: "bg-green-50",    text: "text-green-700"     },
    completed: { label: "Completed",   pill: "bg-muted",       text: "text-muted-foreground" },
  }

  if (loading) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        <LoadingView label="Loading seller orders..." className="flex-1" />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      <div className="sky-gradient-deep pt-12 pb-5 px-5 shrink-0">
        <h1 className="text-white font-black text-2xl">Orders</h1>
        <p className="text-white/65 text-xs mt-0.5">Manage customer reservations</p>
      </div>

      {/* Tabs */}
      <div className="px-5 py-3 shrink-0">
        <div className="glass-card rounded-2xl p-1 flex gap-1">
          {tabs.map(({ key, label }) => {
            const count = allOrders.filter((o) => tabMap[key].includes(o.status)).length
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[10px] font-bold transition-all ${
                  activeTab === key ? "sky-gradient text-white shadow-md" : "text-muted-foreground"
                }`}
              >
                <span>{label}</span>
                {count > 0 && (
                  <span className={`text-[9px] font-black ${activeTab === key ? "text-white/80" : "text-muted-foreground"}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ scrollbarWidth: "none" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="glass-card w-16 h-16 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">No {activeTab} orders</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((order) => {
              const st = statusStyle[order.status] ?? statusStyle.completed
              return (
                <div key={order.id} className="glass-card rounded-2xl shadow-md overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-black text-foreground">{order.id}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{order.buyer}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${st.pill} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-foreground mb-1 line-clamp-1">{order.product}</p>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Qty: {order.quantity}</span>
                      </div>
                      <span className="text-sm font-black text-primary">₱{order.total}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{order.pickupDate} · {order.pickupTime}</span>
                      </div>
                    </div>

                    {order.status !== "completed" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate("seller-verify-pickup")}
                          className="flex-1 glass-btn rounded-xl py-2.5 text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                        >
                          <QrCode className="w-4 h-4" />
                          Verify QR
                        </button>
                        {order.status === "reserved" && (
                          <button className="flex-1 glass-btn-outline rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Ready
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {order.status === "ready" && (
                    <div className="sky-gradient px-4 py-2 flex items-center justify-between">
                      <p className="text-white/80 text-[10px]">Awaiting pickup · Code: <span className="font-black text-white tracking-wider">{order.pickupCode}</span></p>
                      <ArrowUpRight className="w-4 h-4 text-white/70" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

// ──────────────────────────────────────────────
// Seller Verify Pickup Screen
// ──────────────────────────────────────────────
export function SellerVerifyPickupScreen() {
  const { navigate } = useAppState()
  const [code, setCode] = useState("")
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanActive, setScanActive] = useState(false)
  const [verification, setVerification] = useState<Order | null>(null)
  const [verificationError, setVerificationError] = useState("")

  const handleVerify = async () => {
    setLoading(true)
    setVerificationError("")
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const result = await verifyPickupCode(code)

    if (result.status === "valid" && result.orderId) {
      const orders = await getSellerOrders()
      const nextVerification = orders.find((order) => order.id === result.orderId) ?? null

      setVerification(nextVerification)
      setVerified(true)
      setLoading(false)
      return
    }

    setVerification(null)
    setVerificationError(result.message)
    setLoading(false)
  }

  const handleScan = () => {
    setScanActive(true)
    setTimeout(() => {
      setScanActive(false)
      setCode("F4A-7X29")
    }, 1500)
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden sky-gradient-deep">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 right-5 w-44 h-44 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 -left-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-12 pb-4 px-5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("seller-orders")}
            className="glass w-9 h-9 rounded-full flex items-center justify-center text-white"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">Verify Pickup</h1>
            <p className="text-white/65 text-xs">Scan or enter buyer&apos;s code</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8" style={{ scrollbarWidth: "none" }}>
        {!verified ? (
          <div className="flex flex-col gap-4">
            {/* QR scanner frame */}
            <div className="glass-card-strong rounded-3xl p-5 shadow-2xl">
              <div className="relative w-full rounded-2xl overflow-hidden bg-black/80 flex items-center justify-center"
                style={{ aspectRatio: "1 / 1", maxHeight: 220 }}>
                {/* Corner guides */}
                {[
                  "top-3 left-3 border-t-2 border-l-2",
                  "top-3 right-3 border-t-2 border-r-2",
                  "bottom-3 left-3 border-b-2 border-l-2",
                  "bottom-3 right-3 border-b-2 border-r-2",
                ].map((cls, i) => (
                  <div key={i} className={`absolute ${cls} border-white w-8 h-8 rounded-sm`} aria-hidden="true" />
                ))}

                {/* Scan animation line */}
                {scanActive && (
                  <div
                    className="absolute left-4 right-4 h-0.5 bg-primary rounded-full opacity-80 animate-bounce"
                    style={{ top: "50%" }}
                    aria-hidden="true"
                  />
                )}

                <div className="text-center z-10">
                  <QrCode className={`w-12 h-12 mx-auto mb-2 ${scanActive ? "text-primary animate-pulse" : "text-white/40"}`} />
                  <p className="text-white/50 text-xs">
                    {scanActive ? "Scanning..." : "Camera preview"}
                  </p>
                </div>
              </div>

              <GlassButton
                variant="primary"
                size="md"
                fullWidth
                className="mt-4"
                onClick={handleScan}
                loading={scanActive}
              >
                {scanActive ? "Scanning QR Code..." : "Start QR Scan"}
              </GlassButton>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/50 text-xs font-semibold">or enter manually</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Manual entry */}
            <div className="glass-card-strong rounded-3xl p-5 shadow-xl">
              <h3 className="font-bold text-foreground text-sm mb-3">Enter Pickup Code</h3>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="F4A-XXXX"
                maxLength={8}
                className="glass-input w-full px-4 py-4 rounded-2xl text-xl font-black text-foreground text-center tracking-[0.35em] placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none transition-all mb-4"
                aria-label="Pickup code input"
              />
              <GlassButton
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={code.length < 6}
                onClick={handleVerify}
                icon={<CheckCircle2 className="w-5 h-5" />}
              >
                Confirm Pickup
              </GlassButton>
              {verificationError && (
                <p className="mt-3 text-center text-xs font-semibold text-red-500">
                  {verificationError}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="glass-card-strong rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: "var(--success-bg)" }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: "var(--success)" }} />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-1">Pickup Confirmed!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Order <strong>{verification?.id ?? "ORD-2847"}</strong> verified and marked complete.
            </p>

            <div className="glass rounded-2xl p-4 mb-6 text-left space-y-2.5">
              {[
                { label: "Buyer", value: verification?.buyer ?? "Maria Santos" },
                {
                  label: "Product",
                  value: verification
                    ? `${verification.product} x${verification.quantity}`
                    : "Purefoods Hotdog x3",
                },
                { label: "Code Used", value: code || "F4A-7X29" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground">{value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total Collected</span>
                <span className="text-base font-black text-primary">₱{verification?.total ?? 555}</span>
              </div>
            </div>

            <GlassButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                setVerified(false)
                setVerification(null)
                setCode("")
                navigate("seller-orders")
              }}
            >
              Back to Orders
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Seller Reports Screen
// ──────────────────────────────────────────────
export function SellerReportsScreen() {
  const [topProducts, setTopProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const weekData = [
    { day: "Mon", sales: 2840, orders: 5 },
    { day: "Tue", sales: 3200, orders: 7 },
    { day: "Wed", sales: 2100, orders: 4 },
    { day: "Thu", sales: 4500, orders: 9 },
    { day: "Fri", sales: 3800, orders: 8 },
    { day: "Sat", sales: 5200, orders: 11 },
    { day: "Sun", sales: 4100, orders: 10 },
  ]

  const maxSales = Math.max(...weekData.map((d) => d.sales))
  const totalWeekly = weekData.reduce((s, d) => s + d.sales, 0)
  const totalOrders = weekData.reduce((s, d) => s + d.orders, 0)
  const wasteReduced = 24.6
  const recoveryEarnings = 18420

  useEffect(() => {
    let ignore = false

    async function loadTopProducts() {
      const nextProducts = await getSellerProducts()

      if (ignore) return

      setTopProducts(nextProducts.slice(0, 5))
      setLoading(false)
    }

    loadTopProducts()

    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        <LoadingView label="Loading seller reports..." className="flex-1" />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      <div className="sky-gradient-deep pt-12 pb-5 px-5 shrink-0">
        <h1 className="text-white font-black text-2xl">Sales Reports</h1>
        <p className="text-white/70 text-xs mt-0.5">Apr 24 – Apr 30, 2026</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4" style={{ scrollbarWidth: "none" }}>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Weekly Revenue", value: `₱${totalWeekly.toLocaleString()}`, sub: "+12% vs last week", icon: TrendingUp, color: "var(--primary)" },
            { label: "Total Orders", value: totalOrders.toString(), sub: "Avg ₱476 per order", icon: Package, color: "var(--success)" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="glass-card-strong rounded-2xl p-4 shadow-xl">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                style={{ background: `oklch(from ${color} l c h / 0.12)` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
              <p className="text-[9px] font-semibold mt-0.5" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="glass-card-strong rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-sm">Daily Revenue (₱)</h3>
            <span className="text-[10px] text-muted-foreground font-medium">This week</span>
          </div>
          <div className="flex items-end gap-2" style={{ height: 100 }}>
            {weekData.map((d) => {
              const pct = Math.round((d.sales / maxSales) * 100)
              const isBest = d.sales === maxSales
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[8px] text-muted-foreground font-semibold">
                    {d.sales >= 1000 ? `${(d.sales / 1000).toFixed(1)}k` : d.sales}
                  </span>
                  <div
                    className={`w-full rounded-t-lg rounded-b-sm transition-all glossy-reflect shadow-sm ${
                      isBest ? "sky-gradient" : "bg-primary/20"
                    }`}
                    style={{ height: `${pct}%` }}
                    role="img"
                    aria-label={`${d.day}: ₱${d.sales}`}
                  />
                  <span className="text-[9px] font-semibold text-muted-foreground">{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Waste & recovery impact */}
        <div className="glass-card-strong rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-4 h-4" style={{ color: "var(--success)" }} />
            <h3 className="font-bold text-foreground text-sm">Environmental Impact</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Food Waste Reduced", value: `${wasteReduced} kg`, sub: "This week", color: "var(--success)", bg: "var(--success-bg)" },
              { label: "Recovery Earnings", value: `₱${recoveryEarnings.toLocaleString()}`, sub: "From near-expiry", color: "var(--primary)", bg: "var(--primary-light)" },
            ].map(({ label, value, sub, color, bg }) => (
              <div key={label} className="rounded-2xl p-3 text-center" style={{ background: bg }}>
                <p className="text-xl font-black" style={{ color }}>{value}</p>
                <p className="text-[9px] font-semibold" style={{ color }}>{label}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl px-3 py-2 bg-muted/50">
            <p className="text-[10px] text-muted-foreground text-center">
              Equivalent to saving <strong className="text-foreground">62 meals</strong> from landfill this week
            </p>
          </div>
        </div>

        {/* Top products */}
        <div className="glass-card-strong rounded-3xl p-5 shadow-xl">
          <h3 className="font-bold text-foreground text-sm mb-4">Best-Selling Items</h3>
          <div className="flex flex-col gap-3">
            {topProducts.map((p, i) => {
              const revenue = p.discountedPrice * p.quantity
              const maxRevenue = topProducts[0]
                ? topProducts[0].discountedPrice * topProducts[0].quantity
                : 1
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 ${
                      i === 0 ? "sky-gradient" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0">
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="40px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-1">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full sky-gradient"
                          style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0">{p.quantity} sold</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-primary shrink-0">
                    ₱{revenue.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// ──────────────────────────────────────────────
// Seller Profile Screen
// ──────────────────────────────────────────────
export function SellerProfileScreen() {
  const { logout } = useAppState()
  const [isOpen, setIsOpen] = useState(true)

  const stats = [
    { label: "Total Sales", value: "₱48,920" },
    { label: "Products", value: "12" },
    { label: "Orders", value: "147" },
  ]

  const businessHours = [
    { day: "Mon – Fri", hours: "7:00 AM – 5:00 PM" },
    { day: "Saturday", hours: "7:00 AM – 3:00 PM" },
    { day: "Sunday", hours: "Closed" },
  ]

  const menuSections = [
    {
      title: "Store Management",
      items: [
        { icon: <Store className="w-4 h-4 text-primary" />, label: "Edit Store Info", action: () => {} },
        { icon: <Tag className="w-4 h-4 text-primary" />, label: "Pricing Templates", action: () => {} },
        { icon: <Bell className="w-4 h-4 text-primary" />, label: "Order Notifications", action: () => {} },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: <ShieldCheck className="w-4 h-4 text-primary" />, label: "Identity Verification", action: () => {} },
        { icon: <Star className="w-4 h-4 text-primary" />, label: "Seller Reviews", action: () => {} },
        { icon: <Settings className="w-4 h-4 text-muted-foreground" />, label: "Account Settings", action: () => {} },
        { icon: <HelpCircle className="w-4 h-4 text-muted-foreground" />, label: "Seller Support", action: () => {} },
      ],
    },
  ]

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      <div className="sky-gradient-deep pt-12 pb-20 px-5 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} aria-hidden="true" />
        <div className="relative z-10 flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">Store Profile</h1>
          <button className="glass w-9 h-9 rounded-full flex items-center justify-center text-white"
            aria-label="Edit profile">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24" style={{ scrollbarWidth: "none" }}>
        {/* Store card */}
        <div className="px-5 -mt-12 mb-5">
          <div className="glass-card-strong rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl sky-gradient flex items-center justify-center shadow-lg ring-4 ring-white/50 shrink-0">
                <span className="text-white font-black text-lg" aria-hidden="true">MM</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-foreground leading-tight">Magsaysay Meat Depot</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="badge-trust text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Verified Seller
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                    isOpen ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-green-500" : "bg-muted-foreground"}`} />
                    {isOpen ? "Open Now" : "Closed"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Magsaysay Market, Poblacion District, Davao City 8000
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">+63 912 345 6789</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {stats.map((stat) => (
                <div key={stat.label} className="glass rounded-2xl p-3 text-center">
                  <p className="text-sm font-black text-primary">{stat.value}</p>
                  <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-muted/60">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i <= 4 ? "fill-amber-400 text-amber-400" : "text-border"}`} aria-hidden="true" />
                ))}
              </div>
              <span className="text-xs font-black text-foreground">4.8</span>
              <span className="text-[10px] text-muted-foreground">· 89 reviews</span>
            </div>
          </div>
        </div>

        {/* Business hours */}
        <div className="px-5 mb-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Business Hours</h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            {businessHours.map(({ day, hours }, idx) => (
              <div key={day} className={`flex items-center justify-between px-4 py-3 ${idx < businessHours.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{day}</span>
                </div>
                <span className={`text-xs font-semibold ${hours === "Closed" ? "text-red-500" : "text-muted-foreground"}`}>
                  {hours}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle open/closed */}
        <div className="px-5 mb-5">
          <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isOpen ? "sky-gradient" : "bg-muted"}`}>
                <Store className={`w-4 h-4 ${isOpen ? "text-white" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Store Status</p>
                <p className="text-[10px] text-muted-foreground">{isOpen ? "Visible to buyers" : "Hidden from listings"}</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={isOpen}
              onClick={() => setIsOpen(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-all duration-200 ${isOpen ? "sky-gradient" : "bg-border"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${isOpen ? "left-6" : "left-1"}`} />
              <span className="sr-only">{isOpen ? "Store open" : "Store closed"}</span>
            </button>
          </div>
        </div>

        {/* Menu sections */}
        {menuSections.map(({ title, items }) => (
          <div key={title} className="px-5 mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">{title}</h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              {items.map(({ icon, label, action }, idx) => (
                <button
                  key={label}
                  onClick={action}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-left ${
                    idx < items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <div className="px-5 mt-2 mb-2">
          <button
            onClick={logout}
            className="w-full glass-card rounded-2xl flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--danger-bg)" }}>
              <LogOut className="w-4 h-4" style={{ color: "var(--danger)" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--danger)" }}>Sign Out</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4 mb-2">
          FOOD4ALL v1.0.0 · Seller Portal · Davao City
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
