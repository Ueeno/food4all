"use client"

import { useEffect, useState } from "react"
import { useAppState } from "@/lib/app-state"
import { BottomNav } from "@/components/bottom-nav"
import { CategoryCard, LoadingView, ProductCard } from "@/components/food4all"
import { getCategories } from "@/lib/services/category-service"
import { getFeaturedProducts, getHotProducts, getProducts } from "@/lib/services/product-service"
import type { Category, Product } from "@/lib/types"
import {
  Search,
  Bell,
  MapPin,
  Flame,
  Clock,
  ShieldCheck,
  Star,
  ChevronRight,
  TrendingDown,
  Leaf,
} from "lucide-react"

export function BuyerHomeScreen() {
  const { navigate, selectProduct } = useAppState()
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<Product[]>([])
  const [hotDeals, setHotDeals] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadMarketplace() {
      const [nextCategories, nextProducts, nextFeatured, nextHotDeals] = await Promise.all([
        getCategories(),
        getProducts(),
        getFeaturedProducts(),
        getHotProducts(),
      ])

      if (ignore) return

      setCategories(nextCategories)
      setAllProducts(nextProducts.slice(0, 6))
      setFeatured(nextFeatured)
      setHotDeals(nextHotDeals)
      setLoading(false)
    }

    loadMarketplace()

    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        <LoadingView label="Loading marketplace..." className="flex-1" />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* â”€â”€ Sky gradient header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="sky-gradient-deep pt-12 pb-28 px-5 relative overflow-hidden shrink-0">
        {/* Subtle highlight orb */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.12) 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between mb-3">
          <div>
            <p className="text-white/65 text-xs font-medium">Good morning,</p>
            <h2 className="text-white text-[17px] font-bold leading-tight">Maria Santos</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="glass w-10 h-10 rounded-full flex items-center justify-center relative"
              aria-label="Notifications (3 new)"
            >
              <Bell className="w-5 h-5 text-white" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-400 rounded-full border border-white/40"
                aria-hidden="true"
              />
            </button>
            <button
              className="w-10 h-10 rounded-full overflow-hidden glass ring-2 ring-white/35"
              aria-label="Profile"
              onClick={() => navigate("buyer-profile")}
            >
              <div className="w-full h-full sky-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
            </button>
          </div>
        </div>

        {/* Location */}
        <button
          className="relative z-10 flex items-center gap-1.5 mb-4 group"
          aria-label="Change delivery location"
        >
          <MapPin className="w-3.5 h-3.5 text-white/75" />
          <span className="text-white/75 text-xs font-medium">Davao City, Philippines</span>
          <ChevronRight className="w-3 h-3 text-white/50 group-hover:text-white/80 transition-colors" />
        </button>

        {/* Search bar */}
        <div className="relative z-10">
          <button
            onClick={() => navigate("buyer-product-list")}
            className="w-full glass rounded-2xl flex items-center gap-3 px-4 py-3 text-left"
            aria-label="Search products"
          >
            <Search className="w-4 h-4 text-white/65 shrink-0" />
            <span className="flex-1 text-sm text-white/50">Search hotdogs, tocino, bacon...</span>
            <span className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1 rounded-xl transition-all">
              Search
            </span>
          </button>
        </div>
      </div>

      {/* â”€â”€ Scrollable body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="flex-1 overflow-y-auto -mt-16 pb-24"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Savings hero banner */}
        <div className="px-5 mb-5">
          <div className="glass-card-strong rounded-3xl p-5 relative overflow-hidden">
            {/* Green tint strip */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "linear-gradient(135deg, oklch(0.50 0.16 142 / 0.07) 0%, transparent 60%)" }}
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="w-3.5 h-3.5 text-success" />
                  <span className="text-[10px] font-bold text-success uppercase tracking-wide">
                    Save up to 60% today
                  </span>
                </div>
                <h3 className="text-foreground font-black text-base leading-tight mb-1">
                  Near-Expiry Bulk Food
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Certified safe. Deep discounts on hotdogs, tocino & more.
                </p>
              </div>
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-success/10 flex flex-col items-center justify-center border border-success/20">
                <span className="text-success font-black text-xl leading-none">60</span>
                <span className="text-success text-[9px] font-bold">% OFF</span>
              </div>
            </div>
            {/* Trust pills */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                { icon: <ShieldCheck className="w-3 h-3" />, label: "FDA Certified" },
                { icon: <Leaf className="w-3 h-3" />, label: "Zero Waste" },
                { icon: <Star className="w-3 h-3 fill-current" />, label: "4.8 Avg Rating" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1 badge-trust rounded-full px-2.5 py-1 text-[10px]">
                  {icon}
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgency strip */}
        <div className="px-5 mb-5">
          <div className="badge-urgency rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <p className="text-sm font-semibold flex-1">
              <span className="font-black">12 deals</span> expiring today â€” reserve before they&apos;re gone
            </p>
            <button
              onClick={() => navigate("buyer-product-list")}
              className="shrink-0 bg-warning text-white text-[10px] font-bold px-2.5 py-1 rounded-xl"
            >
              View
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="px-5 mb-6">
          <div className="glass-card-strong rounded-3xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground text-sm">Categories</h3>
              <button
                onClick={() => navigate("buyer-categories")}
                className="text-primary text-xs font-semibold flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {categories.slice(0, 8).map((cat) => (
                <CategoryCard
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  color={cat.color}
                  variant="compact"
                  onClick={() => navigate("buyer-product-list")}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Hot Deals â€” horizontal scroll */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-5 mb-3">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-warning" />
              <h3 className="font-bold text-foreground">Hot Deals</h3>
              <span className="badge-urgency text-[10px] font-bold px-2 py-0.5 rounded-full">
                Expiring Soon
              </span>
            </div>
            <button
              onClick={() => navigate("buyer-product-list")}
              className="text-primary text-xs font-semibold flex items-center gap-0.5"
            >
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: "none" }}>
            {hotDeals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="compact"
                showSeller={false}
                showSavings
                onClick={() => {
                  selectProduct(product.id)
                  navigate("buyer-product-detail")
                }}
              />
            ))}
          </div>
        </div>

        {/* Featured â€” vertical grid */}
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Featured Products</h3>
            <button
              onClick={() => navigate("buyer-product-list")}
              className="text-primary text-xs font-semibold flex items-center gap-0.5"
            >
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(featured.length > 0 ? featured : allProducts).slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
                showSeller
                showRating
                onClick={() => {
                  selectProduct(product.id)
                  navigate("buyer-product-detail")
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom trust block */}
        <div className="px-5 mb-4">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">100% Safe to Eat</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All products are FDA-registered and tested within safe consumption windows.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
