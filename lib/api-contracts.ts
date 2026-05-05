import type {
  AuthRole,
  CartItem,
  Category,
  Order,
  OrderStatus,
  Product,
  Seller,
  User,
} from "@/lib/types"

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"

export interface ApiErrorResponse {
  ok: false
  error: {
    code: ApiErrorCode
    message: string
    fieldErrors?: Record<string, string>
  }
}

export interface ApiSuccessResponse<Data> {
  ok: true
  data: Data
}

export type ApiResponse<Data> = ApiSuccessResponse<Data> | ApiErrorResponse

export type ApiEndpoint =
  | "/api/auth/register"
  | "/api/auth/login"
  | "/api/auth/logout"
  | "/api/auth/me"
  | "/api/auth/role"
  | "/api/products"
  | "/api/products/:id"
  | "/api/seller/products"
  | "/api/seller/products/:id"
  | "/api/categories"
  | "/api/cart"
  | "/api/cart/items"
  | "/api/cart/items/:productId"
  | "/api/orders"
  | "/api/orders/:id"
  | "/api/seller/orders"
  | "/api/seller/orders/:id/status"
  | "/api/pickup/verify"
  | "/api/seller/dashboard"
  | "/api/seller/reports"
  | "/api/seller/profile"

export type ApiUser = Omit<User, "role"> & {
  role: AuthRole | null
  createdAt: string
  updatedAt: string
}

export type ApiSellerProfile = Seller & {
  userId: string
  barangay?: string
  isOpen: boolean
  verificationStatus: "pending" | "verified" | "rejected"
  createdAt: string
  updatedAt: string
}

export type ApiCategory = Category & {
  slug: string
  sortOrder: number
}

export type ApiProduct = Product & {
  sellerId: string
  categoryId: string
  status: "draft" | "active" | "sold_out" | "expired" | "removed"
  createdAt: string
  updatedAt: string
}

export type ApiCartItem = CartItem & {
  productId: string
  lineTotal: number
  updatedAt: string
}

export type ApiOrderItem = {
  id: string
  orderId: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  originalUnitPrice: number
  subtotal: number
}

export type ApiOrder = Order & {
  buyerId: string
  sellerId: string
  items: ApiOrderItem[]
  createdAt: string
  updatedAt: string
  completedAt?: string
  cancelledAt?: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  phone?: string
  email: string
  password: string
  role?: AuthRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SetRoleRequest {
  role: AuthRole
}

export type AuthResponse = ApiResponse<{ user: ApiUser }>
export type MeResponse = ApiResponse<{ user: ApiUser | null }>
export type LogoutResponse = ApiResponse<{ loggedOut: true }>

export interface ProductListQuery {
  search?: string
  categoryId?: string
  sellerId?: string
  maxDaysUntilExpiry?: number
  featured?: boolean
  hot?: boolean
  page?: number
  pageSize?: number
}

export type ProductListResponse = ApiResponse<{
  products: ApiProduct[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}>

export type ProductResponse = ApiResponse<{ product: ApiProduct }>

export interface SellerProductRequest {
  name: string
  brand: string
  categoryId: string
  originalPrice: number
  discountedPrice: number
  quantity: number
  unit: string
  expiryDate: string
  pickupAddress: string
  pickupHours: string
  description: string
  weight: string
  packSize: string
  imageUrl?: string
}

export type SellerProductResponse = ApiResponse<{ product: ApiProduct }>
export type SellerProductListResponse = ApiResponse<{ products: ApiProduct[] }>

export type CategoryListResponse = ApiResponse<{ categories: ApiCategory[] }>

export type CartResponse = ApiResponse<{
  items: ApiCartItem[]
  itemCount: number
  subtotal: number
  total: number
}>

export interface AddCartItemRequest {
  productId: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface CreateOrderRequest {
  pickupDate: string
  pickupTime: string
}

export type OrderResponse = ApiResponse<{ order: ApiOrder }>
export type OrderListResponse = ApiResponse<{ orders: ApiOrder[] }>

export interface UpdateSellerOrderStatusRequest {
  status: Extract<OrderStatus, "preparing" | "ready" | "completed" | "cancelled">
}

export interface VerifyPickupRequest {
  code: string
}

export interface PickupVerificationResult {
  code: string
  orderId?: string
  status: "valid" | "invalid"
  message: string
  order?: ApiOrder
}

export type PickupVerificationResponse = ApiResponse<PickupVerificationResult>


export type ApiSellerReportDay = {
  day: string
  sales: number
  orders: number
}

export type ApiSellerReportTopProduct = ApiProduct & {
  soldQuantity: number
  revenue: number
}

export type SellerReportsResponse = ApiResponse<{
  revenue: {
    weekly: number
    totalOrders: number
    recoveryEarnings: number
  }
  waste: {
    reducedKg: number
    mealsSavedEstimate: number
  }
  weeklyBreakdown: ApiSellerReportDay[]
  topProducts: ApiSellerReportTopProduct[]
}>

export type SellerProfileResponse = ApiResponse<{ seller: ApiSellerProfile }>

export interface UpdateSellerProfileRequest {
  businessName?: string
  address?: string
  barangay?: string
  contactNumber?: string
  isOpen?: boolean
}

export interface SellerDashboardResponse {
  metrics: {
    key: "revenue" | "pendingOrders" | "expiringItems" | "totalSales"
    label: string
    value: string
    trend: string
  }[]
  pendingOrders: ApiOrder[]
  expiringProducts: ApiProduct[]
}
