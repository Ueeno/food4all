import type { ApiCartItem, ApiCategory, ApiProduct, ApiUser } from "@/lib/api-contracts"

type DbUser = {
  id: string
  name: string
  email: string
  role: ApiUser["role"]
  createdAt: Date
  updatedAt: Date
}

type DbCategory = {
  id: string
  slug: string
  label: string
  icon: string
  color: string
  sortOrder: number
}

type DbProduct = {
  id: string
  sellerId: string
  categoryId: string
  name: string
  brand: string
  originalPriceCents: number
  discountedPriceCents: number
  discountPercent: number
  imageUrl: string | null
  stockQuantity: number
  unit: string
  expiryDate: Date
  pickupAddress: string
  pickupBarangay: string | null
  pickupHours: string
  description: string
  weight: string
  packSize: string
  isHot: boolean
  isFeatured: boolean
  status: ApiProduct["status"]
  createdAt: Date
  updatedAt: Date
  category: DbCategory
  seller: {
    businessName: string
    rating: number
  }
}

type DbCartItem = {
  id: string
  productId: string
  quantity: number
  updatedAt: Date
  product: DbProduct
}

const DAY_MS = 24 * 60 * 60 * 1000

export function centsToPesos(cents: number): number {
  return cents / 100
}

export function getDaysUntilExpiry(expiryDate: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / DAY_MS))
}

export function mapApiUser(user: DbUser): ApiUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export function mapApiCategory(category: DbCategory): ApiCategory {
  return { ...category }
}

export function mapApiProduct(product: DbProduct, now = new Date()): ApiProduct {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category.label,
    originalPrice: centsToPesos(product.originalPriceCents),
    discountedPrice: centsToPesos(product.discountedPriceCents),
    discountPercent: product.discountPercent,
    image: product.imageUrl ?? "/placeholder.svg",
    quantity: product.stockQuantity,
    unit: product.unit,
    expiryDate: product.expiryDate.toISOString(),
    daysUntilExpiry: getDaysUntilExpiry(product.expiryDate, now),
    seller: product.seller.businessName,
    sellerRating: product.seller.rating,
    location: product.pickupAddress,
    barangay: product.pickupBarangay ?? "",
    pickupHours: product.pickupHours,
    description: product.description,
    weight: product.weight,
    packSize: product.packSize,
    isHot: product.isHot,
    isFeatured: product.isFeatured,
    sellerId: product.sellerId,
    categoryId: product.categoryId,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}

export function mapApiCartItem(item: DbCartItem): ApiCartItem {
  const product = item.product
  const price = centsToPesos(product.discountedPriceCents)
  const originalPrice = centsToPesos(product.originalPriceCents)
  const lineTotal = price * item.quantity

  return {
    id: item.productId,
    productId: item.productId,
    name: product.name,
    price,
    originalPrice,
    quantity: item.quantity,
    image: product.imageUrl ?? "/placeholder.svg",
    seller: product.seller.businessName,
    location: product.pickupAddress,
    lineTotal,
    updatedAt: item.updatedAt.toISOString(),
  }
}

export function mapApiCart(items: DbCartItem[]) {
  const mappedItems = items.map(mapApiCartItem)
  const itemCount = mappedItems.reduce((sum, item) => sum + item.quantity, 0)
  const total = mappedItems.reduce((sum, item) => sum + item.lineTotal, 0)

  return {
    items: mappedItems,
    itemCount,
    subtotal: total,
    total,
  }
}
