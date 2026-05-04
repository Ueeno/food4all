import { describe, expect, it } from "vitest"

import { centsToPesos, getDaysUntilExpiry, mapApiCategory, mapApiProduct } from "@/lib/api/mappers"

describe("API mappers", () => {
  it("maps cents and expiry dates into the frontend API contract", () => {
    expect(centsToPesos(18500)).toBe(185)
    expect(
      getDaysUntilExpiry(new Date("2026-05-12T00:00:00.000Z"), new Date("2026-05-04T00:00:00.000Z")),
    ).toBe(8)
  })

  it("maps category and product records to DTOs", () => {
    const category = {
      id: "hotdogs",
      slug: "hotdogs",
      label: "Hotdogs",
      icon: "hotdog",
      color: "#e85d38",
      sortOrder: 10,
    }
    const product = mapApiProduct(
      {
        id: "p1",
        sellerId: "seller-1",
        categoryId: category.id,
        name: "Purefoods Tender Juicy Hotdog",
        brand: "Purefoods",
        originalPriceCents: 28500,
        discountedPriceCents: 18500,
        discountPercent: 35,
        imageUrl: "/images/hotdogs.jpg",
        stockQuantity: 48,
        unit: "packs",
        expiryDate: new Date("2026-05-12T00:00:00.000Z"),
        pickupAddress: "Magsaysay Market, Davao City",
        pickupBarangay: "Poblacion District",
        pickupHours: "7:00 AM - 5:00 PM",
        description: "Near-expiry hotdogs.",
        weight: "500g",
        packSize: "1 pack = 20 pcs",
        isHot: true,
        isFeatured: true,
        status: "active",
        createdAt: new Date("2026-05-04T00:00:00.000Z"),
        updatedAt: new Date("2026-05-04T00:00:00.000Z"),
        category,
        seller: {
          businessName: "Magsaysay Meat Depot",
          rating: 4.8,
        },
      },
      new Date("2026-05-04T00:00:00.000Z"),
    )

    expect(mapApiCategory(category)).toEqual(category)
    expect(product).toMatchObject({
      id: "p1",
      category: "Hotdogs",
      originalPrice: 285,
      discountedPrice: 185,
      quantity: 48,
      daysUntilExpiry: 8,
      seller: "Magsaysay Meat Depot",
      sellerId: "seller-1",
      categoryId: "hotdogs",
      status: "active",
    })
  })
})
