import type { LoginInput, RegisterInput } from "@/lib/types"

export type LoginValidationErrors = {
  email?: string
  password?: string
}

export type RegisterValidationErrors = Partial<Record<keyof RegisterInput, string>>

export interface ValidationResult<Errors> {
  isValid: boolean
  errors: Errors
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLoginInput({
  email,
  password,
}: LoginInput): ValidationResult<LoginValidationErrors> {
  const errors: LoginValidationErrors = {}
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = "Email is required."
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address."
  }

  if (!password) {
    errors.password = "Password is required."
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateRegisterInput({
  firstName,
  lastName,
  email,
  password,
}: RegisterInput): ValidationResult<RegisterValidationErrors> {
  const errors: RegisterValidationErrors = {}
  const trimmedEmail = email.trim()

  if (!firstName.trim()) {
    errors.firstName = "First name is required."
  }

  if (!lastName.trim()) {
    errors.lastName = "Last name is required."
  }

  if (!trimmedEmail) {
    errors.email = "Email is required."
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address."
  }

  if (!password) {
    errors.password = "Password is required."
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters."
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
