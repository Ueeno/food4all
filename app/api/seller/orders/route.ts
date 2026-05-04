import { getOrdersForSeller, mapApiOrder } from "@/lib/api/order"
import { apiSuccess, serverError } from "@/lib/api/response"
import { requireSellerProfile } from "@/lib/api/seller-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const orders = await getOrdersForSeller(sellerAuth.sellerProfile.id)

    return apiSuccess({
      orders: orders.map((order) => mapApiOrder(order)),
    })
  } catch (error) {
    console.error("Seller order list failed", error)
    return serverError()
  }
}
