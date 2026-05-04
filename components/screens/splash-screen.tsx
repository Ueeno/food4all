"use client"

import { useEffect } from "react"
import { useAppState } from "@/lib/app-state"

export function SplashScreen() {
  const { navigate } = useAppState()

  useEffect(() => {
    const timer = setTimeout(() => navigate("login"), 2800)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden sky-gradient-deep">
      {/* Subtle background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]" />
        <div className="absolute top-1/3 -left-16 w-56 h-56 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-16 right-8 w-64 h-64 rounded-full bg-white/[0.05]" />
      </div>

      {/* Logo mark */}
      <div
        className="relative z-10 flex flex-col items-center gap-7 animate-in fade-in slide-in-from-bottom-6 duration-700"
        style={{ animationFillMode: "both" }}
      >
        {/* Icon container */}
        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl shadow-black/20">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="FOOD4ALL icon">
            {/* Shopping bag */}
            <path d="M10 20h32l-3 20H13L10 20z" fill="white" fillOpacity="0.9" />
            {/* Bag handle */}
            <path d="M18 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.9" />
            {/* Leaf / green dot accent */}
            <circle cx="20" cy="32" r="3" fill="#4ade80" />
            <circle cx="26" cy="32" r="3" fill="#4ade80" fillOpacity="0.7" />
            <circle cx="32" cy="32" r="3" fill="#4ade80" fillOpacity="0.4" />
          </svg>
        </div>

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-[42px] font-black text-white tracking-tight leading-none drop-shadow-sm">
            FOOD<span className="text-white/50">4</span>ALL
          </h1>
          <p className="mt-2.5 text-white/70 text-sm font-medium tracking-[0.18em] uppercase">
            Waste Less, Save More
          </p>
        </div>

        {/* Location pill */}
        <div className="flex items-center gap-2 bg-white/12 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 1C4.015 1 2 3.015 2 5.5c0 3.375 4.5 7.5 4.5 7.5s4.5-4.125 4.5-7.5C11 3.015 8.985 1 6.5 1z" fill="white" fillOpacity="0.85" />
            <circle cx="6.5" cy="5.5" r="1.5" fill="#0d5fad" />
          </svg>
          <span className="text-white/85 text-xs font-semibold">Davao City, Philippines</span>
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-14 flex flex-col items-center gap-3">
        <div className="flex gap-1.5" aria-label="Loading" role="status">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
              style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
