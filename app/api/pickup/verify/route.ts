import { OrderStatus } from "@/lib/generated/prisma/enums"

import {
  hashPickupCode,
  mapApiOrder,
  orderInclude,
} from "@/lib/api/order"
import { requireSellerProfile } from "@/lib/api/seller-auth"
import { apiSuccess, conflict, forbidden, notFound, serverError } from "@/lib/api/response"
import { parseJsonRequest, verifyPickupSchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const parsed = await parseJsonRequest(request, verifyPickupSchema)

    if (!parsed.ok) return parsed.response

    const code = parsed.data.code
    const prisma = getPrisma()
    const pickupCode = await prisma.pickupCode.findFirst({
      where: {
        codeHash: hashPickupCode(code),
      },
      include: {
        order: {
          include: orderInclude,
        },
      },
    })

    if (!pickupCode) {
      return notFound("Pickup code was not found.")
    }

    if (pickupCode.order.sellerId !== sellerAuth.sellerProfile.id) {
      return forbidden("Pickup code does not belong to this seller.")
    }

    if (pickupCode.verifiedAt || pickupCode.order.status === OrderStatus.completed) {
      return conflict("Pickup has already been verified.")
    }

    if (pickupCode.order.status === OrderStatus.cancelled) {
      return conflict("Cancelled orders cannot be verified.")
    }

    if (pickupCode.order.status !== OrderStatus.ready) {
      return conflict("Order is not ready for pickup.")
    }

    const verifiedAt = new Date()
    const order = await prisma.$transaction(async (tx) => {
      await tx.pickupCode.update({
        where: {
          id: pickupCode.id,
        },
        data: {
          verifiedAt,
          verifiedBySellerUserId: sellerAuth.user.id,
        },
      })

      return tx.order.update({
        where: {
          id: pickupCode.orderId,
        },
        data: {
          status: OrderStatus.completed,
          completedAt: verifiedAt,
        },
        include: orderInclude,
      })
    })

    return apiSuccess({
      code,
      orderId: order.id,
      status: "valid" as const,
      message: "Pickup verified successfully.",
      order: mapApiOrder(order, code),
    })
  } catch (error) {
    console.error("Pickup verification failed", error)
    return serverError()
  }
}
