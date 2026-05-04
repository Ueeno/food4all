"use client"

import { useState } from "react"
import { useAppState } from "@/lib/app-state"
import { AppButton, RoleCard } from "@/components/food4all"
import { ShoppingBag, Store } from "lucide-react"

export function RoleSelectScreen() {
  const { selectRole } = useAppState()
  const [selected, setSelected] = useState<"buyer" | "seller" | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState("")

  const handleContinue = async () => {
    const role = selected

    if (!role) return

    setLoading(true)
    setActionError("")
    
    try {
      await selectRole(role)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save role.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden sky-gradient-deep">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-10 -left-10 w-48 h-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-24 -right-16 w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-16 pb-8 px-6 flex flex-col items-center">
        <div className="glass w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-3xl font-black text-white">4</span>
        </div>
        <h1 className="text-3xl font-black text-white text-center text-balance">
          How will you use FOOD4ALL?
        </h1>
        <p className="text-white/70 text-sm mt-2 text-center text-pretty">
          Choose your role to set up your personalized experience
        </p>
      </div>

      {/* Role cards */}
      <div className="relative z-10 flex-1 px-5 flex flex-col gap-4">
        <RoleCard
          icon={ShoppingBag}
          title="I'm a Buyer"
          description="Browse and reserve discounted bulk processed foods from Davao City sellers."
          tags={["Browse Products", "Reserve Items", "Pickup Orders"]}
          selected={selected === "buyer"}
          onClick={() => setSelected("buyer")}
        />

        <RoleCard
          icon={Store}
          title="I'm a Seller"
          description="List near-expiry bulk food products and connect with buyers across Davao City."
          tags={["List Products", "Manage Orders", "Track Sales"]}
          selected={selected === "seller"}
          onClick={() => setSelected("seller")}
        />

        {/* Error message */}
        {actionError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4" role="alert">
            <p className="text-sm text-red-500 text-center">{actionError}</p>
          </div>
        )}

        {/* Continue button */}
        <div className="pb-8 pt-2">
          <AppButton
            variant="primary"
            size="xl"
            fullWidth
            loading={loading}
            disabled={!selected}
            onClick={handleContinue}
            className={!selected ? "opacity-50" : ""}
          >
            Continue as {selected === "buyer" ? "Buyer" : selected === "seller" ? "Seller" : "..."}
          </AppButton>
        </div>
      </div>
    </div>
  )
}
