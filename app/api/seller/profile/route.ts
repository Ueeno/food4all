import { mapApiSellerProfile } from "@/lib/api/mappers"
import { apiSuccess, serverError } from "@/lib/api/response"
import { requireSellerProfile } from "@/lib/api/seller-auth"
import { parseJsonRequest, sellerProfileUpdateSchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    return apiSuccess({
      seller: mapApiSellerProfile(sellerAuth.sellerProfile, sellerAuth.user.email),
    })
  } catch (error) {
    console.error("Seller profile read failed", error)
    return serverError()
  }
}

export async function PATCH(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const parsed = await parseJsonRequest(request, sellerProfileUpdateSchema)

    if (!parsed.ok) return parsed.response

    const prisma = getPrisma()
    const seller = await prisma.sellerProfile.update({
      where: {
        id: sellerAuth.sellerProfile.id,
      },
      data: {
        ...(parsed.data.businessName !== undefined
          ? { businessName: parsed.data.businessName }
          : {}),
        ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
        ...(parsed.data.barangay !== undefined ? { barangay: parsed.data.barangay ?? null } : {}),
        ...(parsed.data.contactNumber !== undefined
          ? { contactNumber: parsed.data.contactNumber }
          : {}),
        ...(parsed.data.isOpen !== undefined ? { isOpen: parsed.data.isOpen } : {}),
      },
    })

    return apiSuccess({
      seller: mapApiSellerProfile(seller, sellerAuth.user.email),
    })
  } catch (error) {
    console.error("Seller profile update failed", error)
    return serverError()
  }
}
