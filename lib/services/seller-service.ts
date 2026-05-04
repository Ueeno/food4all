import { PRODUCTS } from "@/lib/mock-data"
import { getSellerOrders } from "@/lib/services/order-service"
import type { Product, ProductInput, Seller, SellerDashboard } from "@/lib/types"

const MOCK_SELLER: Seller = {
  id: "seller-magsaysay-meat-depot",
  businessName: "Magsaysay Meat Depot",
  email: "seller@food4all.local",
  address: "Magsaysay Market, Poblacion District, Davao City 8000",
  contactNumber: "+63 912 345 6789",
  rating: 4.8,
}

let mockSellerProducts: Product[] = PRODUCTS.map((product) => ({ ...product }))

function cloneProduct(product: Product): Product {
  return { ...product }
}

function buildProduct(input: ProductInput, id = `mock-product-${Date.now()}`): Product {
  const discountPercent = Math.round(
    ((input.originalPrice - input.discountedPrice) / input.originalPrice) * 100,
  )

  return {
    ...input,
    id,
    discountPercent,
    daysUntilExpiry: 14,
    sellerRating: MOCK_SELLER.rating,
    isHot: false,
    isFeatured: false,
  }
}

export async function getSellerProfile(): Promise<Seller> {
  return { ...MOCK_SELLER }
}

export async function getSellerDashboard(): Promise<SellerDashboard> {
  const sellerOrders = await getSellerOrders()
  const pendingOrders = sellerOrders.filter(
    (order) => order.status === "reserved" || order.status === "ready",
  )
  const expiringProducts = mockSellerProducts
    .filter((product) => product.daysUntilExpiry <= 14)
    .slice(0, 3)

  return {
    metrics: [
      { key: "revenue", label: "Today's Revenue", value: "PHP 3,245", trend: "+18%" },
      { key: "pendingOrders", label: "Pending Orders", value: `${pendingOrders.length}`, trend: "2 new" },
      { key: "expiringItems", label: "Items Expiring", value: `${expiringProducts.length}`, trend: "Action needed" },
      { key: "totalSales", label: "Total Sales", value: "PHP 48,920", trend: "+5% week" },
    ],
    pendingOrders,
    expiringProducts: expiringProducts.map(cloneProduct),
  }
}

export async function getSellerProducts(): Promise<Product[]> {
  return mockSellerProducts.map(cloneProduct)
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const product = buildProduct(input)
  mockSellerProducts = [product, ...mockSellerProducts]
  return cloneProduct(product)
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product | null> {
  const existing = mockSellerProducts.find((product) => product.id === id)

  if (!existing) return null

  const updated = buildProduct({ ...existing, ...input }, id)
  mockSellerProducts = mockSellerProducts.map((product) => (product.id === id ? updated : product))

  return cloneProduct(updated)
}

export async function deleteProduct(id: string): Promise<void> {
  mockSellerProducts = mockSellerProducts.filter((product) => product.id !== id)
}
