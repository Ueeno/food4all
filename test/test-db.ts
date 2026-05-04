import { execSync } from "node:child_process"
import { rmSync } from "node:fs"
import path from "node:path"

import bcrypt from "bcryptjs"

import { ProductStatus, Role, VerificationStatus } from "@/lib/generated/prisma/enums"
import { disconnectPrisma, getPrisma } from "@/lib/prisma"

export const TEST_DATABASE_URL = "file:./prisma/test.db"
export const TEST_PASSWORD = "password123"

const repoRoot = process.cwd()
const originalDatabaseUrl = process.env.DATABASE_URL

function assertTestDatabaseUrl(databaseUrl = TEST_DATABASE_URL) {
  if (!databaseUrl.includes("test.db") || databaseUrl.includes("dev.db")) {
    throw new Error(`Refusing to reset non-test database: ${databaseUrl}`)
  }
}

export function removeTestDatabaseFiles() {
  const prismaDir = path.resolve(repoRoot, "prisma")
  const testFiles = ["test.db", "test.db-journal", "test.db-shm", "test.db-wal"]

  for (const file of testFiles) {
    const target = path.resolve(prismaDir, file)

    if (!target.startsWith(`${prismaDir}${path.sep}`)) {
      throw new Error(`Refusing to remove unexpected path: ${target}`)
    }

    rmSync(target, { force: true })
  }
}

export function pushTestDatabaseSchema() {
  assertTestDatabaseUrl()
  const prismaCliEnv: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: TEST_DATABASE_URL,
    RUST_BACKTRACE: "1",
    RUST_LOG: "debug",
  }

  delete prismaCliEnv.NODE_OPTIONS
  delete prismaCliEnv.VITEST
  delete prismaCliEnv.VITEST_POOL_ID
  delete prismaCliEnv.VITEST_WORKER_ID

  const command =
    process.platform === "win32"
      ? `$env:RUST_BACKTRACE='${prismaCliEnv.RUST_BACKTRACE}'; $env:RUST_LOG='${prismaCliEnv.RUST_LOG}'; $env:DATABASE_URL='${TEST_DATABASE_URL}'; corepack pnpm prisma db push --force-reset --url ${TEST_DATABASE_URL}`
      : `corepack pnpm prisma db push --force-reset --url ${TEST_DATABASE_URL}`

  execSync(command, {
    cwd: repoRoot,
    env: prismaCliEnv,
    shell: process.platform === "win32" ? "powershell.exe" : undefined,
    stdio: "pipe",
  })
}

export async function setupTestDatabase() {
  assertTestDatabaseUrl()
  await disconnectPrisma()
  process.env.DATABASE_URL = TEST_DATABASE_URL
}

export async function resetTestDatabase() {
  assertTestDatabaseUrl(process.env.DATABASE_URL)

  const prisma = getPrisma()

  await prisma.$transaction([
    prisma.pickupCode.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.sellerProfile.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ])

  await seedTestDatabase()
}

export async function seedTestDatabase() {
  assertTestDatabaseUrl(process.env.DATABASE_URL)

  const prisma = getPrisma()
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10)
  const sellerUser = await prisma.user.create({
    data: {
      id: "test-seller-user",
      email: "seller@example.test",
      passwordHash,
      name: "Test Seller",
      phone: "09170000002",
      role: Role.seller,
    },
  })

  await prisma.user.create({
    data: {
      id: "test-buyer-user",
      email: "buyer@example.test",
      passwordHash,
      name: "Test Buyer",
      phone: "09170000001",
      role: Role.buyer,
    },
  })

  const seller = await prisma.sellerProfile.create({
    data: {
      id: "test-seller-profile",
      userId: sellerUser.id,
      businessName: "Integration Meat Depot",
      address: "Magsaysay Market, Davao City",
      barangay: "Poblacion District",
      contactNumber: "09170000002",
      rating: 4.8,
      isOpen: true,
      verificationStatus: VerificationStatus.verified,
    },
  })

  await prisma.category.createMany({
    data: [
      {
        id: "hotdogs",
        slug: "hotdogs",
        label: "Hotdogs",
        icon: "hotdog",
        color: "#e85d38",
        sortOrder: 10,
      },
      {
        id: "frozen-foods",
        slug: "frozen-foods",
        label: "Frozen Foods",
        icon: "snowflake",
        color: "#38a8e8",
        sortOrder: 20,
      },
    ],
  })

  await prisma.product.createMany({
    data: [
      {
        id: "test-product-active",
        sellerId: seller.id,
        categoryId: "hotdogs",
        name: "Integration Tender Juicy Hotdog",
        brand: "Purefoods",
        originalPriceCents: 28500,
        discountedPriceCents: 18500,
        discountPercent: 35,
        imageUrl: "/images/hotdogs.jpg",
        stockQuantity: 12,
        unit: "packs",
        expiryDate: new Date("2030-05-12T00:00:00.000Z"),
        pickupAddress: "Magsaysay Market, Davao City",
        pickupBarangay: "Poblacion District",
        pickupHours: "7:00 AM - 5:00 PM",
        description: "Integration-test hotdogs.",
        weight: "500g",
        packSize: "1 pack = 20 pcs",
        isHot: true,
        isFeatured: true,
        status: ProductStatus.active,
      },
      {
        id: "test-product-expired",
        sellerId: seller.id,
        categoryId: "frozen-foods",
        name: "Expired Integration Nuggets",
        brand: "Quick Chow",
        originalPriceCents: 19500,
        discountedPriceCents: 11500,
        discountPercent: 41,
        imageUrl: "/images/nuggets.jpg",
        stockQuantity: 8,
        unit: "packs",
        expiryDate: new Date("2020-05-12T00:00:00.000Z"),
        pickupAddress: "McArthur Hwy, Buhangin, Davao City",
        pickupBarangay: "Buhangin",
        pickupHours: "6:00 AM - 4:00 PM",
        description: "Expired product that should not be public.",
        weight: "1kg",
        packSize: "1 pack = approx. 30 pcs",
        isHot: false,
        isFeatured: false,
        status: ProductStatus.active,
      },
    ],
  })
}

export async function teardownTestDatabase() {
  await disconnectPrisma()

  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }

}
