import { mapApiCart } from "@/lib/api/mappers"
import { apiSuccess, serverError } from "@/lib/api/response"
import { getCartItemsForUser, requireBuyer } from "@/lib/api/cart"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const buyerAuth = await requireBuyer(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const cartItems = await getCartItemsForUser(buyerAuth.user.id)

    return apiSuccess(mapApiCart(cartItems))
  } catch (error) {
    console.error("Cart read failed", error)
    return serverError()
  }
}

export async function DELETE(request: Request) {
  try {
    const buyerAuth = await requireBuyer(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const prisma = getPrisma()

    await prisma.cartItem.deleteMany({
      where: {
        userId: buyerAuth.user.id,
      },
    })

    return apiSuccess(mapApiCart([]))
  } catch (error) {
    console.error("Cart clear failed", error)
    return serverError()
  }
}
