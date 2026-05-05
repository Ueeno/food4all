import {
  getOrderForBuyer,
  mapApiOrder,
  requireBuyerForOrder,
} from "@/lib/api/order"
import { apiSuccess, notFound, serverError, validationError } from "@/lib/api/response"
import { getZodFieldErrors, idParamSchema } from "@/lib/api/validation"

export const runtime = "nodejs"

type BuyerOrderDetailRouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: Request, context: BuyerOrderDetailRouteContext) {
  const params = await context.params
  const parsedParams = idParamSchema.safeParse(params)

  if (!parsedParams.success) {
    return validationError(getZodFieldErrors(parsedParams.error))
  }

  try {
    const buyerAuth = await requireBuyerForOrder(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const order = await getOrderForBuyer(parsedParams.data.id, buyerAuth.user.id)

    if (!order) {
      return notFound("Order was not found.")
    }

    return apiSuccess({
      order: mapApiOrder(order),
    })
  } catch (error) {
    console.error("Order detail lookup failed", error)
    return serverError()
  }
}
