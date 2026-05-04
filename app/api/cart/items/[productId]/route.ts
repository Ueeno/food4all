import { mapApiCart } from "@/lib/api/mappers"
import { apiSuccess, notFound, serverError, validationError } from "@/lib/api/response"
import {
  getCartItemsForUser,
  getCartProduct,
  quantityExceedsStock,
  requireBuyer,
} from "@/lib/api/cart"
import {
  getZodFieldErrors,
  parseJsonRequest,
  productIdParamSchema,
  updateCartItemSchema,
} from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

type CartItemRouteContext = {
  params: Promise<{
    productId: string
  }>
}

export async function PATCH(request: Request, context: CartItemRouteContext) {
  const params = await context.params
  const parsedParams = productIdParamSchema.safeParse(params)

  if (!parsedParams.success) {
    return validationError(getZodFieldErrors(parsedParams.error))
  }

  try {
    const buyerAuth = await requireBuyer(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const parsed = await parseJsonRequest(request, updateCartItemSchema)

    if (!parsed.ok) return parsed.response

    const prisma = getPrisma()
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: buyerAuth.user.id,
          productId: parsedParams.data.productId,
        },
      },
    })

    if (!existingItem) {
      return notFound("Cart item was not found.")
    }

    if (parsed.data.quantity === 0) {
      await prisma.cartItem.delete({
        where: {
          id: existingItem.id,
        },
      })
    } else {
      const productResult = await getCartProduct(parsedParams.data.productId)

      if (!productResult.ok) return productResult.response

      if (quantityExceedsStock(parsed.data.quantity, productResult.product.stockQuantity)) {
        return validationError({
          quantity: "Quantity exceeds available stock.",
        })
      }

      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: parsed.data.quantity,
        },
      })
    }

    const cartItems = await getCartItemsForUser(buyerAuth.user.id)

    return apiSuccess(mapApiCart(cartItems))
  } catch (error) {
    console.error("Cart update failed", error)
    return serverError()
  }
}

export async function DELETE(request: Request, context: CartItemRouteContext) {
  const params = await context.params
  const parsedParams = productIdParamSchema.safeParse(params)

  if (!parsedParams.success) {
    return validationError(getZodFieldErrors(parsedParams.error))
  }

  try {
    const buyerAuth = await requireBuyer(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const prisma = getPrisma()

    await prisma.cartItem.deleteMany({
      where: {
        userId: buyerAuth.user.id,
        productId: parsedParams.data.productId,
      },
    })

    const cartItems = await getCartItemsForUser(buyerAuth.user.id)

    return apiSuccess(mapApiCart(cartItems))
  } catch (error) {
    console.error("Cart item delete failed", error)
    return serverError()
  }
}
