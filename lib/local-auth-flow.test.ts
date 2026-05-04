import { describe, expect, it } from "vitest"
import { canAccessScreen } from "@/lib/navigation-guards"
import { validateLoginInput, validateRegisterInput } from "./auth-validation"
import {
  createLoginTransition,
  createLogoutTransition,
  createRegisterTransition,
  createRoleSelectionTransition,
  getAuthStatus,
  isAuthenticated,
} from "./local-auth-flow"

describe("local auth validation and state flow", () => {
  it("rejects empty login email, invalid email, and empty password", () => {
    expect(validateLoginInput({ email: "", password: "password123" })).toMatchObject({
      isValid: false,
      errors: { email: "Email is required." },
    })

    expect(validateLoginInput({ email: "not-an-email", password: "password123" })).toMatchObject({
      isValid: false,
      errors: { email: "Enter a valid email address." },
    })

    expect(validateLoginInput({ email: "buyer@food4all.local", password: "" })).toMatchObject({
      isValid: false,
      errors: { password: "Password is required." },
    })
  })

  it("accepts valid login and creates authenticated local state", () => {
    const nextState = createLoginTransition({
      email: " Buyer@FOOD4ALL.Local ",
      password: "password123",
    })

    expect(nextState.currentUser).toMatchObject({
      id: "mock-buyer-food4all-local",
      name: "FOOD4ALL User",
      email: "buyer@food4all.local",
      role: null,
    })
    expect(nextState.selectedRole).toBeNull()
    expect(nextState.selectedProductId).toBeNull()
    expect(nextState.screen).toBe("role-select")
    expect(getAuthStatus(nextState.currentUser)).toBe("authenticated")
    expect(isAuthenticated(nextState.currentUser)).toBe(true)
  })

  it("rejects empty register fields, invalid email, and weak password", () => {
    const emptyResult = validateRegisterInput({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
    })

    expect(emptyResult.isValid).toBe(false)
    expect(emptyResult.errors).toMatchObject({
      firstName: "First name is required.",
      lastName: "Last name is required.",
      email: "Email is required.",
      password: "Password is required.",
    })

    expect(
      validateRegisterInput({
        firstName: "Maria",
        lastName: "Santos",
        phone: "",
        email: "maria",
        password: "password123",
      }),
    ).toMatchObject({
      isValid: false,
      errors: { email: "Enter a valid email address." },
    })

    expect(
      validateRegisterInput({
        firstName: "Maria",
        lastName: "Santos",
        phone: "",
        email: "maria@food4all.local",
        password: "short",
      }),
    ).toMatchObject({
      isValid: false,
      errors: { password: "Password must be at least 8 characters." },
    })
  })

  it("accepts valid register and creates authenticated local state", () => {
    const nextState = createRegisterTransition({
      firstName: " Maria ",
      lastName: " Santos ",
      phone: "+63 912 345 6789",
      email: " Maria.Santos@FOOD4ALL.Local ",
      password: "password123",
    })

    expect(nextState.currentUser).toMatchObject({
      id: "mock-maria-santos-food4all-local",
      name: "Maria Santos",
      email: "maria.santos@food4all.local",
      role: null,
    })
    expect(nextState.selectedRole).toBeNull()
    expect(nextState.screen).toBe("role-select")
    expect(isAuthenticated(nextState.currentUser)).toBe(true)
  })

  it("selects buyer role and allows buyer protected screens", () => {
    const loginState = createLoginTransition({
      email: "buyer@food4all.local",
      password: "password123",
    })
    const roleState = createRoleSelectionTransition(loginState.currentUser, "buyer")

    expect(roleState.selectedRole).toBe("buyer")
    expect(roleState.currentUser?.role).toBe("buyer")
    expect(roleState.screen).toBe("buyer-home")
    expect(canAccessScreen("buyer-home", roleState)).toBe(true)
    expect(canAccessScreen("seller-dashboard", roleState)).toBe(false)
  })

  it("selects seller role and allows seller protected screens", () => {
    const loginState = createLoginTransition({
      email: "seller@food4all.local",
      password: "password123",
    })
    const roleState = createRoleSelectionTransition(loginState.currentUser, "seller")

    expect(roleState.selectedRole).toBe("seller")
    expect(roleState.currentUser?.role).toBe("seller")
    expect(roleState.screen).toBe("seller-dashboard")
    expect(canAccessScreen("seller-dashboard", roleState)).toBe(true)
    expect(canAccessScreen("buyer-home", roleState)).toBe(false)
  })

  it("uses one logout transition for buyer and seller state cleanup", () => {
    const buyerLogout = createLogoutTransition()
    const sellerLogout = createLogoutTransition()

    expect(buyerLogout).toEqual(sellerLogout)
    expect(buyerLogout).toEqual({
      currentUser: null,
      selectedRole: null,
      selectedProductId: null,
      cartItems: [],
      screen: "login",
    })
    expect(getAuthStatus(buyerLogout.currentUser)).toBe("unauthenticated")
    expect(isAuthenticated(buyerLogout.currentUser)).toBe(false)
  })
})
