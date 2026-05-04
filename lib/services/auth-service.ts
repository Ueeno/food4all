import { apiRequest } from "@/lib/api-client"
import type { ApiUser, LoginRequest, RegisterRequest } from "@/lib/api-contracts"
import type { AuthRole, LoginInput, RegisterInput, User } from "@/lib/types"

function toUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export async function login(input: LoginInput): Promise<User> {
  const { user } = await apiRequest<{ user: ApiUser }, LoginRequest>("/api/auth/login", {
    method: "POST",
    body: input,
  })

  return toUser(user)
}

export async function register(input: RegisterInput): Promise<User> {
  const { user } = await apiRequest<{ user: ApiUser }, RegisterRequest>("/api/auth/register", {
    method: "POST",
    body: input,
  })

  return toUser(user)
}

export async function logout(): Promise<void> {
  await apiRequest<{ loggedOut: true }>("/api/auth/logout", {
    method: "POST",
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const { user } = await apiRequest<{ user: ApiUser | null }>("/api/auth/me")

  return user ? toUser(user) : null
}

export async function setCurrentUserRole(role: AuthRole): Promise<User | null> {
  const currentUser = await getCurrentUser()

  return currentUser ? { ...currentUser, role } : null
}
