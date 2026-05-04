export type AuthRole = "buyer" | "seller"
export type UserRole = AuthRole | null
export type AuthStatus = "authenticated" | "unauthenticated"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export type AuthUser = User

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  firstName: string
  lastName: string
  phone?: string
  email: string
  password: string
}

export interface Seller {
  id: string
  businessName: string
  email: string
  address: string
  barangay?: string
  contactNumber: string
  rating: number
  isOpen?: boolean
  verificationStatus?: "pending" | "verified" | "rejected"
}

export interface Product {
  id: string
  name: string
  brand: string
  category: string
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  image: string
  quantity: number
  unit: string
  expiryDate: string
  daysUntilExpiry: number
  seller: string
  sellerRating: number
  location: string
  barangay: string
  pickupHours: string
  description: string
  weight: string
  packSize: string
  isHot: boolean
  isFeatured: boolean
}

export interface Category {
  id: string
  label: string
  icon: string
  color: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  originalPrice: number
  quantity: number
  image: string
  seller: string
  location: string
  pickupDate?: string
}

export type OrderStatus = "reserved" | "preparing" | "ready" | "completed" | "cancelled"

export interface Order {
  id: string
  buyer: string
  product: string
  quantity: number
  total: number
  status: OrderStatus
  pickupDate: string
  pickupTime: string
  pickupCode: string
}

export interface PickupCode {
  code: string
  orderId: string
}

export interface PickupVerification {
  code: string
  orderId?: string
  status: "valid" | "invalid"
  message: string
  order?: Order
}

export interface CreateOrderInput {
  items: CartItem[]
  pickupDate: string
  pickupTime: string
}

export interface ProductInput {
  name: string
  brand: string
  category: string
  originalPrice: number
  discountedPrice: number
  image: string
  quantity: number
  unit: string
  expiryDate: string
  seller: string
  location: string
  barangay: string
  pickupHours: string
  description: string
  weight: string
  packSize: string
}

export type SellerDashboardMetricKey =
  | "revenue"
  | "pendingOrders"
  | "expiringItems"
  | "totalSales"

export interface SellerDashboardMetric {
  key: SellerDashboardMetricKey
  label: string
  value: string
  trend: string
}

export interface SellerDashboard {
  metrics: SellerDashboardMetric[]
  pendingOrders: Order[]
  expiringProducts: Product[]
}

export interface SellerReportDay {
  day: string
  sales: number
  orders: number
}

export interface SellerReportTopProduct extends Product {
  soldQuantity: number
  revenue: number
}

export interface SellerReports {
  revenue: {
    weekly: number
    totalOrders: number
    recoveryEarnings: number
  }
  waste: {
    reducedKg: number
    mealsSavedEstimate: number
  }
  weeklyBreakdown: SellerReportDay[]
  topProducts: SellerReportTopProduct[]
}

export interface SellerProfileUpdateInput {
  businessName?: string
  address?: string
  barangay?: string
  contactNumber?: string
  isOpen?: boolean
}
