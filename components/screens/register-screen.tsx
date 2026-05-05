"use client"

import { useState } from "react"
import { useAppState } from "@/lib/app-state"
import { isApiClientError } from "@/lib/api-client"
import { validateRegisterInput, type RegisterValidationErrors } from "@/lib/auth-validation"
import { AppButton, AppTextField } from "@/components/food4all"
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronLeft } from "lucide-react"

type RegisterForm = {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
}

export function RegisterScreen() {
  const { navigate, register } = useAppState()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<RegisterValidationErrors>({})
  const [actionError, setActionError] = useState("")

  const handleRegister = async () => {
    if (!validateRegister()) return

    setLoading(true)
    setActionError("")

    try {
      await register({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      })
    } catch (error) {
      if (isApiClientError(error) && error.fieldErrors) {
        setErrors(error.fieldErrors)
      }

      setActionError(error instanceof Error ? error.message : "Unable to create account.")
    } finally {
      setLoading(false)
    }
  }

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setActionError("")
  }

  const validateRegister = () => {
    const result = validateRegisterInput(form)

    setErrors(result.errors)
    return result.isValid
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden overflow-y-auto sky-gradient-deep">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-24 -left-24 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }}
        />
      </div>

      {/* Back button & header */}
      <div className="relative z-10 pt-12 px-5 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate("login")}
          className="glass w-10 h-10 rounded-full flex items-center justify-center text-white"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Create Account</h1>
          <p className="text-white/65 text-xs">Join the FOOD4ALL community</p>
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 flex-1 px-5 pb-8">
        <div className="glass-card-strong rounded-3xl p-6 shadow-2xl">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3 mb-0">
            <AppTextField
              icon={User}
              label="First Name"
              type="text"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Maria"
              error={errors.firstName}
            />
            <AppTextField
              icon={User}
              label="Last Name"
              type="text"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Santos"
              error={errors.lastName}
            />
          </div>

          <AppTextField
            icon={Phone}
            label="Phone"
            placeholder="+63 9XX XXX XXXX"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            error={errors.phone}
          />
          <AppTextField
            icon={Mail}
            label="Email"
            placeholder="you@email.com"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />
          <AppTextField
            icon={Lock}
            label="Password"
            placeholder="Min. 8 characters"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {actionError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4" role="alert">
              <p className="text-sm text-red-500 text-center">{actionError}</p>
            </div>
          )}

          {/* Terms */}
          <label className="flex items-start gap-3 mb-5 cursor-pointer">
            <div className="relative mt-0.5">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-5 h-5 rounded-md glass-input border-primary/40 peer-checked:bg-primary/85 peer-checked:border-primary flex items-center justify-center transition-all">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I agree to the{" "}
              <span className="text-primary font-semibold">Terms of Service</span>
              {" "}and{" "}
              <span className="text-primary font-semibold">Privacy Policy</span>
            </p>
          </label>

          <AppButton
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleRegister}
          >
            Create Account
          </AppButton>
        </div>

        <div className="text-center mt-6">
          <p className="text-white/80 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("login")}
              className="text-white font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
