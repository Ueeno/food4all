"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg" | "xl"
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export function GlassButton({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  children,
  disabled,
  ...props
}: GlassButtonProps) {
  const base =
    "relative inline-flex items-center justify-center font-semibold tracking-wide rounded-full overflow-hidden select-none cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none glossy-reflect"

  const sizes = {
    sm: "px-4 py-2 text-xs gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-3.5 text-base gap-2",
    xl: "px-10 py-4 text-lg gap-2.5",
  }

  const variants = {
    primary: "glass-btn text-white",
    outline: "glass-btn-outline",
    ghost:
      "bg-white/10 backdrop-blur-md border border-white/25 text-white/90 hover:bg-white/20 active:scale-95 shadow-sm",
    danger:
      "bg-red-500/85 backdrop-blur-md border border-red-300/40 text-white shadow-lg shadow-red-500/30 hover:bg-red-600/90 active:scale-95",
  }

  return (
    <button
      className={cn(
        base,
        sizes[size],
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Please wait...</span>
        </span>
      ) : (
        <>
          {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  )
}
