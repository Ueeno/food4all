import { useId, type ElementType, type InputHTMLAttributes, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface AppTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ElementType
  rightElement?: ReactNode
  error?: string
  inputClassName?: string
}

export function AppTextField({
  className,
  inputClassName,
  label,
  icon: Icon,
  rightElement,
  error,
  id,
  ...props
}: AppTextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn("mb-4", className)}>
      {label && (
        <label
          className="text-sm font-semibold text-foreground/85 mb-1.5 block"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
            aria-hidden="true"
          />
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            "glass-input w-full py-3.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:ring-0 transition-all",
            Icon ? "pl-10" : "pl-4",
            rightElement ? "pr-11" : "pr-4",
            error && "border-danger",
            inputClassName,
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
