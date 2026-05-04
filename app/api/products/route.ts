import { ProductStatus } from "@/lib/generated/prisma/enums"

import { mapApiProduct } from "@/lib/api/mappers"
import { apiSuccess, serverError, validationError } from "@/lib/api/response"
import { getZodFieldErrors, productListQuerySchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = productListQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))

  if (!parsed.success) {
    return validationError(getZodFieldErrors(parsed.error))
  }

  try {
    const prisma = getPrisma()
    const query = parsed.data
    const now = new Date()
    const expiryLimit = query.maxDaysUntilExpiry
      ? new Date(now.getTime() + query.maxDaysUntilExpiry * 24 * 60 * 60 * 1000)
      : undefined
    const where = {
      status: ProductStatus.active,
      stockQuantity: { gt: 0 },
      expiryDate: expiryLimit ? { gte: now, lte: expiryLimit } : { gte: now },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(typeof query.featured === "boolean" ? { isFeatured: query.featured } : {}),
      ...(typeof query.hot === "boolean" ? { isHot: query.hot } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { brand: { contains: query.search } },
              { pickupBarangay: { contains: query.search } },
              { category: { label: { contains: query.search } } },
              { seller: { businessName: { contains: query.search } } },
            ],
          }
        : {}),
    }
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: true,
        },
        orderBy: [{ isFeatured: "desc" }, { expiryDate: "asc" }, { name: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ])

    return apiSuccess({
      products: products.map((product) => mapApiProduct(product, now)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
      },
    })
  } catch (error) {
    console.error("Product list failed", error)
    return serverError()
  }
}
