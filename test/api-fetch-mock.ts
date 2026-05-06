import { vi } from "vitest"

import type {
  ApiCartItem,
  ApiCategory,
  ApiErrorCode,
  ApiOrder,
  ApiProduct,
  ApiSellerProfile,
  ApiSellerReportTopProduct,
  ApiUser,
} from "@/lib/api-contracts"
import { CATEGORIES, PRODUCTS, SELLER_ORDERS } from "@/lib/mock-data"
import type { Category, Order, Product } from "@/lib/types"

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export const API_CATEGORIES: ApiCategory[] = CATEGORIES.map((category, index) => ({
  ...category,
  slug: category.id,
  sortOrder: (index + 1) * 10,
}))

export const API_PRODUCTS: ApiProduct[] = PRODUCTS.map((product) => ({
  ...product,
  sellerId: slugify(product.seller),
  categoryId: slugify(product.category),
  status: "active",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
}))

function toApiUser(email: string, overrides: Partial<ApiUser> = {}): ApiUser {
  const normalizedEmail = email.trim().toLowerCase()
  const nameSeed = normalizedEmail.split("@")[0]?.replace(/[._-]+/g, " ") || "food4all user"
  const name = nameSeed.replace(/\b\w/g, (character) => character.toUpperCase())

  return {
    id: `api-user-${slugify(normalizedEmail) || "user"}`,
    name,
    email: normalizedEmail,
    role: null,
    createdAt: "2026-05-04T00:00:00.000Z",
    updatedAt: "2026-05-04T00:00:00.000Z",
    ...overrides,
  }
}

export const API_SELLER_REPORTS = {
  revenue: {
    weekly: 9240,
    totalOrders: 12,
    recoveryEarnings: 18420,
  },
  waste: {
    reducedKg: 0,
    mealsSavedEstimate: 0,
  },
  weeklyBreakdown: [
    { day: "Mon", sales: 840, orders: 1 },
    { day: "Tue", sales: 1200, orders: 2 },
    { day: "Wed", sales: 950, orders: 1 },
    { day: "Thu", sales: 1500, orders: 2 },
    { day: "Fri", sales: 1600, orders: 2 },
    { day: "Sat", sales: 2250, orders: 3 },
    { day: "Sun", sales: 900, orders: 1 },
  ],
  topProducts: [
    {
      ...API_PRODUCTS[0]!,
      soldQuantity: 11,
      revenue: 2035,
    },
  ] satisfies ApiSellerReportTopProduct[],
}

export const API_SELLER_PROFILE: ApiSellerProfile = {
  id: "seller-magsaysay-meat-depot",
  userId: "mock-seller-user",
  businessName: "SQL Magsaysay Meat Depot",
  email: "seller@food4all.local",
  address: "SQL Magsaysay Market, Poblacion District, Davao City 8000",
  barangay: "Poblacion District",
  contactNumber: "+63 912 000 1111",
  rating: 4.7,
  isOpen: true,
  verificationStatus: "verified",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
}

export function apiSuccessResponse<Data>(data: Data, init: ResponseInit = {}) {
  return new Response(JSON.stringify({ ok: true, data }), {
    ...init,
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  })
}

export function apiErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  fieldErrors?: Record<string, string>,
) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    }),
    {
      status,
      headers: {
        "content-type": "application/json",
      },
    },
  )
}

function fetchInputUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.toString()

  return input.url
}

function parseFetchUrl(input: RequestInfo | URL) {
  return new URL(fetchInputUrl(input), "http://localhost")
}

function filterProducts(url: URL) {
  let products = [...API_PRODUCTS]
  const search = url.searchParams.get("search")?.trim().toLowerCase()
  const categoryId = url.searchParams.get("categoryId")
  const featured = url.searchParams.get("featured")
  const hot = url.searchParams.get("hot")
  const maxDaysUntilExpiry = url.searchParams.get("maxDaysUntilExpiry")

  if (search) {
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.seller.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.barangay.toLowerCase().includes(search),
    )
  }

  if (categoryId) {
    products = products.filter((product) => product.categoryId === categoryId)
  }

  if (featured !== null) {
    products = products.filter((product) => product.isFeatured === (featured === "true"))
  }

  if (hot !== null) {
    products = products.filter((product) => product.isHot === (hot === "true"))
  }

  if (maxDaysUntilExpiry !== null) {
    const maxDays = Number(maxDaysUntilExpiry)

    products = products.filter((product) => product.daysUntilExpiry <= maxDays)
  }

  return products
}

function toApiCartItem(product: ApiProduct, quantity: number): ApiCartItem {
  return {
    id: product.id,
    productId: product.id,
    name: product.name,
    price: product.discountedPrice,
    originalPrice: product.originalPrice,
    quantity,
    image: product.image,
    seller: product.seller,
    location: product.location,
    lineTotal: product.discountedPrice * quantity,
    updatedAt: "2026-05-04T00:00:00.000Z",
  }
}

function toApiOrder(order: Order): ApiOrder {
  return {
    ...order,
    buyerId: "mock-buyer",
    sellerId: "mock-seller",
    items: [
      {
        id: `mock-item-${order.id}`,
        orderId: order.id,
        productId: "p1",
        productName: order.product,
        quantity: order.quantity,
        unitPrice: order.total / order.quantity,
        originalUnitPrice: order.total / order.quantity,
        subtotal: order.total,
      },
    ],
    createdAt: "2026-05-04T00:00:00.000Z",
    updatedAt: "2026-05-04T00:00:00.000Z",
  }
}

function cartPayload(cartItems: ApiCartItem[]) {
  const items = cartItems.map((item) => ({ ...item }))
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0)

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: total,
    total,
  }
}

export function installMarketplaceFetchMock() {
  const sellerProducts: ApiProduct[] = API_PRODUCTS.map((product) => ({ ...product }))
  const sellerOrders: Order[] = SELLER_ORDERS.map((order) => ({ ...order }))
  let sellerProfile: ApiSellerProfile = { ...API_SELLER_PROFILE }
  let currentUser: ApiUser | null = null
  const cartItems: ApiCartItem[] = []
  const buyerOrders: ApiOrder[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = parseFetchUrl(input)
    const requestMethod = input instanceof Request ? input.method : init?.method
    const requestBody = input instanceof Request ? undefined : init?.body

    async function readRequestBody() {
      if (input instanceof Request) return input.json() as Promise<unknown>
      if (typeof requestBody === "string") return JSON.parse(requestBody) as unknown
      return {}
    }

    if (url.pathname === "/api/auth/login" && (requestMethod ?? "GET") === "POST") {
      const body = (await readRequestBody()) as { email?: string; password?: string }
      const email = body.email?.trim().toLowerCase() ?? ""

      if (!email || !body.password) {
        return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
          ...(!email ? { email: "Email is required." } : {}),
          ...(!body.password ? { password: "Password is required." } : {}),
        })
      }

      if (body.password !== "password123" || email.includes("invalid")) {
        return apiErrorResponse("UNAUTHENTICATED", "Invalid email or password.", 401)
      }

      const role =
        email === "buyer@food4all.local"
          ? "buyer"
          : email === "seller@food4all.local"
            ? "seller"
            : null
      const name =
        role === "buyer" ? "Test Buyer" : role === "seller" ? "Test Seller" : "API Login User"
      currentUser = toApiUser(email, { name, role })

      return apiSuccessResponse({ user: { ...currentUser } })
    }

    if (url.pathname === "/api/auth/register" && (requestMethod ?? "GET") === "POST") {
      const body = (await readRequestBody()) as {
        firstName?: string
        lastName?: string
        phone?: string
        email?: string
        password?: string
        role?: ApiUser["role"]
      }
      const email = body.email?.trim().toLowerCase() ?? ""

      if (email.includes("duplicate")) {
        return apiErrorResponse("CONFLICT", "An account already exists for this email.", 409)
      }

      currentUser = toApiUser(email, {
        name: `${body.firstName?.trim() ?? ""} ${body.lastName?.trim() ?? ""}`.trim() || "API Register User",
        role: body.role ?? null,
      })

      return apiSuccessResponse({ user: { ...currentUser } }, { status: 201 })
    }

    if (url.pathname === "/api/auth/logout" && (requestMethod ?? "GET") === "POST") {
      currentUser = null

      return apiSuccessResponse({ loggedOut: true as const })
    }

    if (url.pathname === "/api/auth/me" && (requestMethod ?? "GET") === "GET") {
      return apiSuccessResponse({ user: currentUser ? { ...currentUser } : null })
    }

    if (url.pathname === "/api/cart") {
      const method = requestMethod ?? "GET"

      if (method === "GET") {
        return apiSuccessResponse(cartPayload(cartItems))
      }

      if (method === "DELETE") {
        cartItems.splice(0, cartItems.length)

        return apiSuccessResponse(cartPayload(cartItems))
      }
    }

    if (url.pathname === "/api/auth/role" && (requestMethod ?? "GET") === "PATCH") {
      const body = (await readRequestBody()) as { role?: string }
      if (!body.role || !["buyer", "seller"].includes(body.role)) {
        return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
          role: "Role must be buyer or seller.",
        })
      }
      currentUser = {
        ...(currentUser ?? toApiUser("buyer@example.test", { name: "API Role User" })),
        role: body.role as ApiUser["role"],
        updatedAt: "2026-05-05T00:00:00.000Z",
      }

      return apiSuccessResponse({ user: { ...currentUser } })
    }

    if (url.pathname === "/api/cart/items") {
      const method = requestMethod ?? "GET"

      if (method === "POST") {
        const body = (await readRequestBody()) as {
          productId?: string
          quantity?: number
        }
        const quantity = body.quantity

        if (!Number.isInteger(quantity) || !quantity || quantity <= 0) {
          return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
            quantity: "Quantity must be a positive whole number.",
          })
        }

        const product = API_PRODUCTS.find((item) => item.id === body.productId)

        if (!product || product.status === "removed") {
          return apiErrorResponse("NOT_FOUND", "Product was not found.", 404)
        }

        const existing = cartItems.find((item) => item.productId === product.id)

        if (existing) {
          existing.quantity += quantity
          existing.lineTotal = existing.quantity * existing.price
          existing.updatedAt = "2026-05-04T00:00:00.000Z"
        } else {
          cartItems.unshift(toApiCartItem(product, quantity))
        }

        return apiSuccessResponse(cartPayload(cartItems), { status: 201 })
      }
    }

    const cartItemMatch = url.pathname.match(/^\/api\/cart\/items\/(.+)$/)

    if (cartItemMatch?.[1]) {
      const productId = decodeURIComponent(cartItemMatch[1])
      const method = requestMethod ?? "GET"
      const existingIndex = cartItems.findIndex((item) => item.productId === productId)

      if (method === "PATCH") {
        const body = (await readRequestBody()) as { quantity?: number }
        const quantity = body.quantity

        if (!Number.isInteger(quantity) || quantity === undefined || quantity < 0) {
          return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
            quantity: "Quantity must be a non-negative whole number.",
          })
        }

        if (existingIndex === -1) {
          return apiErrorResponse("NOT_FOUND", "Cart item was not found.", 404)
        }

        if (quantity === 0) {
          cartItems.splice(existingIndex, 1)
        } else {
          cartItems[existingIndex] = {
            ...cartItems[existingIndex]!,
            quantity,
            lineTotal: cartItems[existingIndex]!.price * quantity,
            updatedAt: "2026-05-04T00:00:00.000Z",
          }
        }

        return apiSuccessResponse(cartPayload(cartItems))
      }

      if (method === "DELETE") {
        if (existingIndex !== -1) {
          cartItems.splice(existingIndex, 1)
        }

        return apiSuccessResponse(cartPayload(cartItems))
      }
    }

    if (url.pathname === "/api/seller/products") {
      const method = requestMethod ?? "GET"

      if (method === "GET") {
        return apiSuccessResponse<{ products: ApiProduct[] }>({
          products: sellerProducts
            .filter((product) => product.status !== "removed")
            .map((product) => ({ ...product })),
        })
      }

      if (method === "POST") {
        const body = (await readRequestBody()) as Partial<ApiProduct> & {
          imageUrl?: string
          categoryId?: string
          originalPrice?: number
          discountedPrice?: number
          quantity?: number
          pickupAddress?: string
        }
        const category = API_CATEGORIES.find((item) => item.id === body.categoryId) ?? API_CATEGORIES[0]!
        const originalPrice = body.originalPrice ?? 100
        const discountedPrice = body.discountedPrice ?? 75
        const product: ApiProduct = {
          id: "api-created-product",
          name: body.name ?? "API Created Product",
          brand: body.brand ?? "API Brand",
          category: category.label,
          originalPrice,
          discountedPrice,
          discountPercent: Math.round((1 - discountedPrice / originalPrice) * 100),
          image: body.imageUrl ?? "/placeholder.svg",
          quantity: body.quantity ?? 1,
          unit: body.unit ?? "packs",
          expiryDate: String(body.expiryDate ?? "2030-05-12T00:00:00.000Z"),
          daysUntilExpiry: 14,
          seller: sellerProfile.businessName,
          sellerRating: sellerProfile.rating,
          location: body.pickupAddress ?? sellerProfile.address,
          barangay: sellerProfile.barangay || "",
          pickupHours: body.pickupHours ?? "7:00 AM - 5:00 PM",
          description: body.description ?? "API-created product.",
          weight: body.weight ?? "500g",
          packSize: body.packSize ?? "1 pack",
          isHot: false,
          isFeatured: false,
          sellerId: sellerProfile.id,
          categoryId: category.id,
          status: "active",
          createdAt: "2026-05-04T00:00:00.000Z",
          updatedAt: "2026-05-04T00:00:00.000Z",
        }

        sellerProducts.unshift(product)

        return apiSuccessResponse<{ product: ApiProduct }>({ product }, { status: 201 })
      }
    }

    const sellerProductMatch = url.pathname.match(/^\/api\/seller\/products\/(.+)$/)

    if (sellerProductMatch?.[1]) {
      const productId = decodeURIComponent(sellerProductMatch[1])
      const method = requestMethod ?? "GET"
      const existing = sellerProducts.find((product) => product.id === productId)

      if (!existing) {
        return apiErrorResponse("NOT_FOUND", "Product was not found.", 404)
      }

      if (method === "PATCH") {
        const body = (await readRequestBody()) as Partial<ApiProduct> & {
          categoryId?: string
          imageUrl?: string
          originalPrice?: number
          discountedPrice?: number
          quantity?: number
          pickupAddress?: string
        }
        const category =
          body.categoryId === undefined
            ? undefined
            : API_CATEGORIES.find((item) => item.id === body.categoryId)
        const originalPrice = body.originalPrice ?? existing.originalPrice
        const discountedPrice = body.discountedPrice ?? existing.discountedPrice
        const updated: ApiProduct = {
          ...existing,
          ...body,
          category: category?.label ?? existing.category,
          categoryId: category?.id ?? existing.categoryId,
          originalPrice,
          discountedPrice,
          discountPercent: Math.round((1 - discountedPrice / originalPrice) * 100),
          image: body.imageUrl ?? existing.image,
          quantity: body.quantity ?? existing.quantity,
          location: body.pickupAddress ?? existing.location,
          updatedAt: "2026-05-04T00:00:00.000Z",
        }
        const index = sellerProducts.findIndex((product) => product.id === productId)

        sellerProducts[index] = updated

        return apiSuccessResponse<{ product: ApiProduct }>({ product: updated })
      }

      if (method === "DELETE") {
        const removed: ApiProduct = { ...existing, status: "removed" }
        const index = sellerProducts.findIndex((product) => product.id === productId)

        sellerProducts.splice(index, 1)

        return apiSuccessResponse<{ product: ApiProduct }>({ product: removed })
      }
    }

    if (url.pathname === "/api/orders") {
      const method = requestMethod ?? "GET"

      if (method === "POST") {
        if (cartItems.length === 0) {
          return apiErrorResponse("CONFLICT", "Your cart is empty.", 409)
        }

        const body = (await readRequestBody()) as { pickupDate?: string; pickupTime?: string }
        const totalAmount = cartItems.reduce((sum, item) => sum + item.lineTotal, 0)
        const productLabel =
          cartItems.length === 1
            ? cartItems[0]?.name ?? "FOOD4ALL Reservation"
            : `${cartItems.length} reserved products`
        const orderId = `ORD-MOCK-${Date.now()}`

        const order: ApiOrder = {
          id: orderId,
          buyer: "FOOD4ALL Buyer",
          buyerId: "mock-buyer",
          sellerId: "mock-seller",
          product: productLabel,
          quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          total: totalAmount,
          status: "reserved",
    pickupDate: body.pickupDate ?? new Date().toISOString(),
    pickupTime: body.pickupTime ?? "2:00 PM",
    pickupCode: "F4A-MOCK",
    pickupLocation: cartItems[0]?.location ?? "Pickup location unavailable",
    items: cartItems.map((item) => ({
            id: `oi-${item.productId}`,
            orderId,
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            originalUnitPrice: item.originalPrice,
            subtotal: item.lineTotal,
          })),
          createdAt: "2026-05-04T00:00:00.000Z",
          updatedAt: "2026-05-04T00:00:00.000Z",
        }

        buyerOrders.unshift(order)
        cartItems.splice(0, cartItems.length)

        return apiSuccessResponse({ order }, { status: 201 })
      }

      if (method === "GET") {
        return apiSuccessResponse({ orders: buyerOrders.map((order) => ({ ...order })) })
      }
    }

    const buyerOrderDetailMatch = url.pathname.match(/^\/api\/orders\/(.+)$/)

    if (buyerOrderDetailMatch?.[1] && (requestMethod ?? "GET") === "GET") {
      const orderId = decodeURIComponent(buyerOrderDetailMatch[1])
      const order = buyerOrders.find((item) => item.id === orderId)

      if (!order) {
        return apiErrorResponse("NOT_FOUND", "Order was not found.", 404)
      }

      return apiSuccessResponse({ order: { ...order } })
    }

    if (url.pathname === "/api/seller/orders") {
      const orders = sellerOrders.map((order) => toApiOrder(order))
      return apiSuccessResponse({ orders })
    }

    if (url.pathname === "/api/seller/dashboard" && (requestMethod ?? "GET") === "GET") {
      const pendingOrders = sellerOrders.filter(
        (order) => order.status === "reserved" || order.status === "preparing",
      )
      const completedOrders = sellerOrders.filter((order) => order.status === "completed")
      const expiringProducts = sellerProducts
        .filter((product) => product.status !== "removed" && product.daysUntilExpiry <= 14)
        .slice(0, 3)
        .map((product) => ({ ...product }))

      const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0)

      return apiSuccessResponse({
        metrics: [
          {
            key: "revenue",
            label: "Today's Revenue",
            value: `?${revenue.toFixed(2)}`,
            trend: "+0.0% this week",
          },
          {
            key: "pendingOrders",
            label: "Pending Orders",
            value: pendingOrders.length.toString(),
            trend: "Needs action",
          },
          {
            key: "expiringItems",
            label: "Items Expiring",
            value: expiringProducts.length.toString(),
            trend: "Within 14 days",
          },
          {
            key: "totalSales",
            label: "Total Sales",
            value: completedOrders.length.toString(),
            trend: "Completed orders",
          },
        ],
        pendingOrders: pendingOrders.slice(0, 5).map((order) => toApiOrder(order)),
        expiringProducts,
      })
    }

    if (url.pathname === "/api/seller/reports" && (requestMethod ?? "GET") === "GET") {
      return apiSuccessResponse({
        revenue: { ...API_SELLER_REPORTS.revenue },
        waste: { ...API_SELLER_REPORTS.waste },
        weeklyBreakdown: API_SELLER_REPORTS.weeklyBreakdown.map((day) => ({ ...day })),
        topProducts: API_SELLER_REPORTS.topProducts.map((product) => ({ ...product })),
      })
    }

    if (url.pathname === "/api/seller/profile") {
      const method = requestMethod ?? "GET"

      if (method === "GET") {
        return apiSuccessResponse({ seller: { ...sellerProfile } })
      }

      if (method === "PATCH") {
        const body = (await readRequestBody()) as Partial<ApiSellerProfile>

        if (body.businessName !== undefined && !body.businessName.trim()) {
          return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
            businessName: "Business name is required.",
          })
        }

        sellerProfile = {
          ...sellerProfile,
          ...body,
          updatedAt: "2026-05-05T00:00:00.000Z",
        }

        return apiSuccessResponse({ seller: { ...sellerProfile } })
      }
    }

    const sellerOrderStatusMatch = url.pathname.match(/^\/api\/seller\/orders\/(.+)\/status$/)

    if (sellerOrderStatusMatch?.[1] && (requestMethod ?? "GET") === "PATCH") {
      const orderId = decodeURIComponent(sellerOrderStatusMatch[1])
      const body = (await readRequestBody()) as { status?: string }

      const existingOrder = sellerOrders.find((order) => order.id === orderId)

      if (!existingOrder) {
        return apiErrorResponse("NOT_FOUND", "Order was not found.", 404)
      }

      if (!body.status || !["preparing", "ready", "cancelled"].includes(body.status)) {
        return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
          status: "Invalid status transition.",
        })
      }

      if (existingOrder.status === "completed" || existingOrder.status === "cancelled") {
        return apiErrorResponse("CONFLICT", "Order status cannot be changed from completed or cancelled.", 409)
      }

      if (existingOrder.status === "ready" && body.status !== "cancelled") {
        return apiErrorResponse("CONFLICT", "Ready orders can only be completed via pickup verification or cancelled.", 409)
      }

      const updatedOrder: Order = {
        ...existingOrder,
        status: body.status as Order["status"],
      }
      const index = sellerOrders.findIndex((order) => order.id === orderId)

      if (index !== -1) {
        sellerOrders[index] = updatedOrder
      }

      return apiSuccessResponse({ order: toApiOrder(updatedOrder) })
    }

    if (url.pathname === "/api/pickup/verify") {
      const body = (await readRequestBody()) as { code?: string }
      const code = body.code?.trim().toUpperCase() ?? ""

      if (!code) {
        return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
          code: "Pickup code is required.",
        })
      }

      if (!/^F4A-[A-Z0-9]{4}$/.test(code)) {
        return apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
          code: "Enter a valid pickup code.",
        })
      }

      const order = sellerOrders.find((item) => item.pickupCode.toUpperCase() === code)

      if (!order) {
        return apiErrorResponse("NOT_FOUND", "Pickup code was not found.", 404)
      }

      if (order.status !== "ready") {
        return apiErrorResponse("CONFLICT", "Order is not ready for pickup.", 409)
      }

      const verifiedOrder: Order = { ...order, status: "completed" }
      const index = sellerOrders.findIndex((item) => item.id === order.id)

      if (index !== -1) {
        sellerOrders[index] = verifiedOrder
      }

      return apiSuccessResponse({
        code,
        orderId: order.id,
        status: "valid",
        message: "Pickup verified successfully.",
        order: {
          ...toApiOrder(verifiedOrder),
          completedAt: "2026-05-04T00:00:00.000Z",
        },
      })
    }
    if (url.pathname === "/api/categories") {
      return apiSuccessResponse<{ categories: ApiCategory[] }>({
        categories: API_CATEGORIES.map((category) => ({ ...category })),
      })
    }

    if (url.pathname === "/api/products") {
      const products = filterProducts(url)

      return apiSuccessResponse<{
        products: ApiProduct[]
        pagination: { page: number; pageSize: number; total: number }
      }>({
        products: products.map((product) => ({ ...product })),
        pagination: {
          page: Number(url.searchParams.get("page") ?? 1),
          pageSize: Number(url.searchParams.get("pageSize") ?? 20),
          total: products.length,
        },
      })
    }

    const productMatch = url.pathname.match(/^\/api\/products\/(.+)$/)

    if (productMatch?.[1]) {
      const productId = decodeURIComponent(productMatch[1])
      const product = API_PRODUCTS.find((item) => item.id === productId)

      if (product) {
        return apiSuccessResponse<{ product: ApiProduct }>({
          product: { ...product },
        })
      }

      return apiErrorResponse("NOT_FOUND", "Product was not found.", 404)
    }

    return apiErrorResponse("NOT_FOUND", `No mocked API route for ${url.pathname}.`, 404)
  })

  vi.stubGlobal("fetch", fetchMock)

  return fetchMock
}

export function toApiCategory(category: Category): ApiCategory {
  return {
    ...category,
    slug: category.id,
    sortOrder: 10,
  }
}

export function toApiProduct(product: Product): ApiProduct {
  return {
    ...product,
    sellerId: slugify(product.seller),
    categoryId: slugify(product.category),
    status: "active",
    createdAt: "2026-05-04T00:00:00.000Z",
    updatedAt: "2026-05-04T00:00:00.000Z",
  }
}
