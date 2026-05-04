import { mapApiOrder } from "@/lib/api/order"
import { apiSuccess, conflict, forbidden, notFound, serverError, validationError } from "@/lib/api/response"
import { requireSellerProfile } from "@/lib/api/seller-auth"
import { getZodFieldErrors, updateOrderStatusSchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    const sellerAuth = await requireSellerProfile(request)
    if (!sellerAuth.ok) return sellerAuth.response

    const body = await request.json()
    const validation = updateOrderStatusSchema.safeParse(body)

    if (!validation.success) {
      return validationError(
        getZodFieldErrors(validation.error),
        "Please fix the highlighted fields.",
      )
    }

    const prisma = getPrisma()

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        pickupCode: true,
        items: true,
        buyer: true,
      },
    })

    if (!existingOrder) {
      return notFound("Order was not found.")
    }

    if (existingOrder.sellerId !== sellerAuth.sellerProfile.id) {
      return forbidden("You do not have permission to modify this order.")
    }

    if (existingOrder.status === "completed" || existingOrder.status === "cancelled") {
      return conflict("Order status cannot be changed from completed or cancelled.")
    }

    const newStatus = validation.data.status

    if (existingOrder.status === "ready" && newStatus !== "cancelled") {
      return conflict("Ready orders can only be completed via pickup verification or cancelled.")
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus,
        ...(newStatus === "cancelled" ? { cancelledAt: new Date() } : {}),
      },
      include: {
        pickupCode: true,
        items: true,
        buyer: true,
      },
    })

    return apiSuccess({ order: mapApiOrder(updatedOrder) })
  } catch (error) {
    console.error("Update seller order status failed", error)
    return serverError()
  }
}
