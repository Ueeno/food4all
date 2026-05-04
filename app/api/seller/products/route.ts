import { ProductStatus } from "@/lib/generated/prisma/enums"

import { mapApiProduct } from "@/lib/api/mappers"
import {
  calculateDiscountPercent,
  hasValidDiscount,
  pesosToCents,
  productInclude,
} from "@/lib/api/product-mutations"
import { apiSuccess, serverError, validationError } from "@/lib/api/response"
import { requireSellerProfile } from "@/lib/api/seller-auth"
import { parseJsonRequest, sellerProductCreateSchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const prisma = getPrisma()
    const products = await prisma.product.findMany({
      where: {
        sellerId: sellerAuth.sellerProfile.id,
        status: {
          not: ProductStatus.removed,
        },
      },
      include: productInclude,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          name: "asc",
        },
      ],
    })

    return apiSuccess({
      products: products.map((product) => mapApiProduct(product)),
    })
  } catch (error) {
    console.error("Seller product list failed", error)
    return serverError()
  }
}

export async function POST(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const parsed = await parseJsonRequest(request, sellerProductCreateSchema)

    if (!parsed.ok) return parsed.response

    const prisma = getPrisma()
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

    const originalPriceCents = pesosToCents(parsed.data.originalPrice)
    const discountedPriceCents = pesosToCents(parsed.data.discountedPrice)

    if (!hasValidDiscount(originalPriceCents, discountedPriceCents)) {
      return validationError({
        discountedPrice: "Discount must be between 0 and 100%.",
      })
    }

    const product = await prisma.product.create({
      data: {
        sellerId: sellerAuth.sellerProfile.id,
        categoryId: category.id,
        name: parsed.data.name,
        brand: parsed.data.brand,
        originalPriceCents,
        discountedPriceCents,
        discountPercent: calculateDiscountPercent(originalPriceCents, discountedPriceCents),
        imageUrl: parsed.data.imageUrl,
        stockQuantity: parsed.data.quantity,
        unit: parsed.data.unit,
        expiryDate: new Date(parsed.data.expiryDate),
        pickupAddress: parsed.data.pickupAddress,
        pickupBarangay: parsed.data.pickupBarangay,
        pickupHours: parsed.data.pickupHours,
        description: parsed.data.description,
        weight: parsed.data.weight,
        packSize: parsed.data.packSize,
        isHot: parsed.data.isHot ?? false,
        isFeatured: parsed.data.isFeatured ?? false,
        status: ProductStatus.active,
      },
      include: productInclude,
    })

    return apiSuccess(
      {
        product: mapApiProduct(product),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Seller product create failed", error)
    return serverError()
  }
}
