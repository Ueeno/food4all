import bcrypt from "bcryptjs"

import { createSession, setSessionCookie } from "@/lib/api/auth"
import { mapApiUser } from "@/lib/api/mappers"
import { apiSuccess, serverError, unauthorized } from "@/lib/api/response"
import { loginSchema, parseJsonRequest } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, loginSchema)

  if (!parsed.ok) return parsed.response

  try {
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })
    const isValidPassword = user
      ? await bcrypt.compare(parsed.data.password, user.passwordHash)
      : false

    if (!user || user.deletedAt || !isValidPassword) {
      return unauthorized("Invalid email or password.")
    }

    const { token, expiresAt } = await createSession(user.id)
    const response = apiSuccess({ user: mapApiUser(user) })

    setSessionCookie(response, token, expiresAt)

    return response
  } catch (error) {
    console.error("Login failed", error)
    return serverError()
  }
}
