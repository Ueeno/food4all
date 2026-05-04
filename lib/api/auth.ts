import { createHash, randomBytes } from "node:crypto"

import { cookies } from "next/headers"
import type { NextResponse } from "next/server"

import { mapApiUser } from "@/lib/api/mappers"
import { getPrisma } from "@/lib/prisma"

export const SESSION_COOKIE_NAME = "food4all_session"

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: string) {
  const prisma = getPrisma()
  const token = createSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

  await prisma.session.create({
    data: {
      userId,
      sessionHash: hashSessionToken(token),
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function getSessionCookieValue(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

function getCookieValueFromRequest(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie")

  if (!cookieHeader) return null

  const cookiesFromHeader = cookieHeader.split(";").map((cookie) => cookie.trim())

  for (const cookie of cookiesFromHeader) {
    const [cookieName, ...valueParts] = cookie.split("=")

    if (cookieName === name) {
      return valueParts.join("=") || null
    }
  }

  return null
}

export async function getSessionCookieValueFromRequest(request?: Request): Promise<string | null> {
  if (request) {
    return getCookieValueFromRequest(request, SESSION_COOKIE_NAME)
  }

  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function revokeSessionToken(token: string): Promise<void> {
  const prisma = getPrisma()

  await prisma.session.updateMany({
    where: {
      sessionHash: hashSessionToken(token),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export async function getCurrentSession(request?: Request) {
  const prisma = getPrisma()
  const token = await getSessionCookieValueFromRequest(request)

  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { sessionHash: hashSessionToken(token) },
    include: { user: true },
  })

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.deletedAt
  ) {
    return null
  }

  return {
    session,
    user: mapApiUser(session.user),
  }
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}
