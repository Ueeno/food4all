import bcrypt from "bcryptjs"

import { createSession, setSessionCookie } from "@/lib/api/auth"
import { mapApiUser } from "@/lib/api/mappers"
import { apiSuccess, conflict, serverError } from "@/lib/api/response"
import { parseJsonRequest, registerSchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, registerSchema)

  if (!parsed.ok) return parsed.response

  try {
    const prisma = getPrisma()
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (existingUser) {
      return conflict("An account already exists for this email.")
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
        phone: parsed.data.phone,
        role: parsed.data.role ?? null,
      },
    })
    const { token, expiresAt } = await createSession(user.id)
    const response = apiSuccess({ user: mapApiUser(user) }, { status: 201 })

    setSessionCookie(response, token, expiresAt)

    return response
  } catch (error) {
    console.error("Registration failed", error)
    return serverError()
  }
}
