import { describe, expect, it } from "vitest"
import type { AuthRole, AuthUser } from "@/lib/types"
import {
  BUYER_SCREENS,
  SELLER_SCREENS,
  canAccessBuyerScreen,
  canAccessScreen,
  canAccessSellerScreen,
  getFallbackScreenForUnauthorizedAccess,
  isBuyerScreen,
  isPublicScreen,
  isSellerScreen,
  resolveNavigationTarget,
  type NavigationGuardState,
} from "./navigation-guards"

function mockUser(role: AuthRole | null): AuthUser {
  return {
    id: `mock-${role ?? "unassigned"}`,
    name: "Mock User",
    email: `${role ?? "user"}@food4all.local`,
    role,
  }
}

const unauthenticatedState: NavigationGuardState = {
  currentUser: null,
  selectedRole: null,
}

const pendingRoleState: NavigationGuardState = {
  currentUser: mockUser(null),
  selectedRole: null,
}

const buyerState: NavigationGuardState = {
  currentUser: mockUser("buyer"),
  selectedRole: "buyer",
}

const sellerState: NavigationGuardState = {
  currentUser: mockUser("seller"),
  selectedRole: "seller",
}

describe("navigation guard helpers", () => {
  it("classifies buyer, seller, and public screens", () => {
    expect(BUYER_SCREENS.every(isBuyerScreen)).toBe(true)
    expect(SELLER_SCREENS.every(isSellerScreen)).toBe(true)
    expect(isPublicScreen("login")).toBe(true)
    expect(isPublicScreen("register")).toBe(true)
    expect(isBuyerScreen("seller-dashboard")).toBe(false)
    expect(isSellerScreen("buyer-home")).toBe(false)
  })

  it("blocks unauthenticated users from buyer screens and falls back to login", () => {
    expect(canAccessBuyerScreen(unauthenticatedState)).toBe(false)

    for (const screen of BUYER_SCREENS) {
      expect(canAccessScreen(screen, unauthenticatedState)).toBe(false)
      expect(resolveNavigationTarget(screen, unauthenticatedState)).toBe("login")
    }
  })

  it("blocks unauthenticated users from seller screens and falls back to login", () => {
    expect(canAccessSellerScreen(unauthenticatedState)).toBe(false)

    for (const screen of SELLER_SCREENS) {
      expect(canAccessScreen(screen, unauthenticatedState)).toBe(false)
      expect(resolveNavigationTarget(screen, unauthenticatedState)).toBe("login")
    }
  })

  it("allows public screens while requiring auth before role selection", () => {
    expect(canAccessScreen("splash", unauthenticatedState)).toBe(true)
    expect(canAccessScreen("login", unauthenticatedState)).toBe(true)
    expect(canAccessScreen("register", unauthenticatedState)).toBe(true)
    expect(canAccessScreen("role-select", unauthenticatedState)).toBe(false)
    expect(resolveNavigationTarget("role-select", unauthenticatedState)).toBe("login")

    expect(canAccessScreen("role-select", pendingRoleState)).toBe(true)
    expect(resolveNavigationTarget("buyer-home", pendingRoleState)).toBe("role-select")
    expect(getFallbackScreenForUnauthorizedAccess(pendingRoleState)).toBe("role-select")
  })

  it("allows buyers into buyer screens and blocks seller screens", () => {
    expect(canAccessBuyerScreen(buyerState)).toBe(true)
    expect(canAccessSellerScreen(buyerState)).toBe(false)

    for (const screen of BUYER_SCREENS) {
      expect(canAccessScreen(screen, buyerState)).toBe(true)
      expect(resolveNavigationTarget(screen, buyerState)).toBe(screen)
    }

    for (const screen of SELLER_SCREENS) {
      expect(canAccessScreen(screen, buyerState)).toBe(false)
      expect(resolveNavigationTarget(screen, buyerState)).toBe("buyer-home")
    }
  })

  it("allows sellers into seller screens and blocks buyer screens", () => {
    expect(canAccessSellerScreen(sellerState)).toBe(true)
    expect(canAccessBuyerScreen(sellerState)).toBe(false)

    for (const screen of SELLER_SCREENS) {
      expect(canAccessScreen(screen, sellerState)).toBe(true)
      expect(resolveNavigationTarget(screen, sellerState)).toBe(screen)
    }

    for (const screen of BUYER_SCREENS) {
      expect(canAccessScreen(screen, sellerState)).toBe(false)
      expect(resolveNavigationTarget(screen, sellerState)).toBe("seller-dashboard")
    }
  })
})
