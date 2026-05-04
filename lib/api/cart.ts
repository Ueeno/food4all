import { ProductStatus } from "@/lib/generated/prisma/enums"

import { getCurrentSession } from "@/lib/api/auth"
import { forbidden, notFound, unauthorized, validationError } from "@/lib/api/response"
import { getPrisma } from "@/lib/prisma"

export const cartItemInclude = {
  product: {
    include: {
      category: true,
      seller: true,
    },
  },
} as const

export async function requireBuyer(request: Request) {
  const currentSession = await getCurrentSession(request)

  if (!currentSession) {
    return {
      ok: false as const,
      response: unauthorized(),
    }
  }

  if (currentSession.user.role !== "buyer") {
    return {
      ok: false as const,
      response: forbidden("Buyer access is required."),
    }
  }

  return {
    ok: true as const,
    user: currentSession.user,
  }
}

export async function getCartItemsForUser(userId: string) {
  const prisma = getPrisma()

  return prisma.cartItem.findMany({
    where: {
      userId,
      product: {
        status: {
          not: ProductStatus.removed,
        },
      },
    },
    include: cartItemInclude,
    orderBy: {
      updatedAt: "desc",
    },
  })
}

export async function getCartProduct(productId: string) {
  const prisma = getPrisma()
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  })

  if (!product || product.status === ProductStatus.removed) {
    return {
      ok: false as const,
      response: notFound("Product was not found."),
    }
  }

  if (product.status !== ProductStatus.active || product.stockQuantity <= 0) {
    return {
      ok: false as const,
      response: validationError({
        productId: "Product is not available.",
      }),
    }
  }

  return {
    ok: true as const,
    product,
  }
}

export function quantityExceedsStock(quantity: number, stockQuantity: number) {
  return quantity > stockQuantity
}
