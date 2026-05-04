import { apiRequest } from "@/lib/api-client"
import type {
  ApiOrder,
  CreateOrderRequest,
  PickupVerificationResult,
  VerifyPickupRequest,
} from "@/lib/api-contracts"
import type { Order, PickupVerification } from "@/lib/types"

// ─── DTO mapper ────────────────────────────────────────────────

function toOrder(apiOrder: ApiOrder): Order {
  return {
    id: apiOrder.id,
    buyer: apiOrder.buyer,
    product: apiOrder.product,
    quantity: apiOrder.quantity,
    total: apiOrder.total,
    status: apiOrder.status,
    pickupDate: apiOrder.pickupDate,
    pickupTime: apiOrder.pickupTime,
    pickupCode: apiOrder.pickupCode,
  }
}

// ─── API-backed buyer order operations ─────────────────────────

export async function createOrder(input: {
  items: { id: string; name: string; price: number; quantity: number }[]
  pickupDate: string
  pickupTime: string
}): Promise<Order> {
  const result = await apiRequest<{ order: ApiOrder }, CreateOrderRequest>("/api/orders", {
    method: "POST",
    body: {
      pickupDate: input.pickupDate,
      pickupTime: input.pickupTime,
    },
  })

  return toOrder(result.order)
}

export async function getBuyerOrders(): Promise<Order[]> {
  const result = await apiRequest<{ orders: ApiOrder[] }>("/api/orders")

  return result.orders.map(toOrder)
}

export async function getSellerOrders(): Promise<Order[]> {
  const result = await apiRequest<{ orders: ApiOrder[] }>("/api/seller/orders")

  return result.orders.map(toOrder)
}

export async function updateSellerOrderStatus(orderId: string, status: "preparing" | "ready" | "cancelled"): Promise<Order> {
  const result = await apiRequest<{ order: ApiOrder }>(`/api/seller/orders/${encodeURIComponent(orderId)}/status`, {
    method: "PATCH",
    body: { status },
  })

  return toOrder(result.order)
}

export async function verifyPickupCode(code: string): Promise<PickupVerification> {
  const result = await apiRequest<PickupVerificationResult, VerifyPickupRequest>(
    "/api/pickup/verify",
    {
      method: "POST",
      body: {
        code,
      },
    },
  )

  return {
    code: result.code,
    orderId: result.orderId,
    status: result.status,
    message: result.message,
    order: result.order ? toOrder(result.order) : undefined,
  }
}
