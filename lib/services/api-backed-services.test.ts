import { afterEach, describe, expect, it, vi } from "vitest"

import type {
  ApiCartItem,
  ApiOrder,
  ApiProduct,
  ApiSellerProfile,
  ApiSellerReportTopProduct,
  ApiUser,
  PickupVerificationResult,
} from "@/lib/api-contracts"
import type { ProductInput } from "@/lib/types"
import {
  API_PRODUCTS,
  apiSuccessResponse,
  installMarketplaceFetchMock,
} from "@/test/api-fetch-mock"
import { getCurrentUser, login, logout, register } from "./auth-service"
import { getCategories } from "./category-service"
import {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "./cart-service"
import {
  getFeaturedProducts,
  getExpiringProducts,
  getHotProducts,
  getProductById,
  getProducts,
  getProductsByCategory,
  searchProducts,
} from "./product-service"
import { verifyPickupCode } from "./order-service"
import {
  createProduct,
  deleteProduct,
  getSellerProducts,
  getSellerProfile,
  getSellerReports,
  updateProduct,
  updateSellerProfile,
} from "./seller-service"

const API_USER: ApiUser = {
  id: "user-1",
  name: "Maria Santos",
  email: "maria@example.test",
  role: null,
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
}

const API_PRODUCT: ApiProduct = {
  id: "api-product-1",
  name: "API Seller Hotdogs",
  brand: "Purefoods",
  category: "Hotdogs",
  originalPrice: 300,
  discountedPrice: 180,
  discountPercent: 40,
  image: "/images/hotdogs.jpg",
  quantity: 18,
  unit: "packs",
  expiryDate: "2030-06-01T00:00:00.000Z",
  daysUntilExpiry: 14,
  seller: "Magsaysay Meat Depot",
  sellerRating: 4.8,
  location: "Magsaysay Market, Davao City",
  barangay: "Poblacion District",
  pickupHours: "7:00 AM - 5:00 PM",
  description: "API product.",
  weight: "500g",
  packSize: "1 pack = 20 pcs",
  isHot: false,
  isFeatured: false,
  sellerId: "seller-magsaysay-meat-depot",
  categoryId: "hotdogs",
  status: "active",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
}

const API_SELLER_PROFILE: ApiSellerProfile = {
  id: "seller-profile-1",
  userId: "seller-user-1",
  businessName: "API Magsaysay Meat Depot",
  email: "seller@example.test",
  address: "API Magsaysay Market, Davao City",
  barangay: "Poblacion District",
  contactNumber: "09170000002",
  rating: 4.8,
  isOpen: true,
  verificationStatus: "verified",
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
}

const API_CART_ITEM: ApiCartItem = {
  id: "p1",
  productId: "p1",
  name: "Purefoods Tender Juicy Hotdog",
  price: 185,
  originalPrice: 285,
  quantity: 2,
  image: "/images/hotdogs.jpg",
  seller: "Magsaysay Meat Depot",
  location: "Magsaysay Market, Davao City",
  lineTotal: 370,
  updatedAt: "2026-05-04T00:00:00.000Z",
}

const API_ORDER: ApiOrder = {
  id: "ORD-API-VERIFY",
  buyer: "Maria Santos",
  buyerId: "buyer-1",
  sellerId: "seller-1",
  product: "API Tender Juicy Hotdog",
  quantity: 2,
  total: 370,
  status: "completed",
  pickupDate: "2030-06-01T00:00:00.000Z",
  pickupTime: "2:00 PM",
  pickupCode: "F4A-API1",
  items: [
    {
      id: "order-item-1",
      orderId: "ORD-API-VERIFY",
      productId: "p1",
      productName: "API Tender Juicy Hotdog",
      quantity: 2,
      unitPrice: 185,
      originalUnitPrice: 285,
      subtotal: 370,
    },
  ],
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
  completedAt: "2026-05-04T00:00:00.000Z",
}

const SELLER_PRODUCT_INPUT: ProductInput = {
  name: "API Seller Hotdogs",
  brand: "Purefoods",
  category: "Hotdogs",
  originalPrice: 300,
  discountedPrice: 180,
  image: "/images/hotdogs.jpg",
  quantity: 18,
  unit: "packs",
  expiryDate: "2030-06-01",
  seller: "Magsaysay Meat Depot",
  location: "Magsaysay Market, Davao City",
  barangay: "Poblacion District",
  pickupHours: "7:00 AM - 5:00 PM",
  description: "API product.",
  weight: "500g",
  packSize: "1 pack = 20 pcs",
}

afterEach(() => {
  vi.unstubAllGlobals()
})

function lastFetchInit(fetchMock: ReturnType<typeof vi.fn>) {
  const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>

  return calls.at(-1)?.[1] as RequestInit
}

describe("API-backed auth service", () => {
  it("calls the backend register endpoint and returns the domain user", async () => {
    const fetchMock = vi.fn(async () =>
      apiSuccessResponse<{ user: ApiUser }>({ user: API_USER }, { status: 201 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const user = await register({
      firstName: "Maria",
      lastName: "Santos",
      phone: "+63 912 345 6789",
      email: "maria@example.test",
      password: "password123",
    })
    const init = lastFetchInit(fetchMock)

    expect(user).toEqual({
      id: "user-1",
      name: "Maria Santos",
      email: "maria@example.test",
      role: null,
    })
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", expect.any(Object))
    expect(init.method).toBe("POST")
    expect(JSON.parse(String(init.body))).toEqual({
      firstName: "Maria",
      lastName: "Santos",
      phone: "+63 912 345 6789",
      email: "maria@example.test",
      password: "password123",
    })
  })

  it("calls the backend login, logout, and current-user endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiSuccessResponse<{ user: ApiUser }>({ user: API_USER }))
      .mockResolvedValueOnce(apiSuccessResponse<{ loggedOut: true }>({ loggedOut: true }))
      .mockResolvedValueOnce(apiSuccessResponse<{ user: ApiUser | null }>({ user: null }))
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      login({ email: "maria@example.test", password: "password123" }),
    ).resolves.toMatchObject({
      email: "maria@example.test",
    })
    await expect(logout()).resolves.toBeUndefined()
    await expect(getCurrentUser()).resolves.toBeNull()

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/auth/login", expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/logout", expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/auth/me", expect.any(Object))
    const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>

    expect(calls[0]?.[1]?.method).toBe("POST")
    expect(calls[1]?.[1]?.method).toBe("POST")
    expect(calls[2]?.[1]?.method).toBe("GET")
  })
})

describe("API-backed category service", () => {
  it("calls the backend categories endpoint", async () => {
    const fetchMock = installMarketplaceFetchMock()

    const categories = await getCategories()

    expect(fetchMock).toHaveBeenCalledWith("/api/categories", expect.any(Object))
    expect(categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "hotdogs",
          label: "Hotdogs",
        }),
      ]),
    )
  })
})

describe("API-backed product service", () => {
  it("calls product listing endpoints for list and filtered reads", async () => {
    const fetchMock = installMarketplaceFetchMock()

    await expect(getProducts()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "p1",
          name: "Purefoods Tender Juicy Hotdog",
        }),
      ]),
    )
    await expect(searchProducts("tocino")).resolves.toEqual([
      expect.objectContaining({ id: "p2" }),
    ])
    await expect(getProductsByCategory("hotdogs")).resolves.toEqual([
      expect.objectContaining({ id: "p1" }),
    ])
    await expect(getFeaturedProducts()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ isFeatured: true })]),
    )
    await expect(getHotProducts()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ isHot: true })]),
    )

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      "/api/products",
      "/api/products?search=tocino",
      "/api/products?categoryId=hotdogs",
      "/api/products?featured=true",
      "/api/products?hot=true",
    ])
  })

  it("calls product detail endpoint and preserves null for missing products", async () => {
    const fetchMock = installMarketplaceFetchMock()

    await expect(getProductById("p1")).resolves.toMatchObject({
      id: "p1",
      name: "Purefoods Tender Juicy Hotdog",
    })
    await expect(getProductById("missing-product")).resolves.toBeNull()

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      "/api/products/p1",
      "/api/products/missing-product",
    ])
  })

  it("passes the expiring-products filter to the backend", async () => {
    const fetchMock = installMarketplaceFetchMock()
    const expiringProducts = await getExpiringProducts(14)

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products?maxDaysUntilExpiry=14",
      expect.any(Object),
    )
    expect(expiringProducts.every((product) => product.daysUntilExpiry <= 14)).toBe(true)
    expect(expiringProducts.length).toBeLessThan(API_PRODUCTS.length)
  })
})

describe("API-backed seller product mutation service", () => {
  it("calls the backend seller product listing endpoint", async () => {
    const fetchMock = installMarketplaceFetchMock()

    await expect(getSellerProducts()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "p1",
          name: "Purefoods Tender Juicy Hotdog",
        }),
      ]),
    )

    expect(fetchMock).toHaveBeenCalledWith("/api/seller/products", expect.any(Object))
  })

  it("calls the backend create-product endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      apiSuccessResponse<{ product: ApiProduct }>({ product: API_PRODUCT }, { status: 201 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(createProduct(SELLER_PRODUCT_INPUT)).resolves.toMatchObject({
      id: "api-product-1",
      name: "API Seller Hotdogs",
    })

    const init = lastFetchInit(fetchMock)

    expect(fetchMock).toHaveBeenCalledWith("/api/seller/products", expect.any(Object))
    expect(init.method).toBe("POST")
    expect(JSON.parse(String(init.body))).toMatchObject({
      name: "API Seller Hotdogs",
      categoryId: "Hotdogs",
      originalPrice: 300,
      discountedPrice: 180,
      quantity: 18,
      imageUrl: "/images/hotdogs.jpg",
    })
  })

  it("calls the backend update-product endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      apiSuccessResponse<{ product: ApiProduct }>({
        product: {
          ...API_PRODUCT,
          id: "p7",
          name: "Updated API Seller Bundle",
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(updateProduct("p7", { name: "Updated API Seller Bundle" })).resolves.toMatchObject({
      id: "p7",
      name: "Updated API Seller Bundle",
    })

    const init = lastFetchInit(fetchMock)

    expect(fetchMock).toHaveBeenCalledWith("/api/seller/products/p7", expect.any(Object))
    expect(init.method).toBe("PATCH")
    expect(JSON.parse(String(init.body))).toMatchObject({
      name: "Updated API Seller Bundle",
    })
  })

  it("calls the backend delete-product endpoint", async () => {
    const fetchMock = vi.fn(async () =>
      apiSuccessResponse<{ product: ApiProduct }>({
        product: {
          ...API_PRODUCT,
          id: "p7",
          status: "removed",
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(deleteProduct("p7")).resolves.toBeUndefined()

    const init = lastFetchInit(fetchMock)

    expect(fetchMock).toHaveBeenCalledWith("/api/seller/products/p7", expect.any(Object))
    expect(init.method).toBe("DELETE")
  })
})

describe("API-backed seller reports service", () => {
  it("calls the backend seller reports endpoint", async () => {
    const topProduct: ApiSellerReportTopProduct = {
      ...API_PRODUCT,
      soldQuantity: 4,
      revenue: 720,
    }
    const fetchMock = vi.fn(async () =>
      apiSuccessResponse({
        revenue: {
          weekly: 720,
          totalOrders: 2,
          recoveryEarnings: 1440,
        },
        waste: {
          reducedKg: 0,
          mealsSavedEstimate: 0,
        },
        weeklyBreakdown: [
          { day: "Mon", sales: 720, orders: 2 },
        ],
        topProducts: [topProduct],
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(getSellerReports()).resolves.toMatchObject({
      revenue: {
        weekly: 720,
        totalOrders: 2,
        recoveryEarnings: 1440,
      },
      waste: {
        reducedKg: 0,
        mealsSavedEstimate: 0,
      },
      weeklyBreakdown: [
        { day: "Mon", sales: 720, orders: 2 },
      ],
      topProducts: [
        expect.objectContaining({
          id: "api-product-1",
          soldQuantity: 4,
          revenue: 720,
        }),
      ],
    })
    expect(fetchMock).toHaveBeenCalledWith("/api/seller/reports", expect.any(Object))
  })
})

describe("API-backed seller profile service", () => {
  it("calls the backend seller profile endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiSuccessResponse({ seller: API_SELLER_PROFILE }))
      .mockResolvedValueOnce(
        apiSuccessResponse({
          seller: {
            ...API_SELLER_PROFILE,
            isOpen: false,
          },
        }),
      )
    vi.stubGlobal("fetch", fetchMock)

    await expect(getSellerProfile()).resolves.toMatchObject({
      id: "seller-profile-1",
      businessName: "API Magsaysay Meat Depot",
      email: "seller@example.test",
      isOpen: true,
      verificationStatus: "verified",
    })
    await expect(updateSellerProfile({ isOpen: false })).resolves.toMatchObject({
      id: "seller-profile-1",
      isOpen: false,
    })

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/seller/profile", expect.any(Object))
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/seller/profile", expect.any(Object))
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).method).toBe("PATCH")
    expect(JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body))).toEqual({
      isOpen: false,
    })
  })
})

describe("API-backed cart service", () => {
  it("calls the backend cart endpoints and maps cart items", async () => {
    const cartPayload = {
      items: [API_CART_ITEM],
      itemCount: 2,
      subtotal: 370,
      total: 370,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiSuccessResponse(cartPayload))
      .mockResolvedValueOnce(apiSuccessResponse(cartPayload, { status: 201 }))
      .mockResolvedValueOnce(
        apiSuccessResponse({
          ...cartPayload,
          items: [{ ...API_CART_ITEM, quantity: 3, lineTotal: 555 }],
          itemCount: 3,
          subtotal: 555,
          total: 555,
        }),
      )
      .mockResolvedValueOnce(apiSuccessResponse({ items: [], itemCount: 0, subtotal: 0, total: 0 }))
      .mockResolvedValueOnce(apiSuccessResponse({ items: [], itemCount: 0, subtotal: 0, total: 0 }))
    vi.stubGlobal("fetch", fetchMock)

    await expect(getCart()).resolves.toEqual([
      expect.objectContaining({
        id: "p1",
        name: "Purefoods Tender Juicy Hotdog",
        quantity: 2,
      }),
    ])
    await expect(addToCart("p1", 2)).resolves.toHaveLength(1)
    await expect(updateCartItem("p1", 3)).resolves.toEqual([
      expect.objectContaining({
        id: "p1",
        quantity: 3,
      }),
    ])
    await expect(removeFromCart("p1")).resolves.toEqual([])
    await expect(clearCart()).resolves.toEqual([])

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      "/api/cart",
      "/api/cart/items",
      "/api/cart/items/p1",
      "/api/cart/items/p1",
      "/api/cart",
    ])
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).method).toBe("POST")
    expect(JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit).body))).toEqual({
      productId: "p1",
      quantity: 2,
    })
    expect((fetchMock.mock.calls[2]?.[1] as RequestInit).method).toBe("PATCH")
    expect(JSON.parse(String((fetchMock.mock.calls[2]?.[1] as RequestInit).body))).toEqual({
      quantity: 3,
    })
    expect((fetchMock.mock.calls[3]?.[1] as RequestInit).method).toBe("DELETE")
    expect((fetchMock.mock.calls[4]?.[1] as RequestInit).method).toBe("DELETE")
  })
})

describe("API-backed pickup verification service", () => {
  it("calls the backend pickup verification endpoint and maps the verified order", async () => {
    const fetchMock = vi.fn(async () =>
      apiSuccessResponse<PickupVerificationResult>({
        code: "F4A-API1",
        orderId: API_ORDER.id,
        status: "valid",
        message: "Pickup verified successfully.",
        order: API_ORDER,
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(verifyPickupCode("F4A-API1")).resolves.toMatchObject({
      code: "F4A-API1",
      orderId: "ORD-API-VERIFY",
      status: "valid",
      order: {
        id: "ORD-API-VERIFY",
        buyer: "Maria Santos",
        product: "API Tender Juicy Hotdog",
        status: "completed",
      },
    })

    const init = lastFetchInit(fetchMock)

    expect(fetchMock).toHaveBeenCalledWith("/api/pickup/verify", expect.any(Object))
    expect(init.method).toBe("POST")
    expect(JSON.parse(String(init.body))).toEqual({
      code: "F4A-API1",
    })
  })
})
