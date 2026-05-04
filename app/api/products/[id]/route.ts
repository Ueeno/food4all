import { ProductStatus } from "@/lib/generated/prisma/enums"

import { mapApiProduct } from "@/lib/api/mappers"
import { apiSuccess, notFound, serverError, validationError } from "@/lib/api/response"
import { getZodFieldErrors, idParamSchema } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

type ProductRouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, context: ProductRouteContext) {
  const params = await context.params
  const parsed = idParamSchema.safeParse(params)

  if (!parsed.success) {
    return validationError(getZodFieldErrors(parsed.error))
  }

  try {
    const prisma = getPrisma()
    const now = new Date()
    const product = await prisma.product.findFirst({
      where: {
        id: parsed.data.id,
        status: ProductStatus.active,
        stockQuantity: { gt: 0 },
        expiryDate: { gte: now },
      },
      include: {
        category: true,
        seller: true,
      },
    })

    if (!product) {
      return notFound("Product was not found.")
    }

    return apiSuccess({
      product: mapApiProduct(product, now),
    })
  } catch (error) {
    console.error("Product lookup failed", error)
    return serverError()
  }
}
