import { ProductStatus } from "@/lib/generated/prisma/enums"

import { mapApiProduct } from "@/lib/api/mappers"
import {
  calculateDiscountPercent,
  hasValidDiscount,
  pesosToCents,
  productInclude,
} from "@/lib/api/product-mutations"
import { apiSuccess, forbidden, notFound, serverError, validationError } from "@/lib/api/response"
import { requireSellerProfile } from "@/lib/api/seller-auth"
import {
  getZodFieldErrors,
  idParamSchema,
  parseJsonRequest,
  sellerProductUpdateSchema,
} from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

type SellerProductRouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: Request, context: SellerProductRouteContext) {
  const params = await context.params
  const parsedParams = idParamSchema.safeParse(params)

  if (!parsedParams.success) {
    return validationError(getZodFieldErrors(parsedParams.error))
  }

  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const parsed = await parseJsonRequest(request, sellerProductUpdateSchema)

    if (!parsed.ok) return parsed.response

    const prisma = getPrisma()
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: parsedParams.data.id,
      },
    })

    if (!existingProduct) {
      return notFound("Product was not found.")
    }

    if (existingProduct.sellerId !== sellerAuth.sellerProfile.id) {
      return forbidden("You can only update your own products.")
    }

    if (parsed.data.categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: parsed.data.categoryId,
        },
      })

      if (!category) {
        return validationError({
          categoryId: "Category was not found.",
        })
      }
    }

    const originalPriceCents =
      parsed.data.originalPrice === undefined
        ? existingProduct.originalPriceCents
        : pesosToCents(parsed.data.originalPrice)
    const discountedPriceCents =
      parsed.data.discountedPrice === undefined
        ? existingProduct.discountedPriceCents
        : pesosToCents(parsed.data.discountedPrice)

    if (!hasValidDiscount(originalPriceCents, discountedPriceCents)) {
      return validationError({
        discountedPrice: "Discount must be between 0 and 100%.",
      })
    }

    const product = await prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.brand !== undefined ? { brand: parsed.data.brand } : {}),
        ...(parsed.data.categoryId !== undefined ? { categoryId: parsed.data.categoryId } : {}),
        originalPriceCents,
        discountedPriceCents,
        discountPercent: calculateDiscountPercent(originalPriceCents, discountedPriceCents),
        ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl } : {}),
        ...(parsed.data.quantity !== undefined ? { stockQuantity: parsed.data.quantity } : {}),
        ...(parsed.data.unit !== undefined ? { unit: parsed.data.unit } : {}),
        ...(parsed.data.expiryDate !== undefined
          ? { expiryDate: new Date(parsed.data.expiryDate) }
          : {}),
        ...(parsed.data.pickupAddress !== undefined
          ? { pickupAddress: parsed.data.pickupAddress }
          : {}),
        ...(parsed.data.pickupBarangay !== undefined
          ? { pickupBarangay: parsed.data.pickupBarangay }
          : {}),
        ...(parsed.data.pickupHours !== undefined ? { pickupHours: parsed.data.pickupHours } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.weight !== undefined ? { weight: parsed.data.weight } : {}),
        ...(parsed.data.packSize !== undefined ? { packSize: parsed.data.packSize } : {}),
        ...(parsed.data.isHot !== undefined ? { isHot: parsed.data.isHot } : {}),
        ...(parsed.data.isFeatured !== undefined ? { isFeatured: parsed.data.isFeatured } : {}),
      },
      include: productInclude,
    })

    return apiSuccess({
      product: mapApiProduct(product),
    })
  } catch (error) {
    console.error("Seller product update failed", error)
    return serverError()
  }
}

export async function DELETE(request: Request, context: SellerProductRouteContext) {
  const params = await context.params
  const parsedParams = idParamSchema.safeParse(params)

  if (!parsedParams.success) {
    return validationError(getZodFieldErrors(parsedParams.error))
  }

  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const prisma = getPrisma()
    const existingProduct = await prisma.product.findUnique({
      where: {
        id: parsedParams.data.id,
      },
    })

    if (!existingProduct) {
      return notFound("Product was not found.")
    }

    if (existingProduct.sellerId !== sellerAuth.sellerProfile.id) {
      return forbidden("You can only delete your own products.")
    }

    const product = await prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        status: ProductStatus.removed,
      },
      include: productInclude,
    })

    return apiSuccess({
      product: mapApiProduct(product),
    })
  } catch (error) {
    console.error("Seller product delete failed", error)
    return serverError()
  }
}
