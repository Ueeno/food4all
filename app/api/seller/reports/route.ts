import { ProductStatus } from "@/lib/generated/prisma/enums"

import { centsToPesos, mapApiProduct } from "@/lib/api/mappers"
import { apiSuccess, serverError } from "@/lib/api/response"
import { requireSellerProfile } from "@/lib/api/seller-auth"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

const DAY_MS = 24 * 60 * 60 * 1000

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function reportDayKey(date: Date) {
  return startOfUtcDay(date).toISOString().slice(0, 10)
}

function reportDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date)
}

export async function GET(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) return sellerAuth.response

    const prisma = getPrisma()
    const sellerId = sellerAuth.sellerProfile.id
    const now = new Date()
    const weekStart = new Date(startOfUtcDay(now).getTime() - 6 * DAY_MS)

    const completedOrders = await prisma.order.findMany({
      where: {
        sellerId,
        status: "completed",
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                seller: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    })

    const weeklyBuckets = new Map<string, { day: string; sales: number; orders: number }>()

    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(weekStart.getTime() + offset * DAY_MS)
      weeklyBuckets.set(reportDayKey(date), {
        day: reportDayLabel(date),
        sales: 0,
        orders: 0,
      })
    }

    let totalRevenueCents = 0
    let weeklyRevenueCents = 0
    const topProductStats = new Map<
      string,
      {
        product: NonNullable<(typeof completedOrders)[number]["items"][number]["product"]>
        soldQuantity: number
        revenueCents: number
      }
    >()

    for (const order of completedOrders) {
      totalRevenueCents += order.totalCents

      if (order.completedAt && order.completedAt >= weekStart) {
        weeklyRevenueCents += order.totalCents
        const bucket = weeklyBuckets.get(reportDayKey(order.completedAt))

        if (bucket) {
          bucket.sales += centsToPesos(order.totalCents)
          bucket.orders += 1
        }
      }

      for (const item of order.items) {
        if (!item.product || item.product.status === ProductStatus.removed) continue

        const existing = topProductStats.get(item.product.id)

        if (existing) {
          existing.soldQuantity += item.quantity
          existing.revenueCents += item.subtotalCents
        } else {
          topProductStats.set(item.product.id, {
            product: item.product,
            soldQuantity: item.quantity,
            revenueCents: item.subtotalCents,
          })
        }
      }
    }

    const topProducts = Array.from(topProductStats.values())
      .sort((left, right) => {
        const revenueDiff = right.revenueCents - left.revenueCents

        if (revenueDiff !== 0) return revenueDiff

        return right.soldQuantity - left.soldQuantity
      })
      .slice(0, 5)
      .map(({ product, revenueCents, soldQuantity }) => ({
        ...mapApiProduct(product, now),
        soldQuantity,
        revenue: centsToPesos(revenueCents),
      }))

    return apiSuccess({
      revenue: {
        weekly: centsToPesos(weeklyRevenueCents),
        totalOrders: completedOrders.length,
        recoveryEarnings: centsToPesos(totalRevenueCents),
      },
      waste: {
        reducedKg: 0,
        mealsSavedEstimate: 0,
      },
      weeklyBreakdown: Array.from(weeklyBuckets.values()),
      topProducts,
    })
  } catch (error) {
    console.error("Seller reports failed", error)
    return serverError()
  }
}
