"use client"

import { useEffect, useState } from "react"
import { useAppState } from "@/lib/app-state"
import { BottomNav } from "@/components/bottom-nav"
import { CategoryCard, EmptyStateWidget, LoadingView, ProductCard } from "@/components/food4all"
import { getCategories } from "@/lib/services/category-service"
import { getProducts } from "@/lib/services/product-service"
import type { Category, Product } from "@/lib/types"
import {
  Search,
  ChevronLeft,
  SlidersHorizontal,
} from "lucide-react"

// â”€â”€â”€ Product List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function BuyerProductListScreen() {
  const { navigate, selectProduct } = useAppState()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"discount" | "expiry" | "price">("discount")

  useEffect(() => {
    let ignore = false

    async function loadProducts() {
      const [nextProducts, nextCategories] = await Promise.all([getProducts(), getCategories()])

      if (ignore) return

      setProducts(nextProducts)
      setCategories(nextCategories)
      setLoading(false)
    }

    loadProducts()

    return () => {
      ignore = true
    }
  }, [])

  const filtered = products.filter((p) => {
    const matchesCategory =
      activeCategory === "all" ||
      p.category.toLowerCase().replace(/\s+/g, "-") === activeCategory
    const matchesSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.seller.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a, b) => {
    if (sortBy === "discount") return b.discountPercent - a.discountPercent
    if (sortBy === "expiry") return a.daysUntilExpiry - b.daysUntilExpiry
    if (sortBy === "price") return a.discountedPrice - b.discountedPrice
    return 0
  })

  const sortLabels: Record<typeof sortBy, string> = {
    discount: "Best Discount",
    expiry: "Expiring Soon",
    price: "Lowest Price",
  }

  if (loading) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        <LoadingView label="Loading products..." className="flex-1" />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-5 px-5 relative shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("buyer-home")}
            className="glass w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg flex-1">Browse Products</h1>
          <button
            className="glass w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            aria-label="Advanced filter"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-white/65 shrink-0" />
          <input
            type="search"
            placeholder="Search products, sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
            aria-label="Search products"
          />
        </div>
      </div>

      {/* Category pills */}
      <div
        className="flex gap-2 overflow-x-auto px-5 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50 shrink-0"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          onClick={() => setActiveCategory("all")}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            activeCategory === "all"
              ? "sky-gradient text-white shadow-md shadow-primary/25"
              : "glass-card text-foreground/65 hover:bg-muted"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeCategory === cat.id
                ? "sky-gradient text-white shadow-md shadow-primary/25"
                : "glass-card text-foreground/65 hover:bg-muted"
            }`}
          >
            <span role="img" aria-label={cat.label} className="text-[13px]">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sort + count bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-background shrink-0">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{filtered.length}</span> products
        </p>
        <div className="flex gap-1.5">
          {(["discount", "expiry", "price"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                sortBy === s
                  ? "bg-primary text-white"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {sortLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ scrollbarWidth: "none" }}>
        {filtered.length === 0 ? (
          <EmptyStateWidget
            icon={Search}
            title="No products found"
            description="Try another category or clear the current filters."
            className="py-20"
            action={
              <button
                onClick={() => { setSearchQuery(""); setActiveCategory("all") }}
                className="text-primary text-sm font-semibold"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
                showSeller={false}
                showLocation
                showRating
                showSavings
                onClick={() => {
                  selectProduct(product.id)
                  navigate("buyer-product-detail")
                }}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

// â”€â”€â”€ Categories Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function BuyerCategoriesScreen() {
  const { navigate } = useAppState()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadCategories() {
      const [nextProducts, nextCategories] = await Promise.all([getProducts(), getCategories()])

      if (ignore) return

      setProducts(nextProducts)
      setCategories(nextCategories)
      setLoading(false)
    }

    loadCategories()

    return () => {
      ignore = true
    }
  }, [])

  const categoryCounts: Record<string, number> = {}
  products.forEach((p) => {
    const key = p.category.toLowerCase().replace(/\s+/g, "-")
    categoryCounts[key] = (categoryCounts[key] || 0) + 1
  })

  if (loading) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        <LoadingView label="Loading categories..." className="flex-1" />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-6 px-5 relative shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("buyer-home")}
            className="glass w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">All Categories</h1>
            <p className="text-white/65 text-xs">Browse by food type</p>
          </div>
        </div>
      </div>

      {/* Category cards */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24" style={{ scrollbarWidth: "none" }}>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0
            const categoryProducts = products.filter(
              (p) => p.category.toLowerCase().replace(/\s+/g, "-") === cat.id
            )
            const bestDiscount = categoryProducts.length
              ? Math.max(...categoryProducts.map((p) => p.discountPercent))
              : 0

            return (
              <CategoryCard
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                color={cat.color}
                count={count}
                bestDiscount={bestDiscount}
                onClick={() => navigate("buyer-product-list")}
              />
            )
          })}
        </div>

        {/* All products section */}
        <div className="mt-6">
          <h3 className="font-bold text-foreground mb-3">All Products</h3>
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
                showSeller={false}
                onClick={() => navigate("buyer-product-list")}
              />
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
