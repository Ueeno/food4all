import { SELLER_ORDERS } from "@/lib/mock-data"
import type { CreateOrderInput, Order, PickupVerification } from "@/lib/types"

let mockBuyerOrders: Order[] = []

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

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const total = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const productLabel =
    input.items.length === 1
      ? input.items[0]?.name ?? "FOOD4ALL Reservation"
      : `${input.items.length} reserved products`

  const order: Order = {
    id: `ORD-MOCK-${Date.now()}`,
    buyer: "FOOD4ALL Buyer",
    product: productLabel,
    quantity: input.items.reduce((sum, item) => sum + item.quantity, 0),
    total,
    status: "reserved",
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
    pickupCode: "F4A-MOCK",
  }

  mockBuyerOrders = [order, ...mockBuyerOrders]
  return cloneOrder(order)
}

export async function getBuyerOrders(): Promise<Order[]> {
  return mockBuyerOrders.map(cloneOrder)
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
