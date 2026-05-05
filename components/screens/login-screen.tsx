"use client"

import { useState } from "react"
import { useAppState } from "@/lib/app-state"
import { isApiClientError } from "@/lib/api-client"
import { validateLoginInput, type LoginValidationErrors } from "@/lib/auth-validation"
import { AppButton, AppTextField } from "@/components/food4all"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

// Inline logo mark â€” reused on auth screens
function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="FOOD4ALL">
      <path d="M10 20h32l-3 20H13L10 20z" fill="#4DA6FF" fillOpacity="0.9" />
      <path d="M18 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#1976D2" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="32" r="3" fill="#16A34A" />
      <circle cx="26" cy="32" r="3" fill="#16A34A" fillOpacity="0.65" />
      <circle cx="32" cy="32" r="3" fill="#16A34A" fillOpacity="0.35" />
    </svg>
  )
}

export function LoginScreen() {
  const { navigate, login } = useAppState()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<LoginValidationErrors>({})
  const [actionError, setActionError] = useState("")

  const clearError = (field: keyof LoginValidationErrors) =>
    setErrors((current) => ({ ...current, [field]: undefined }))

  const validateLogin = () => {
    const result = validateLoginInput({ email, password })

    setErrors(result.errors)
    return result.isValid
  }

  const handleLogin = async () => {
    if (!validateLogin()) return

    setLoading(true)
    setActionError("")

    try {
      await login({ email: email.trim(), password })
    } catch (error) {
      if (isApiClientError(error) && error.fieldErrors) {
        setErrors(error.fieldErrors)
      }

      setActionError(error instanceof Error ? error.message : "Unable to sign in.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-background">
      {/* Gradient hero header */}
      <div className="sky-gradient-deep pt-14 pb-10 px-6 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/[0.06]" />
          <div className="absolute bottom-0 -left-10 w-44 h-44 rounded-full bg-white/[0.04]" />
        </div>
        <div className="relative z-10 flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg">
            <LogoMark size={28} />
          </div>
          <div>
            <h1 className="text-white text-xl font-black tracking-tight leading-tight">FOOD4ALL</h1>
            <p className="text-white/60 text-[11px] font-medium">Waste Less, Save More</p>
          </div>
        </div>
        <p className="relative z-10 text-white/80 text-sm text-center mt-1">
          Davao City&apos;s bulk food marketplace
        </p>
      </div>

      {/* Form card */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="px-5 -mt-5">
          <div className="glass-card-strong rounded-3xl p-6 shadow-xl">
            <h2 className="text-[22px] font-black text-foreground mb-0.5">Welcome back</h2>
            <p className="text-muted-foreground text-sm mb-6">Sign in to your account</p>

            <AppTextField
              id="login-email"
              icon={Mail}
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError("email")
                setActionError("")
              }}
              placeholder="you@email.com"
              error={errors.email}
            />

            <AppTextField
              id="login-password"
              icon={Lock}
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError("password")
                setActionError("")
              }}
              placeholder="Password"
              className="mb-2"
              error={errors.password}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <button className="text-xs font-semibold text-primary hover:underline mb-5 block">
              Forgot password?
            </button>

            {actionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4" role="alert">
                <p className="text-sm text-red-500 text-center">{actionError}</p>
              </div>
            )}

            <AppButton
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleLogin}
              className="mb-5"
            >
              Sign In
            </AppButton>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <button className="glass-card flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-95">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button className="glass-card flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-95">
                <svg className="w-4 h-4 shrink-0" fill="#1877f2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-6 mb-8">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate("register")}
              className="text-primary font-bold hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
