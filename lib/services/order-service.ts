import { apiRequest } from "@/lib/api-client"
import type { ApiOrder, CreateOrderRequest } from "@/lib/api-contracts"
import { SELLER_ORDERS } from "@/lib/mock-data"
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

// ─── Mock seller operations (not migrated yet) ─────────────────

const MOCK_EXTRA_SELLER_ORDERS: Order[] = [
  {
    id: "ORD-2851",
    buyer: "Rosa Gonzales",
    product: "Hacienda Bacon Strips",
    quantity: 4,
    total: 880,
    status: "completed",
    pickupDate: "Apr 28, 2026",
    pickupTime: "3:00 PM",
    pickupCode: "F4A-8T33",
  },
  {
    id: "ORD-2852",
    buyer: "Lito Reyes",
    product: "Purefoods Honeycured Ham",
    quantity: 2,
    total: 480,
    status: "preparing",
    pickupDate: "May 1, 2026",
    pickupTime: "12:00 PM",
    pickupCode: "F4A-2Q71",
  },
]

function cloneOrder(order: Order): Order {
  return { ...order }
}

export async function getSellerOrders(): Promise<Order[]> {
  return [...SELLER_ORDERS, ...MOCK_EXTRA_SELLER_ORDERS].map(cloneOrder)
}

export async function verifyPickupCode(code: string): Promise<PickupVerification> {
  const normalizedCode = code.trim().toUpperCase()
  const order = [...SELLER_ORDERS, ...MOCK_EXTRA_SELLER_ORDERS].find(
    (item) => item.pickupCode.toUpperCase() === normalizedCode,
  )

  if (!order) {
    return {
      code: normalizedCode,
      status: "invalid",
      message: "Pickup code was not found in mock orders.",
    }
  }

  return {
    code: normalizedCode,
    orderId: order.id,
    status: "valid",
    message: "Pickup code matches a mock order.",
  }
}
