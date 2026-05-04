import { getCurrentSession } from "@/lib/api/auth"
import { forbidden, unauthorized } from "@/lib/api/response"
import { getPrisma } from "@/lib/prisma"

export async function requireSellerProfile(request: Request) {
  const currentSession = await getCurrentSession(request)

  if (!currentSession) {
    return {
      ok: false as const,
      response: unauthorized(),
    }
  }

  if (currentSession.user.role !== "seller") {
    return {
      ok: false as const,
      response: forbidden("Seller access is required."),
    }
  }

  const prisma = getPrisma()
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: {
      userId: currentSession.user.id,
    },
  })

  if (!sellerProfile) {
    return {
      ok: false as const,
      response: forbidden("A seller profile is required."),
    }
  }

  return {
    ok: true as const,
    user: currentSession.user,
    sellerProfile,
  }
}
