import { createHash, randomBytes } from "node:crypto"

import type { ApiOrder, ApiOrderItem } from "@/lib/api-contracts"
import { getCurrentSession } from "@/lib/api/auth"
import { centsToPesos } from "@/lib/api/mappers"
import { forbidden, unauthorized } from "@/lib/api/response"
import { getPrisma } from "@/lib/prisma"

// ─── Auth ──────────────────────────────────────────────────────

export async function requireBuyerForOrder(request: Request) {
  const currentSession = await getCurrentSession(request)

  if (!currentSession) {
    return {
      ok: false as const,
      response: unauthorized(),
    }
  }

  if (currentSession.user.role !== "buyer") {
    return {
      ok: false as const,
      response: forbidden("Buyer access is required."),
    }
  }

  return {
    ok: true as const,
    user: currentSession.user,
  }
}

// ─── Pickup code helpers ───────────────────────────────────────

export function generatePickupCode(): string {
  const bytes = randomBytes(4)
  const alphanumeric = bytes
    .toString("base64url")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 4)

  return `F4A-${alphanumeric}`
}

export function normalizePickupCode(code: string): string {
  return code.trim().toUpperCase()
}

export function hashPickupCode(code: string): string {
  return createHash("sha256").update(normalizePickupCode(code)).digest("hex")
}

// ─── Prisma includes ───────────────────────────────────────────

export const orderInclude = {
  items: {
    include: {
      product: true,
    },
  },
  buyer: true,
  seller: true,
  pickupCode: true,
} as const

// ─── DTO mappers ───────────────────────────────────────────────

type DbOrderItem = {
  id: string
  orderId: string
  productId: string | null
  productName: string
  quantity: number
  unitPriceCents: number
  originalUnitPriceCents: number
  subtotalCents: number
}

type DbOrder = {
  id: string
  buyerId: string
  sellerId: string
  status: string
  totalCents: number
  pickupDate: Date
  pickupTime: string
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  cancelledAt: Date | null
  items: DbOrderItem[]
  buyer: {
    name: string
  }
  pickupCode: {
    displayCodeLast4: string | null
  } | null
}

export function mapApiOrderItem(item: DbOrderItem): ApiOrderItem {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId ?? "",
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: centsToPesos(item.unitPriceCents),
    originalUnitPrice: centsToPesos(item.originalUnitPriceCents),
    subtotal: centsToPesos(item.subtotalCents),
  }
}

export function mapApiOrder(order: DbOrder, pickupCodePlaintext?: string): ApiOrder {
  const totalPesos = centsToPesos(order.totalCents)
  const items = order.items.map(mapApiOrderItem)
  const productLabel =
    items.length === 1
      ? items[0]?.productName ?? "FOOD4ALL Reservation"
      : `${items.length} reserved products`

  return {
    id: order.id,
    buyer: order.buyer.name,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    product: productLabel,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    total: totalPesos,
    status: order.status as ApiOrder["status"],
    pickupDate: order.pickupDate.toISOString(),
    pickupTime: order.pickupTime,
    pickupCode: pickupCodePlaintext ?? (order.pickupCode?.displayCodeLast4 ? `****${order.pickupCode.displayCodeLast4}` : ""),
    items,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    completedAt: order.completedAt?.toISOString(),
    cancelledAt: order.cancelledAt?.toISOString(),
  }
}

// ─── Queries ───────────────────────────────────────────────────

export async function getOrdersForBuyer(buyerId: string) {
  const prisma = getPrisma()

  return prisma.order.findMany({
    where: {
      buyerId,
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getOrdersForSeller(sellerId: string) {
  const prisma = getPrisma()

  return prisma.order.findMany({
    where: {
      sellerId,
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc",
    },
  })
}
