import { getCurrentSession } from "@/lib/api/auth"
import { apiSuccess, serverError } from "@/lib/api/response"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const currentSession = await getCurrentSession(request)

    return apiSuccess({
      user: currentSession?.user ?? null,
    })
  } catch (error) {
    console.error("Current user lookup failed", error)
    return serverError()
  }
}
