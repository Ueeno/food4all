import { apiRequest } from "@/lib/api-client"
import type {
  ApiOrder,
  ApiProduct,
  ApiSellerProfile,
  ApiSellerReportTopProduct,
  SellerDashboardResponse,
  SellerProductRequest,
  UpdateSellerProfileRequest,
} from "@/lib/api-contracts"
import type {
  Order,
  Product,
  ProductInput,
  Seller,
  SellerDashboard,
  SellerProfileUpdateInput,
  SellerReports,
} from "@/lib/types"


function cloneProduct(product: Product): Product {
  return { ...product }
}

function cloneReportTopProduct(product: ApiSellerReportTopProduct): SellerReports["topProducts"][number] {
  return { ...product }
}

function mapApiSellerProfileToSeller(seller: ApiSellerProfile): Seller {
  return {
    id: seller.id,
    businessName: seller.businessName,
    email: seller.email,
    address: seller.address,
    barangay: seller.barangay,
    contactNumber: seller.contactNumber,
    rating: seller.rating,
    isOpen: seller.isOpen,
    verificationStatus: seller.verificationStatus,
  }
}

type SellerReportsPayload = {
  revenue: SellerReports["revenue"]
  waste: SellerReports["waste"]
  weeklyBreakdown: SellerReports["weeklyBreakdown"]
  topProducts: ApiSellerReportTopProduct[]
}

function productInputToSellerRequest(input: ProductInput): SellerProductRequest {
  return {
    name: input.name,
    brand: input.brand,
    categoryId: input.category, // Pass category ID/slug directly
    originalPrice: input.originalPrice,
    discountedPrice: input.discountedPrice,
    quantity: input.quantity,
    unit: input.unit,
    expiryDate: input.expiryDate,
    pickupAddress: input.location.trim(),
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
    ...(input.category !== undefined ? { categoryId: input.category } : {}),
    ...(input.originalPrice !== undefined ? { originalPrice: input.originalPrice } : {}),
    ...(input.discountedPrice !== undefined ? { discountedPrice: input.discountedPrice } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.unit !== undefined ? { unit: input.unit } : {}),
    ...(input.expiryDate !== undefined ? { expiryDate: input.expiryDate } : {}),
    ...(input.location !== undefined ? { pickupAddress: input.location.trim() } : {}),
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
  const { seller } = await apiRequest<{ seller: ApiSellerProfile }>("/api/seller/profile")

  return mapApiSellerProfileToSeller(seller)
}

export async function updateSellerProfile(input: SellerProfileUpdateInput): Promise<Seller> {
  const { seller } = await apiRequest<{ seller: ApiSellerProfile }, UpdateSellerProfileRequest>(
    "/api/seller/profile",
    {
      method: "PATCH",
      body: input,
    },
  )

  return mapApiSellerProfileToSeller(seller)
}

export async function getSellerDashboard(): Promise<SellerDashboard> {
  const data = await apiRequest<SellerDashboardResponse>("/api/seller/dashboard")

  return {
    metrics: data.metrics,
    pendingOrders: data.pendingOrders.map(mapApiOrderToOrder),
    expiringProducts: data.expiringProducts.map(cloneProduct),
  }
}

export async function getSellerReports(): Promise<SellerReports> {
  const data = await apiRequest<SellerReportsPayload>("/api/seller/reports")

  return {
    revenue: { ...data.revenue },
    waste: { ...data.waste },
    weeklyBreakdown: data.weeklyBreakdown.map((day) => ({ ...day })),
    topProducts: data.topProducts.map(cloneReportTopProduct),
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
