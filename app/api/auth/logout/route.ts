import { clearSessionCookie, getSessionCookieValueFromRequest, revokeSessionToken } from "@/lib/api/auth"
import { apiSuccess, serverError } from "@/lib/api/response"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const token = await getSessionCookieValueFromRequest(request)

    if (token) {
      await revokeSessionToken(token)
    }

    const response = apiSuccess({ loggedOut: true as const })
    clearSessionCookie(response)

    return response
  } catch (error) {
    console.error("Logout failed", error)
    return serverError()
  }
}
