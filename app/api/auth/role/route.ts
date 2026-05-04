import { getCurrentSession } from "@/lib/api/auth"
import { mapApiUser } from "@/lib/api/mappers"
import { apiSuccess, serverError, unauthorized, validationError } from "@/lib/api/response"
import { getZodFieldErrors, setRoleSchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  try {
    const currentSession = await getCurrentSession(request)

    if (!currentSession) {
      return unauthorized()
    }

    const body = await request.json()
    const validation = setRoleSchema.safeParse(body)

    if (!validation.success) {
      return validationError(getZodFieldErrors(validation.error))
    }

    const { role } = validation.data
    const prisma = getPrisma()
    const userId = currentSession.session.userId

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    // If role is seller, ensure seller profile exists
    if (role === "seller") {
      const existingProfile = await prisma.sellerProfile.findUnique({
        where: { userId },
      })

      if (!existingProfile) {
        await prisma.sellerProfile.create({
          data: {
            userId,
            businessName: updatedUser.name,
            address: "",
            contactNumber: "",
            isOpen: false,
          },
        })
      }
    }

    return apiSuccess({
      user: mapApiUser(updatedUser),
    })
  } catch (error) {
    console.error("Set user role failed", error)
    return serverError()
  }
}
