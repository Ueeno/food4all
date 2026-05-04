import { mapApiOrder } from "@/lib/api/order"
import { mapApiProduct } from "@/lib/api/mappers"
import { apiSuccess, serverError } from "@/lib/api/response"
import { requireSellerProfile } from "@/lib/api/seller-auth"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const sellerAuth = await requireSellerProfile(request)

    if (!sellerAuth.ok) {
      return sellerAuth.response
    }

    const prisma = getPrisma()
    const sellerId = sellerAuth.sellerProfile.id
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [pendingOrdersCount, completedOrdersAggregate, expiringItemsCount] =
      await Promise.all([
        prisma.order.count({
          where: {
            sellerId,
            status: { in: ["reserved", "preparing", "ready"] },
          },
        }),
        prisma.order.aggregate({
          where: {
            sellerId,
            status: "completed",
          },
          _count: { id: true },
          _sum: { totalCents: true },
        }),
        prisma.product.count({
          where: {
            sellerId,
            status: "active",
            expiryDate: { lte: nextWeek },
          },
        }),
      ])

    const totalSalesCount = completedOrdersAggregate._count.id
    const revenueCents = completedOrdersAggregate._sum.totalCents || 0
    const revenueFormatted = `₱${(revenueCents / 100).toFixed(2)}`

    const [pendingOrders, expiringProducts] = await Promise.all([
      prisma.order.findMany({
        where: {
          sellerId,
          status: { in: ["reserved", "preparing", "ready"] },
        },
        include: {
          buyer: true,
          items: {
            include: { product: true },
          },
          pickupCode: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          sellerId,
          status: "active",
          expiryDate: { lte: nextWeek },
        },
        include: {
          category: true,
          seller: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { expiryDate: "asc" },
        take: 5,
      }),
    ])

    return apiSuccess({
      metrics: [
        {
          key: "revenue",
          label: "Today's Revenue",
          value: revenueFormatted,
          trend: "+0.0% this week",
        },
        {
          key: "pendingOrders",
          label: "Pending Orders",
          value: pendingOrdersCount.toString(),
          trend: "Needs action",
        },
        {
          key: "expiringItems",
          label: "Items Expiring",
          value: expiringItemsCount.toString(),
          trend: "Within 7 days",
        },
        {
          key: "totalSales",
          label: "Total Sales",
          value: totalSalesCount.toString(),
          trend: "Completed orders",
        },
      ],
      pendingOrders: pendingOrders.map((order) => mapApiOrder(order)),
      expiringProducts: expiringProducts.map((product) => mapApiProduct(product)),
    })
  } catch (error) {
    console.error("Seller dashboard error:", error)
    return serverError()
  }
}