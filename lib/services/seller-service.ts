import { apiRequest } from "@/lib/api-client"
import type { ApiProduct, SellerProductRequest } from "@/lib/api-contracts"
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

const mockSellerProducts: Product[] = PRODUCTS.map((product) => ({ ...product }))

function cloneProduct(product: Product): Product {
  return { ...product }
}

function categoryToId(category: string) {
  return category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function productInputToSellerRequest(input: ProductInput): SellerProductRequest {
  return {
    name: input.name,
    brand: input.brand,
    categoryId: categoryToId(input.category),
    originalPrice: input.originalPrice,
    discountedPrice: input.discountedPrice,
    quantity: input.quantity,
    unit: input.unit,
    expiryDate: input.expiryDate,
    pickupAddress: input.location.trim() || MOCK_SELLER.address,
    pickupHours: input.pickupHours,
    description: input.description,
    weight: input.weight,
    packSize: input.packSize.trim() || input.weight.trim() || "1 pack",
    imageUrl: input.image,
  }
}

function productInputPatchToSellerRequest(input: Partial<ProductInput>): Partial<SellerProductRequest> {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.brand !== undefined ? { brand: input.brand } : {}),
    ...(input.category !== undefined ? { categoryId: categoryToId(input.category) } : {}),
    ...(input.originalPrice !== undefined ? { originalPrice: input.originalPrice } : {}),
    ...(input.discountedPrice !== undefined ? { discountedPrice: input.discountedPrice } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate } : {}),
    ...(input.location !== undefined ? { pickupAddress: input.location.trim() || MOCK_SELLER.address } : {}),
    ...(input.pickupHours !== undefined ? { pickupHours: input.pickupHours } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.weight !== undefined ? { weight: input.weight } : {}),
    ...(input.packSize !== undefined ? { packSize: input.packSize } : {}),
    ...(input.image !== undefined ? { imageUrl: input.image } : {}),
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
  const { products } = await apiRequest<{ products: ApiProduct[] }>("/api/seller/products")

  return products.map(cloneProduct)
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { product } = await apiRequest<{ product: ApiProduct }, SellerProductRequest>(
    "/api/seller/products",
    {
      method: "POST",
      body: productInputToSellerRequest(input),
    },
  )

  return cloneProduct(product)
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product | null> {
  const { product: updated } = await apiRequest<
    { product: ApiProduct },
    Partial<SellerProductRequest>
  >(`/api/seller/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: productInputPatchToSellerRequest(input),
  })

  return cloneProduct(updated)
}

export async function deleteProduct(id: string): Promise<void> {
  await apiRequest<{ product: ApiProduct }>(`/api/seller/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}
