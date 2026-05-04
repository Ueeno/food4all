"use client"

import { useAppState, type Screen } from "@/lib/app-state"
import { Home, Grid3X3, ShoppingCart, Package, User, LayoutDashboard, PlusSquare, ClipboardList, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  icon: React.ElementType
  screen: Screen
}

const BUYER_ITEMS: NavItem[] = [
  { label: "Home", icon: Home, screen: "buyer-home" },
  { label: "Categories", icon: Grid3X3, screen: "buyer-categories" },
  { label: "Cart", icon: ShoppingCart, screen: "buyer-cart" },
  { label: "Orders", icon: Package, screen: "buyer-orders" },
  { label: "Profile", icon: User, screen: "buyer-profile" },
]

const SELLER_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, screen: "seller-dashboard" },
  { label: "Products", icon: ClipboardList, screen: "seller-products" },
  { label: "Add", icon: PlusSquare, screen: "seller-add-product" },
  { label: "Orders", icon: Package, screen: "seller-orders" },
  { label: "Reports", icon: BarChart3, screen: "seller-reports" },
]

export function BottomNav() {
  const { screen, navigate, role, cartCount } = useAppState()
  const items = role === "seller" ? SELLER_ITEMS : BUYER_ITEMS

  return (
    <nav
      className="glass-nav absolute bottom-0 left-0 right-0 z-50 px-2 pb-safe"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = screen === item.screen
          const isCart = item.screen === "buyer-cart"

          return (
            <button
              key={item.screen}
              onClick={() => navigate(item.screen)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200",
                isActive
                  ? "sky-gradient text-white shadow-lg shadow-primary/30 scale-105"
                  : "text-foreground/50 hover:text-foreground/80 hover:bg-white/20",
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "")} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-semibold", isActive ? "text-white" : "")}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
