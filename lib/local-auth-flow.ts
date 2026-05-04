import { defaultScreenForRole, type Screen } from "@/lib/navigation-guards"
import type {
  AuthRole,
  AuthStatus,
  AuthUser,
  CartItem,
  LoginInput,
  RegisterInput,
  UserRole,
} from "@/lib/types"

export interface AuthTransition {
  currentUser: AuthUser | null
  selectedRole: UserRole
  selectedProductId: string | null
  screen: Screen
}

export interface LogoutTransition extends AuthTransition {
  cartItems: CartItem[]
}

export interface RoleSelectionTransition {
  currentUser: AuthUser | null
  selectedRole: AuthRole
  screen: Screen
}

export function buildMockUser(email: string, name: string, role: UserRole = null): AuthUser {
  const normalizedEmail = email.trim().toLowerCase()
  const idSeed = normalizedEmail.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  return {
    id: `mock-${idSeed || "user"}`,
    name: name.trim() || normalizedEmail.split("@")[0] || "FOOD4ALL User",
    email: normalizedEmail,
    role,
  }
}

export function getAuthStatus(currentUser: AuthUser | null): AuthStatus {
  return currentUser ? "authenticated" : "unauthenticated"
}

export function isAuthenticated(currentUser: AuthUser | null): boolean {
  return Boolean(currentUser)
}

export function createLoginTransition({ email }: LoginInput): AuthTransition {
  return {
    currentUser: buildMockUser(email, "FOOD4ALL User"),
    selectedRole: null,
    selectedProductId: null,
    screen: "role-select",
  }
}

export function createRegisterTransition(payload: RegisterInput): AuthTransition {
  const name = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim()

  return {
    currentUser: buildMockUser(payload.email, name),
    selectedRole: null,
    selectedProductId: null,
    screen: "role-select",
  }
}

export function createRoleSelectionTransition(
  currentUser: AuthUser | null,
  role: AuthRole,
): RoleSelectionTransition {
  return {
    currentUser: currentUser ? { ...currentUser, role } : currentUser,
    selectedRole: role,
    screen: defaultScreenForRole(role),
  }
}

export function createLogoutTransition(): LogoutTransition {
  return {
    currentUser: null,
    selectedRole: null,
    selectedProductId: null,
    cartItems: [],
    screen: "login",
  }
}
