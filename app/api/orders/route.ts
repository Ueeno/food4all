import { ProductStatus } from "@/lib/generated/prisma/enums"

import {
  generatePickupCode,
  getOrdersForBuyer,
  hashPickupCode,
  mapApiOrder,
  orderInclude,
  requireBuyerForOrder,
} from "@/lib/api/order"
import { apiSuccess, conflict, serverError } from "@/lib/api/response"
import { createOrderSchema, parseJsonRequest } from "@/lib/api/validation"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

// ─── GET /api/orders — list current buyer orders ───────────────

export async function GET(request: Request) {
  try {
    const buyerAuth = await requireBuyerForOrder(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const orders = await getOrdersForBuyer(buyerAuth.user.id)

    return apiSuccess({
      orders: orders.map((order) => mapApiOrder(order)),
    })
  } catch (error) {
    console.error("Order list failed", error)
    return serverError()
  }
}

// ─── POST /api/orders — create order from current cart ─────────

export async function POST(request: Request) {
  try {
    const buyerAuth = await requireBuyerForOrder(request)

    if (!buyerAuth.ok) return buyerAuth.response

    const parsed = await parseJsonRequest(request, createOrderSchema)

    if (!parsed.ok) return parsed.response

    const { pickupDate, pickupTime } = parsed.data
    const prisma = getPrisma()

    // Load cart items with product details
    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId: buyerAuth.user.id,
        product: {
          status: {
            not: ProductStatus.removed,
          },
        },
      },
      include: {
        product: {
          include: {
            seller: true,
          },
        },
      },
    })

    if (cartItems.length === 0) {
      return conflict("Your cart is empty.")
    }

    // Validate stock for all items
    for (const item of cartItems) {
      if (item.product.status !== ProductStatus.active) {
        return conflict(`${item.product.name} is no longer available.`)
      }

      if (item.quantity > item.product.stockQuantity) {
        return conflict(
          `${item.product.name} has only ${item.product.stockQuantity} left in stock.`,
        )
      }
    }

    // Group cart items by seller to create one order per seller
    const itemsBySeller = new Map<string, typeof cartItems>()

    for (const item of cartItems) {
      const sellerId = item.product.sellerId
      const existing = itemsBySeller.get(sellerId) ?? []

      existing.push(item)
      itemsBySeller.set(sellerId, existing)
    }

    // For now, support single-seller checkout only (per contract recommendation)
    // If multiple sellers, create one order per seller
    const pickupCode = generatePickupCode()
    const pickupCodeHash = hashPickupCode(pickupCode)
    const pickupCodeLast4 = pickupCode.slice(-4)

    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = []

      for (const [sellerId, items] of itemsBySeller) {
        const totalCents = items.reduce(
          (sum, item) => sum + item.product.discountedPriceCents * item.quantity,
          0,
        )

        // Create order
        const order = await tx.order.create({
          data: {
            buyerId: buyerAuth.user.id,
            sellerId,
            status: "reserved",
            totalCents,
            pickupDate: new Date(pickupDate),
            pickupTime,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
                unitPriceCents: item.product.discountedPriceCents,
                originalUnitPriceCents: item.product.originalPriceCents,
                subtotalCents: item.product.discountedPriceCents * item.quantity,
              })),
            },
            pickupCode: {
              create: {
                codeHash: pickupCodeHash,
                displayCodeLast4: pickupCodeLast4,
              },
            },
          },
          include: orderInclude,
        })

        // Decrement stock for each item
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          })
        }

        orders.push(order)
      }

      // Clear buyer cart
      await tx.cartItem.deleteMany({
        where: {
          userId: buyerAuth.user.id,
        },
      })

      return orders
    })

    // Return the first (or only) order with the pickup code plaintext
    const primaryOrder = createdOrders[0]!

    return apiSuccess(
      { order: mapApiOrder(primaryOrder, pickupCode) },
      { status: 201 },
    )
  } catch (error) {
    console.error("Order creation failed", error)
    return serverError()
  }
}
