import type { AuthRole, AuthUser, UserRole } from "@/lib/types"

export type Screen =
  | "splash"
  | "login"
  | "register"
  | "role-select"
  | "buyer-home"
  | "buyer-categories"
  | "buyer-product-list"
  | "buyer-product-detail"
  | "buyer-cart"
  | "buyer-checkout"
  | "buyer-pickup-qr"
  | "buyer-orders"
  | "buyer-profile"
  | "seller-dashboard"
  | "seller-add-product"
  | "seller-products"
  | "seller-orders"
  | "seller-reports"
  | "seller-profile"
  | "seller-verify-pickup"

export interface NavigationGuardState {
  currentUser: AuthUser | null
  selectedRole: UserRole
}

export const BUYER_SCREENS = [
  "buyer-home",
  "buyer-categories",
  "buyer-product-list",
  "buyer-product-detail",
  "buyer-cart",
  "buyer-checkout",
  "buyer-pickup-qr",
  "buyer-orders",
  "buyer-profile",
] as const satisfies readonly Screen[]

export const SELLER_SCREENS = [
  "seller-dashboard",
  "seller-add-product",
  "seller-products",
  "seller-orders",
  "seller-reports",
  "seller-profile",
  "seller-verify-pickup",
] as const satisfies readonly Screen[]

export const PUBLIC_SCREENS = [
  "splash",
  "login",
  "register",
] as const satisfies readonly Screen[]

const buyerScreenSet = new Set<Screen>(BUYER_SCREENS)
const sellerScreenSet = new Set<Screen>(SELLER_SCREENS)
const publicScreenSet = new Set<Screen>(PUBLIC_SCREENS)

export function isBuyerScreen(screen: Screen): boolean {
  return buyerScreenSet.has(screen)
}

export function isSellerScreen(screen: Screen): boolean {
  return sellerScreenSet.has(screen)
}

export function isPublicScreen(screen: Screen): boolean {
  return publicScreenSet.has(screen)
}

export function requiredRoleForScreen(screen: Screen): AuthRole | null {
  if (isBuyerScreen(screen)) return "buyer"
  if (isSellerScreen(screen)) return "seller"
  return null
}

export function defaultScreenForRole(role: AuthRole): Screen {
  return role === "buyer" ? "buyer-home" : "seller-dashboard"
}

export function getFallbackScreenForUnauthorizedAccess({
  currentUser,
  selectedRole,
}: NavigationGuardState): Screen {
  if (!currentUser) return "login"
  if (!selectedRole) return "role-select"
  return defaultScreenForRole(selectedRole)
}

export function canAccessBuyerScreen(state: NavigationGuardState): boolean {
  return Boolean(state.currentUser && state.selectedRole === "buyer")
}

export function canAccessSellerScreen(state: NavigationGuardState): boolean {
  return Boolean(state.currentUser && state.selectedRole === "seller")
}

export function canAccessScreen(screen: Screen, state: NavigationGuardState): boolean {
  if (isPublicScreen(screen)) return true
  if (screen === "role-select") return Boolean(state.currentUser)

  const requiredRole = requiredRoleForScreen(screen)
  if (!requiredRole) return true

  return Boolean(state.currentUser && state.selectedRole === requiredRole)
}

export function resolveNavigationTarget(screen: Screen, state: NavigationGuardState): Screen {
  if (canAccessScreen(screen, state)) return screen
  return getFallbackScreenForUnauthorizedAccess(state)
}
