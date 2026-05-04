"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useAppState } from "@/lib/app-state"
import { BottomNav } from "@/components/bottom-nav"
import { AppButton, DashboardMetricCard, LoadingView } from "@/components/food4all"
import { getSellerDashboard } from "@/lib/services/seller-service"
import type { SellerDashboard, SellerDashboardMetricKey } from "@/lib/types"
import {
  Bell,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Clock,
  Store,
} from "lucide-react"

export function SellerDashboardScreen() {
  const { navigate } = useAppState()

  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const metricDisplay: Record<SellerDashboardMetricKey, { icon: typeof TrendingUp; color: string }> = {
    revenue: { icon: TrendingUp, color: "#38a8e8" },
    pendingOrders: { icon: Package, color: "#10b981" },
    expiringItems: { icon: AlertTriangle, color: "#f59e0b" },
    totalSales: { icon: BarChart3, color: "#8b5cf6" },
  }

  useEffect(() => {
    let ignore = false

    async function loadDashboard() {
      try {
        setError(null)
        setLoading(true)
        const nextDashboard = await getSellerDashboard()

        if (ignore) return

        setDashboard(nextDashboard)
      }catch {
        if (!ignore) {
          setError("Failed to load dashboard metrics.")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      ignore = true
    }
  }, [])

  if (loading || !dashboard) {
    return (
      <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Failed to load dashboard</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">{error}</p>
            <AppButton
              variant="outline"
              onClick={() => {
                setLoading(true)
                setError(null)
                getSellerDashboard()
                  .then(setDashboard)
                  .catch(() => setError("Failed to load dashboard metrics."))
                  .finally(() => setLoading(false))
              }}
            >
              Try Again
            </AppButton>
          </div>
        ) : (
          <LoadingView label="Loading seller dashboard..." className="flex-1" />
        )}
        <BottomNav />
      </div>
    )
  }
  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-20 px-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative z-10 flex items-center justify-between mb-2">
          <div>
            <p className="text-white/70 text-xs font-medium">Seller Dashboard</p>
            <h2 className="text-white text-xl font-black">Magsaysay Meat Depot</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="glass w-10 h-10 rounded-full flex items-center justify-center relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" aria-hidden="true" />
            </button>
            <div className="w-10 h-10 rounded-full sky-gradient flex items-center justify-center ring-2 ring-white/40 shadow-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white/80 text-xs">Store is Open Â· Poblacion District, Davao</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto -mt-12 pb-24" style={{ scrollbarWidth: "none" }}>
        {/* Stats grid */}
        <div className="px-5 mb-5">
          <div className="grid grid-cols-2 gap-3">
            {dashboard.metrics.map((stat) => (
              <DashboardMetricCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                trend={stat.trend}
                icon={metricDisplay[stat.key].icon}
                color={metricDisplay[stat.key].color}
              />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 mb-5">
          <div className="glass-card rounded-2xl p-4 shadow-lg">
            <h3 className="font-bold text-foreground text-sm mb-3">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2">
              <AppButton
                variant="primary"
                size="sm"
                className="flex-col h-auto py-3 text-[11px] rounded-2xl"
                onClick={() => navigate("seller-add-product")}
                icon={<Plus className="w-5 h-5" />}
              >
                Add Product
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                className="flex-col h-auto py-3 text-[11px] rounded-2xl"
                onClick={() => navigate("seller-orders")}
                icon={<Package className="w-5 h-5" />}
              >
                View Orders
              </AppButton>
              <AppButton
                variant="outline"
                size="sm"
                className="flex-col h-auto py-3 text-[11px] rounded-2xl"
                onClick={() => navigate("seller-reports")}
                icon={<BarChart3 className="w-5 h-5" />}
              >
                Reports
              </AppButton>
            </div>
          </div>
        </div>

        {/* Pending orders */}
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Pending Pickups</h3>
            <button
              onClick={() => navigate("seller-orders")}
              className="text-primary text-xs font-semibold flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {dashboard.pendingOrders.map((order) => (
              <div
                key={order.id}
                className="glass-card rounded-2xl p-4 shadow-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">{order.id}</p>
                    <p className="text-[10px] text-muted-foreground">{order.buyer}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      order.status === "ready"
                        ? "bg-green-100/80 text-green-700"
                        : "bg-blue-100/80 text-blue-700"
                    }`}
                  >
                    {order.status === "ready" ? "Ready" : "Reserved"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{order.product}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  x{order.quantity} Â· â‚±{order.total} Â· Pickup: {order.pickupDate} {order.pickupTime}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate("seller-verify-pickup")}
                    className="flex-1 glass-btn rounded-xl py-2 text-xs font-semibold text-white flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verify Pickup
                  </button>
                  {order.status === "reserved" && (
                    <button className="flex-1 glass-btn-outline rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Mark Ready
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring soon */}
        <div className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-foreground">Expiring Soon</h3>
            </div>
            <button
              onClick={() => navigate("seller-products")}
              className="text-primary text-xs font-semibold"
            >
              Manage
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {dashboard.expiringProducts.map((product) => (
              <div key={product.id} className="glass-card rounded-2xl overflow-hidden flex shadow-lg">
                <div className="relative w-16 h-16 bg-gray-50/50 shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 p-3">
                  <p className="text-xs font-bold text-foreground line-clamp-1">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground">{product.quantity} {product.unit} remaining</p>
                  <div className="flex items-center justify-between mt-1">
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        product.daysUntilExpiry <= 7 ? "bg-red-100/80 text-red-600" : "bg-orange-100/80 text-orange-600"
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-bold">{product.daysUntilExpiry} days left</span>
                    </div>
                    <span className="text-xs font-black text-primary">â‚±{product.discountedPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
