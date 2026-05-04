import { mapApiCart } from "@/lib/api/mappers"
import { apiSuccess, serverError, validationError } from "@/lib/api/response"
import {
  getCartItemsForUser,
  getCartProduct,
  quantityExceedsStock,
  requireBuyer,
} from "@/lib/api/cart"
import { addCartItemSchema, parseJsonRequest } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const buyerAuth = await requireBuyer(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const parsed = await parseJsonRequest(request, addCartItemSchema)

    if (!parsed.ok) return parsed.response

    const productResult = await getCartProduct(parsed.data.productId)

    if (!productResult.ok) return productResult.response

    const prisma = getPrisma()
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: buyerAuth.user.id,
          productId: parsed.data.productId,
        },
      },
    })
    const nextQuantity = (existingItem?.quantity ?? 0) + parsed.data.quantity

    if (quantityExceedsStock(nextQuantity, productResult.product.stockQuantity)) {
      return validationError({
        quantity: "Quantity exceeds available stock.",
      })
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: nextQuantity,
        },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          userId: buyerAuth.user.id,
          productId: parsed.data.productId,
          quantity: parsed.data.quantity,
        },
      })
    }

    const cartItems = await getCartItemsForUser(buyerAuth.user.id)

    return apiSuccess(mapApiCart(cartItems), { status: 201 })
  } catch (error) {
    console.error("Cart add failed", error)
    return serverError()
  }
}
