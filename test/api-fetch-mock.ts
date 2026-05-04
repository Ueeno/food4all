import { vi } from "vitest"

import type { ApiCartItem, ApiCategory, ApiErrorCode, ApiProduct } from "@/lib/api-contracts"
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data"
import type { Category, Product } from "@/lib/types"

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
  const cartItems: ApiCartItem[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = parseFetchUrl(input)
    const requestMethod = input instanceof Request ? input.method : init?.method
    const requestBody = input instanceof Request ? undefined : init?.body

    async function readRequestBody() {
      if (input instanceof Request) return input.json() as Promise<unknown>
      if (typeof requestBody === "string") return JSON.parse(requestBody) as unknown
      return {}
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
          seller: "Magsaysay Meat Depot",
          sellerRating: 4.8,
          location: body.pickupAddress ?? "Magsaysay Market, Davao City",
          barangay: "",
          pickupHours: body.pickupHours ?? "7:00 AM - 5:00 PM",
          description: body.description ?? "API-created product.",
          weight: body.weight ?? "500g",
          packSize: body.packSize ?? "1 pack",
          isHot: false,
          isFeatured: false,
          sellerId: "seller-magsaysay-meat-depot",
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

        const order = {
          id: `ORD-MOCK-${Date.now()}`,
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
          items: cartItems.map((item) => ({
            id: `oi-${item.productId}`,
            orderId: `ORD-MOCK-${Date.now()}`,
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

        cartItems.splice(0, cartItems.length)

        return apiSuccessResponse({ order }, { status: 201 })
      }

      if (method === "GET") {
        return apiSuccessResponse({ orders: [] })
      }
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
