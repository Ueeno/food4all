import type { AuthRole, LoginInput, RegisterInput, User } from "@/lib/types"

let mockCurrentUser: User | null = null

function buildMockUser(email: string, name: string, role: AuthRole | null = null): User {
  const normalizedEmail = email.trim().toLowerCase()
  const idSeed = normalizedEmail.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  return {
    id: `mock-${idSeed || "user"}`,
    name: name.trim() || normalizedEmail.split("@")[0] || "FOOD4ALL User",
    email: normalizedEmail,
    role,
  }
}

function cloneUser(user: User | null): User | null {
  return user ? { ...user } : null
}

export async function login(input: LoginInput): Promise<User> {
  mockCurrentUser = buildMockUser(input.email, "FOOD4ALL User")
  return { ...mockCurrentUser }
}

export async function register(input: RegisterInput): Promise<User> {
  const name = `${input.firstName} ${input.lastName}`.trim()

  mockCurrentUser = buildMockUser(input.email, name)
  return { ...mockCurrentUser }
}

export async function logout(): Promise<void> {
  mockCurrentUser = null
}

export async function getCurrentUser(): Promise<User | null> {
  return cloneUser(mockCurrentUser)
}

export async function setCurrentUserRole(role: AuthRole): Promise<User | null> {
  mockCurrentUser = mockCurrentUser ? { ...mockCurrentUser, role } : null
  return cloneUser(mockCurrentUser)
}
