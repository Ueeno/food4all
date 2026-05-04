import { apiRequest } from "@/lib/api-client"
import type { ApiProduct, SellerDashboardResponse, SellerProductRequest } from "@/lib/api-contracts"
import type { Product, ProductInput, Seller, SellerDashboard } from "@/lib/types"
import type { ApiOrder } from "@/lib/api-contracts"
import type { Order } from "@/lib/types"


const MOCK_SELLER: Seller = {
  id: "seller-magsaysay-meat-depot",
  businessName: "Magsaysay Meat Depot",
  email: "seller@food4all.local",
  address: "Magsaysay Market, Poblacion District, Davao City 8000",
  contactNumber: "+63 912 345 6789",
  rating: 4.8,
}

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

function mapApiOrderToOrder(order: ApiOrder): Order {
  return {
    id: order.id,
    buyer: order.buyer,
    product: order.product,
    quantity: order.quantity,
    total: order.total,
    status: order.status,
    pickupDate: order.pickupDate,
    pickupTime: order.pickupTime,
    pickupCode: order.pickupCode,
  }
}

export async function getSellerProfile(): Promise<Seller> {
  return { ...MOCK_SELLER }
}

export async function getSellerDashboard(): Promise<SellerDashboard> {
  const data = await apiRequest<SellerDashboardResponse>("/api/seller/dashboard")

  return {
    metrics: data.metrics,
    pendingOrders: data.pendingOrders.map(mapApiOrderToOrder),
    expiringProducts: data.expiringProducts.map(cloneProduct),
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
