"use client"

import { useState } from "react"
import { useAppState } from "@/lib/app-state"
import { BottomNav } from "@/components/bottom-nav"
import { GlassButton } from "@/components/glass-button"
import {
  CheckCircle2,
  MapPin,
  Clock,
  Package,
  Share2,
  Star,
  ChevronRight,
  ShieldCheck,
  Bell,
  LogOut,
  TrendingDown,
  Leaf,
  Award,
  Timer,
  QrCode,
  Settings,
  HelpCircle,
  ChevronDown,
} from "lucide-react"

// ─── Countdown Badge ────────────────────────────────────────────
function CountdownBadge({ hours }: { hours: number }) {
  const isUrgent = hours <= 4
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
        isUrgent ? "badge-urgency" : "bg-primary/10 text-primary"
      }`}
    >
      <Timer className="w-3.5 h-3.5" />
      {isUrgent ? `Pickup within ${hours}h` : `${hours}h to pickup`}
    </div>
  )
}

// ─── QR Pickup Confirmation Screen ─────────────────────────────
export function BuyerPickupQRScreen() {
  const { navigate } = useAppState()
  const [claimed, setClaimed] = useState(false)

  const pickupCode = "F4A-7X29"
  const order = {
    id: "ORD-2847",
    product: "Purefoods Tender Juicy Hotdog",
    qty: 3,
    total: 555,
    savings: 240,
    pickupDate: "April 30, 2026",
    pickupTime: "2:00 PM",
    deadline: "5:00 PM today",
    hoursLeft: 3,
    seller: "Magsaysay Meat Depot",
    address: "Magsaysay Market, Poblacion District, Davao City",
  }

  if (claimed) {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6 sky-gradient-deep overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-12 -right-10 w-56 h-56 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
          <div className="absolute bottom-16 -left-14 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 w-full max-w-sm">
          <div className="glass-card-strong rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-xl"
              style={{ background: "var(--success-bg)" }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: "var(--success)" }} />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-2">Pickup Complete!</h1>
            <p className="text-muted-foreground text-sm mb-1">Order {order.id} has been claimed.</p>
            <p className="text-xs text-muted-foreground mb-6">
              Thank you for choosing near-expiry food. You helped reduce waste!
            </p>
            <div className="glass rounded-2xl p-4 mb-5 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Product</span>
                <span className="text-xs font-semibold text-foreground line-clamp-1 max-w-[55%] text-right">{order.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Total Paid</span>
                <span className="text-sm font-black text-primary">₱{order.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">You Saved</span>
                <span className="text-xs font-bold" style={{ color: "var(--success)" }}>₱{order.savings}</span>
              </div>
            </div>
            <GlassButton variant="primary" size="lg" fullWidth onClick={() => navigate("buyer-orders")}>
              View All Orders
            </GlassButton>
            <button onClick={() => navigate("buyer-home")}
              className="mt-3 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden sky-gradient-deep">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-8 -right-12 w-52 h-52 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
        <div className="absolute bottom-24 -left-16 w-56 h-56 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-14 pb-4 px-5 text-center shrink-0">
        <div className="w-14 h-14 mx-auto mb-3 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/35">
          <QrCode className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Show QR at Store</h1>
        <p className="text-white/70 text-sm">Present this code when you arrive</p>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-8" style={{ scrollbarWidth: "none" }}>
        {/* Deadline urgency strip */}
        <div className="flex justify-center mb-4">
          <CountdownBadge hours={order.hoursLeft} />
        </div>

        {/* QR card */}
        <div className="glass-card-strong rounded-3xl p-6 shadow-2xl mb-4">
          {/* QR code SVG */}
          <div className="w-52 h-52 mx-auto mb-4 bg-white rounded-2xl p-3 shadow-inner flex items-center justify-center">
            <svg width="168" height="168" viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg"
              aria-label={`QR Code for pickup code ${pickupCode}`}>
              {/* Top-left finder */}
              <rect x="8" y="8" width="44" height="44" rx="5" fill="none" stroke="#0f172a" strokeWidth="4" />
              <rect x="16" y="16" width="28" height="28" rx="3" fill="#0f172a" />
              {/* Top-right finder */}
              <rect x="116" y="8" width="44" height="44" rx="5" fill="none" stroke="#0f172a" strokeWidth="4" />
              <rect x="124" y="16" width="28" height="28" rx="3" fill="#0f172a" />
              {/* Bottom-left finder */}
              <rect x="8" y="116" width="44" height="44" rx="5" fill="none" stroke="#0f172a" strokeWidth="4" />
              <rect x="16" y="124" width="28" height="28" rx="3" fill="#0f172a" />
              {/* Data modules */}
              {[
                [64,8],[72,8],[80,8],[96,8],[64,16],[80,16],[104,16],
                [64,24],[72,24],[88,24],[64,32],[80,32],[88,32],[104,32],
                [64,40],[72,40],[80,40],[104,40],[64,48],[88,48],[104,48],
                [8,64],[16,64],[24,64],[40,64],[8,72],[24,72],[40,72],
                [8,80],[16,80],[40,80],[8,88],[16,88],[24,88],[40,88],
                [64,64],[72,64],[80,64],[104,64],[64,72],[80,72],[88,72],
                [64,80],[80,80],[96,80],[64,88],[72,88],[104,88],
                [64,96],[72,96],[80,96],[88,96],[64,104],[80,104],[88,104],
                [116,64],[124,64],[148,64],[156,64],[116,72],[136,72],[156,72],
                [116,80],[124,80],[148,80],[116,88],[136,88],[156,88],
                [116,96],[124,96],[136,96],[156,96],[116,104],[136,104],[148,104],
                [8,112],[16,112],[40,112],[8,120],[24,120],[40,120],
                [8,128],[16,128],[24,128],[40,128],[8,136],[24,136],
                [8,148],[24,148],[40,148],[8,156],[16,156],[24,156],
                [64,112],[72,112],[88,112],[104,112],[64,120],[80,120],
                [64,128],[72,128],[88,128],[104,128],[64,136],[80,136],[104,136],
                [116,112],[124,112],[148,112],[156,112],[116,120],[136,120],
                [116,128],[124,128],[148,128],[156,128],[116,136],[136,136],[148,136],
                [116,148],[124,148],[148,148],[116,156],[136,156],[148,156],[156,156],
              ].map(([x, y], i) => (
                <rect key={i} x={x} y={y} width="7" height="7" fill="#0f172a" rx="1" />
              ))}
              {/* Center branding */}
              <rect x="72" y="72" width="24" height="24" rx="5" fill="#4DA6FF" />
              <text x="84" y="87" textAnchor="middle" fill="white" fontSize="11" fontWeight="900">F4</text>
            </svg>
          </div>

          {/* Pickup code display */}
          <div className="text-center mb-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
              Pickup Code
            </p>
            <div className="flex items-center justify-center gap-2">
              {pickupCode.split("").map((char, i) => (
                <span key={i}
                  className={`font-black text-2xl tracking-tight ${
                    char === "-" ? "text-muted-foreground/40 text-lg" : "text-primary"
                  }`}>
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2">
            {[
              {
                icon: <Package className="w-4 h-4 text-white" />,
                label: "Order",
                value: `${order.id} · ₱${order.total}`,
              },
              {
                icon: <Clock className="w-4 h-4 text-white" />,
                label: "Pickup Window",
                value: `${order.pickupDate} · ${order.pickupTime} – ${order.deadline}`,
              },
              {
                icon: <MapPin className="w-4 h-4 text-white" />,
                label: "Pickup Location",
                value: order.address,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 bg-muted/60 rounded-2xl p-3">
                <div className="w-8 h-8 sky-gradient rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
                  <p className="text-xs font-bold text-foreground leading-snug">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Savings strip */}
          <div className="mt-4 rounded-2xl px-4 py-3 flex items-center gap-2 border"
            style={{
              background: "var(--success-bg)",
              borderColor: "oklch(0.50 0.16 142 / 0.2)"
            }}>
            <TrendingDown className="w-4 h-4 shrink-0" style={{ color: "var(--success)" }} />
            <p className="text-xs font-semibold" style={{ color: "var(--success)" }}>
              You saved <span className="font-black">₱{order.savings}</span> by buying near-expiry food!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-3">
          <button
            className="flex-1 glass-card rounded-2xl py-3 flex items-center justify-center gap-2 text-muted-foreground text-sm font-semibold hover:bg-muted transition-all active:scale-95"
            aria-label="Share pickup QR"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <GlassButton variant="primary" size="lg" className="flex-[2]"
            onClick={() => setClaimed(true)}>
            Claim Pickup
          </GlassButton>
        </div>
        <button onClick={() => navigate("buyer-orders")}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground/70 py-2 transition-colors">
          View All Orders
        </button>
      </div>
    </div>
  )
}

// ─── Orders Screen ─────────────────────────────────────────────
type OrderTab = "pending" | "ready" | "claimed" | "cancelled"

export function BuyerOrdersScreen() {
  const { navigate } = useAppState()
  const [activeTab, setActiveTab] = useState<OrderTab>("ready")

  const allOrders = [
    {
      id: "ORD-2847",
      item: "Purefoods Tender Juicy Hotdog",
      image: "/images/hotdogs.jpg",
      qty: 3,
      total: 555,
      savings: 240,
      seller: "Magsaysay Meat Depot",
      branch: "Poblacion District, Davao",
      status: "ready" as OrderTab,
      date: "Apr 30, 2026",
      pickupCode: "F4A-7X29",
      pickupTime: "2:00 PM",
    },
    {
      id: "ORD-2850",
      item: "Mega Protein Bundle Deal",
      image: "/images/bundle.jpg",
      qty: 1,
      total: 720,
      savings: 480,
      seller: "Magsaysay Meat Depot",
      branch: "Poblacion District, Davao",
      status: "pending" as OrderTab,
      date: "May 2, 2026",
      pickupCode: "F4A-5P66",
      pickupTime: "11:00 AM",
    },
    {
      id: "ORD-2831",
      item: "CDO Farmhouse Tocino",
      image: "/images/tocino.jpg",
      qty: 2,
      total: 280,
      savings: 100,
      seller: "Gaisano Grand Davao",
      branch: "Bajada, Davao City",
      status: "claimed" as OrderTab,
      date: "Apr 28, 2026",
      pickupCode: "F4A-9M12",
      pickupTime: "10:00 AM",
    },
    {
      id: "ORD-2810",
      item: "Chicken Nuggets Supreme",
      image: "/images/nuggets.jpg",
      qty: 5,
      total: 575,
      savings: 400,
      seller: "Lapanday Cold Storage",
      branch: "Buhangin, Davao City",
      status: "claimed" as OrderTab,
      date: "Apr 25, 2026",
      pickupCode: "F4A-3K44",
      pickupTime: "9:00 AM",
    },
    {
      id: "ORD-2798",
      item: "Hacienda Bacon Strips",
      image: "/images/bacon.jpg",
      qty: 2,
      total: 440,
      savings: 250,
      seller: "SM Supermarket Davao",
      branch: "Matina, Davao City",
      status: "cancelled" as OrderTab,
      date: "Apr 22, 2026",
      pickupCode: "F4A-1W90",
      pickupTime: "3:00 PM",
    },
  ]

  const tabs: { key: OrderTab; label: string; count: number }[] = [
    { key: "pending", label: "Pending", count: allOrders.filter(o => o.status === "pending").length },
    { key: "ready", label: "Ready", count: allOrders.filter(o => o.status === "ready").length },
    { key: "claimed", label: "Claimed", count: allOrders.filter(o => o.status === "claimed").length },
    { key: "cancelled", label: "Cancelled", count: allOrders.filter(o => o.status === "cancelled").length },
  ]

  const filtered = allOrders.filter(o => o.status === activeTab)
  const totalSaved = allOrders.filter(o => o.status === "claimed").reduce((s, o) => s + o.savings, 0)

  const statusStyle: Record<OrderTab, { label: string; dotColor: string; pill: string; text: string }> = {
    pending:   { label: "Pending",      dotColor: "bg-amber-400",   pill: "bg-amber-50 border border-amber-200",    text: "text-amber-700" },
    ready:     { label: "Ready",        dotColor: "bg-green-500",   pill: "bg-green-50 border border-green-200",    text: "text-green-700" },
    claimed:   { label: "Claimed",      dotColor: "bg-primary",     pill: "bg-primary/8 border border-primary/20",  text: "text-primary"   },
    cancelled: { label: "Cancelled",    dotColor: "bg-red-400",     pill: "bg-red-50 border border-red-200",        text: "text-red-600"   },
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-6 px-5 shrink-0">
        <h1 className="text-white font-black text-2xl">My Orders</h1>
        <p className="text-white/65 text-xs mt-0.5">Track your reservations and pickups</p>
      </div>

      {/* Summary stats */}
      <div className="px-5 -mt-4 mb-3 shrink-0">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Orders", value: allOrders.length },
            { label: "Total Saved", value: `₱${totalSaved}` },
            { label: "Waste Saved", value: "~4.2 kg" },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card-strong rounded-2xl p-3 text-center shadow-md">
              <p className="text-base font-black text-foreground">{value}</p>
              <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-3 shrink-0">
        <div className="glass-card rounded-2xl p-1 flex gap-1">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === key
                  ? "sky-gradient text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-[9px] font-black ${activeTab === key ? "text-white/80" : "text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ scrollbarWidth: "none" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 glass-card rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No {activeTab} orders</p>
            {activeTab === "pending" && (
              <GlassButton variant="primary" size="md" onClick={() => navigate("buyer-home")}>
                Browse Deals
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((order) => {
              const st = statusStyle[order.status]
              return (
                <button
                  key={order.id}
                  onClick={() => order.status === "ready" ? navigate("buyer-pickup-qr") : undefined}
                  className="glass-card rounded-2xl shadow-md text-left hover:shadow-lg active:scale-[0.99] transition-all overflow-hidden w-full"
                  aria-label={`Order ${order.id}, ${order.status}`}
                >
                  {/* Top row */}
                  <div className="flex gap-3 p-4 pb-3">
                    {/* Product thumbnail */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={order.image} alt={order.item} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground">{order.id}</span>
                        <span className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${st.pill} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} aria-hidden="true" />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground line-clamp-1 mb-0.5">
                        {order.item}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {order.seller} · {order.branch}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">{order.date}</span>
                  </div>

                  {/* Price row */}
                  <div className="px-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-primary font-black text-sm">₱{order.total}</span>
                      <span className="text-[10px] text-muted-foreground">Qty: {order.qty}</span>
                    </div>
                    <span className="badge-savings text-[9px] px-2 py-0.5 rounded-full">
                      Saved ₱{order.savings}
                    </span>
                  </div>

                  {/* CTA strip for ready orders */}
                  {order.status === "ready" && (
                    <div className="sky-gradient px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-[9px] font-medium">Ready for Pickup</p>
                        <p className="text-white font-black text-sm tracking-wider">{order.pickupCode}</p>
                      </div>
                      <div className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
                        <QrCode className="w-3.5 h-3.5 text-white" />
                        <span className="text-white text-[10px] font-bold">Show QR</span>
                        <ChevronRight className="w-3 h-3 text-white/70" />
                      </div>
                    </div>
                  )}

                  {/* Pickup time for pending */}
                  {order.status === "pending" && (
                    <div className="px-4 pb-3 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">
                        Pickup scheduled: {order.date} at {order.pickupTime}
                      </p>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

// ─── Profile Screen ─────────────────────────────────────────────
export function BuyerProfileScreen() {
  const { navigate, logout, currentUser } = useAppState()
  const [notificationsOn, setNotificationsOn] = useState(true)
  const [dealsAlertsOn, setDealsAlertsOn] = useState(true)
  const profileName = currentUser?.name ?? "FOOD4ALL Buyer"
  const profileEmail = currentUser?.email ?? "buyer@food4all.local"
  const profileInitials =
    profileName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "FB"

  const savedBranches = [
    { name: "Magsaysay Meat Depot", area: "Poblacion District", distance: "0.8 km" },
    { name: "Gaisano Grand Davao", area: "Bajada", distance: "2.1 km" },
    { name: "Lanang Premier", area: "Lanang", distance: "3.5 km" },
  ]

  const stats = [
    { label: "Orders", value: "12" },
    { label: "Total Saved", value: "₱2,840" },
    { label: "Waste Saved", value: "18 kg" },
  ]

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: <Package className="w-4 h-4 text-primary" />, label: "My Orders", screen: "buyer-orders" as const },
        { icon: <Star className="w-4 h-4 text-primary" />, label: "Reviews & Ratings", screen: null },
        { icon: <Award className="w-4 h-4" style={{ color: "var(--warning)" }} />, label: "Rewards & Badges", screen: null },
      ],
    },
    {
      title: "App Settings",
      items: [
        { icon: <ShieldCheck className="w-4 h-4 text-primary" />, label: "Privacy & Security", screen: null },
        { icon: <Settings className="w-4 h-4 text-muted-foreground" />, label: "Preferences", screen: null },
        { icon: <HelpCircle className="w-4 h-4 text-muted-foreground" />, label: "Help & Support", screen: null },
      ],
    },
  ]

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sky-gradient-deep pt-12 pb-16 px-5 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/25 border-2 border-white/40 flex items-center justify-center shadow-xl shrink-0">
            <span className="text-white font-black text-xl" aria-hidden="true">{profileInitials}</span>
          </div>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">{profileName}</h1>
            <p className="text-white/65 text-xs mt-0.5">{profileEmail}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="badge-trust rounded-full px-2.5 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                4.9 Verified Buyer
              </div>
              <div className="flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" aria-hidden="true" />
                <span className="text-white/80 text-[9px] font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24" style={{ scrollbarWidth: "none" }}>
        {/* Stats card */}
        <div className="px-5 -mt-9 mb-5">
          <div className="glass-card-strong rounded-2xl p-4 shadow-xl">
            <div className="grid grid-cols-3 divide-x divide-border">
              {stats.map(({ label, value }) => (
                <div key={label} className="text-center px-2">
                  <p className="text-lg font-black text-primary">{value}</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Environmental impact */}
        <div className="px-5 mb-5">
          <div className="glass-card rounded-2xl p-4" style={{ borderColor: "oklch(0.50 0.16 142 / 0.25)", borderWidth: "1px" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--success-bg)" }}>
                <Leaf className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: "var(--success)" }}>Your Impact</h3>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">
              You&apos;ve prevented <strong style={{ color: "var(--success)" }}>18 kg</strong> of food waste and
              saved <strong style={{ color: "var(--success)" }}>₱2,840</strong> across 12 orders. Keep going!
            </p>
            <div className="mt-3 h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: "72%", background: "var(--success)" }} />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">72% towards your 25 kg badge</p>
          </div>
        </div>

        {/* Notifications toggles */}
        <div className="px-5 mb-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Notifications</h3>
          <div className="glass-card rounded-2xl overflow-hidden">
            {[
              { label: "Order Updates", sub: "Pickup confirmations & status changes", state: notificationsOn, toggle: () => setNotificationsOn(v => !v) },
              { label: "Deal Alerts", sub: "New near-expiry listings in your area", state: dealsAlertsOn, toggle: () => setDealsAlertsOn(v => !v) },
            ].map(({ label, sub, state, toggle }, idx, arr) => (
              <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${idx < arr.length - 1 ? "border-b border-border" : ""}`}>
                <Bell className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={state}
                  onClick={toggle}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${
                    state ? "sky-gradient" : "bg-border"
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                    state ? "left-6" : "left-1"
                  }`} />
                  <span className="sr-only">{state ? "On" : "Off"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved pickup branches */}
        <div className="px-5 mb-5">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Saved Pickup Branches</h3>
          <div className="flex flex-col gap-2">
            {savedBranches.map((branch, idx) => (
              <div key={idx} className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 sky-gradient rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{branch.name}</p>
                  <p className="text-[10px] text-muted-foreground">{branch.area} · {branch.distance}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        {/* Menu sections */}
        {menuSections.map(({ title, items }) => (
          <div key={title} className="px-5 mb-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">{title}</h3>
            <div className="glass-card rounded-2xl overflow-hidden">
              {items.map(({ icon, label, screen }, idx) => (
                <button
                  key={label}
                  onClick={() => screen && navigate(screen)}
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
            className="w-full glass-card rounded-2xl flex items-center gap-3 px-4 py-3.5 hover:bg-red-50/60 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--danger-bg)" }}>
              <LogOut className="w-4 h-4" style={{ color: "var(--danger)" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--danger)" }}>Sign Out</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4 mb-2">
          FOOD4ALL v1.0.0 · Made in Davao City, Philippines
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
