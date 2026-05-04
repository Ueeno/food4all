import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"

import { PrismaClient } from "../lib/generated/prisma/client"
import { ProductStatus, Role, VerificationStatus } from "../lib/generated/prisma/enums"

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
})
const prisma = new PrismaClient({ adapter })

const categories = [
  { id: "hotdogs", slug: "hotdogs", label: "Hotdogs", icon: "hotdog", color: "#e85d38", sortOrder: 10 },
  { id: "tocino", slug: "tocino", label: "Tocino", icon: "meat", color: "#e87038", sortOrder: 20 },
  { id: "frozen-foods", slug: "frozen-foods", label: "Frozen Foods", icon: "snowflake", color: "#38a8e8", sortOrder: 30 },
  { id: "sausages", slug: "sausages", label: "Sausages", icon: "sausage", color: "#8b5cf6", sortOrder: 40 },
  { id: "bacon", slug: "bacon", label: "Bacon", icon: "bacon", color: "#f59e0b", sortOrder: 50 },
  { id: "ham", slug: "ham", label: "Ham", icon: "ham", color: "#ec4899", sortOrder: 60 },
  { id: "bundle-deals", slug: "bundle-deals", label: "Bundle Deals", icon: "package", color: "#10b981", sortOrder: 70 },
]

const products = [
  {
    id: "p1",
    categoryId: "hotdogs",
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
    description: "Bulk packs of Purefoods Tender Juicy Hotdogs at near-expiry clearance pricing.",
    weight: "500g",
    packSize: "1 pack = 20 pcs",
    isHot: true,
    isFeatured: true,
  },
  {
    id: "p2",
    categoryId: "tocino",
    name: "CDO Farmhouse Tocino",
    brand: "CDO",
    originalPriceCents: 22000,
    discountedPriceCents: 14000,
    discountPercent: 36,
    imageUrl: "/images/tocino.jpg",
    stockQuantity: 35,
    unit: "packs",
    expiryDate: new Date("2026-05-08T00:00:00.000Z"),
    pickupAddress: "J.P. Laurel Ave, Bajada, Davao City",
    pickupBarangay: "Bajada",
    pickupHours: "8:00 AM - 9:00 PM",
    description: "Sweetened pork tocino for breakfast plates, resellers, and carinderias.",
    weight: "400g",
    packSize: "1 pack = 10 slices",
    isHot: false,
    isFeatured: true,
  },
  {
    id: "p3",
    categoryId: "frozen-foods",
    name: "Chicken Nuggets Supreme",
    brand: "Quick Chow",
    originalPriceCents: 19500,
    discountedPriceCents: 11500,
    discountPercent: 41,
    imageUrl: "/images/nuggets.jpg",
    stockQuantity: 60,
    unit: "packs",
    expiryDate: new Date("2026-05-20T00:00:00.000Z"),
    pickupAddress: "McArthur Hwy, Buhangin, Davao City",
    pickupBarangay: "Buhangin",
    pickupHours: "6:00 AM - 4:00 PM",
    description: "Crispy frozen chicken nuggets in bulk packs for snack shops and home cooking.",
    weight: "1kg",
    packSize: "1 pack = approx. 30 pcs",
    isHot: true,
    isFeatured: false,
  },
  {
    id: "p4",
    categoryId: "bacon",
    name: "Hacienda Bacon Strips",
    brand: "Hacienda",
    originalPriceCents: 34500,
    discountedPriceCents: 22000,
    discountPercent: 36,
    imageUrl: "/images/bacon.jpg",
    stockQuantity: 25,
    unit: "packs",
    expiryDate: new Date("2026-05-06T00:00:00.000Z"),
    pickupAddress: "SM City Davao, Quimpo Blvd",
    pickupBarangay: "Matina",
    pickupHours: "10:00 AM - 8:00 PM",
    description: "Premium streaky bacon strips from supermarket overstock.",
    weight: "300g",
    packSize: "1 pack = 15 strips",
    isHot: false,
    isFeatured: true,
  },
]

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10)

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@food4all.local" },
    update: {},
    create: {
      email: "buyer@food4all.local",
      passwordHash,
      name: "FOOD4ALL Buyer",
      phone: "09170000001",
      role: Role.buyer,
    },
  })

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@food4all.local" },
    update: {},
    create: {
      email: "seller@food4all.local",
      passwordHash,
      name: "Magsaysay Seller",
      phone: "09170000002",
      role: Role.seller,
    },
  })

  const seller = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      businessName: "Magsaysay Meat Depot",
      address: "Magsaysay Market, Davao City",
      barangay: "Poblacion District",
      contactNumber: "09170000002",
      rating: 4.8,
      isOpen: true,
      verificationStatus: VerificationStatus.verified,
    },
  })

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    })
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        ...product,
        sellerId: seller.id,
        status: ProductStatus.active,
      },
      create: {
        ...product,
        sellerId: seller.id,
        status: ProductStatus.active,
      },
    })
  }

  console.log(`Seeded ${categories.length} categories, ${products.length} products, buyer ${buyer.email}, and seller ${sellerUser.email}.`)
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
