import { describe, expect, it } from "vitest"

import {
  getZodFieldErrors,
  loginSchema,
  productListQuerySchema,
  registerSchema,
} from "@/lib/api/validation"

describe("API validation schemas", () => {
  it("normalizes valid register input without returning credentials elsewhere", () => {
    const result = registerSchema.safeParse({
      firstName: " Ana ",
      lastName: " Reyes ",
      phone: "",
      email: "ANA@EXAMPLE.COM ",
      password: "password123",
      role: "buyer",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        firstName: "Ana",
        lastName: "Reyes",
        phone: undefined,
        email: "ana@example.com",
        password: "password123",
        role: "buyer",
      })
    }
  })

  it("reports auth field errors for invalid register and login input", () => {
    const registerResult = registerSchema.safeParse({
      firstName: "",
      lastName: "",
      email: "bad-email",
      password: "short",
    })
    const loginResult = loginSchema.safeParse({
      email: "bad-email",
      password: "",
    })

    expect(registerResult.success).toBe(false)
    expect(loginResult.success).toBe(false)

    if (!registerResult.success) {
      expect(getZodFieldErrors(registerResult.error)).toMatchObject({
        firstName: "First name is required.",
        lastName: "Last name is required.",
        email: "Enter a valid email address.",
        password: "Password must be at least 8 characters.",
      })
    }

    if (!loginResult.success) {
      expect(getZodFieldErrors(loginResult.error)).toMatchObject({
        email: "Enter a valid email address.",
        password: "Password is required.",
      })
    }
  })

  it("coerces product-list query values and bounds page size", () => {
    const result = productListQuerySchema.safeParse({
      search: " tocino ",
      featured: "true",
      hot: "false",
      maxDaysUntilExpiry: "14",
      page: "2",
      pageSize: "10",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        search: "tocino",
        categoryId: undefined,
        sellerId: undefined,
        maxDaysUntilExpiry: 14,
        featured: true,
        hot: false,
        page: 2,
        pageSize: 10,
      })
    }

    expect(productListQuerySchema.safeParse({ pageSize: "100" }).success).toBe(false)
  })
})
