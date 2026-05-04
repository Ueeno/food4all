import { describe, expect, it, beforeAll, beforeEach, afterAll } from "vitest"

import { GET as getCategories } from "@/app/api/categories/route"
import { GET as getHealth } from "@/app/api/health/route"
import { GET as getProductById } from "@/app/api/products/[id]/route"
import { GET as getProducts } from "@/app/api/products/route"
import { POST as login } from "@/app/api/auth/login/route"
import { GET as me } from "@/app/api/auth/me/route"
import { POST as logout } from "@/app/api/auth/logout/route"
import { POST as register } from "@/app/api/auth/register/route"
import {
  GET as getOrders,
  POST as createOrder,
} from "@/app/api/orders/route"
import {
  DELETE as clearCart,
  GET as getCart,
} from "@/app/api/cart/route"
import { POST as addCartItem } from "@/app/api/cart/items/route"
import {
  DELETE as deleteCartItem,
  PATCH as updateCartItem,
} from "@/app/api/cart/items/[productId]/route"
import {
  GET as listSellerProducts,
  POST as createSellerProduct,
} from "@/app/api/seller/products/route"
import {
  DELETE as deleteSellerProduct,
  PATCH as updateSellerProduct,
} from "@/app/api/seller/products/[id]/route"
import { SESSION_COOKIE_NAME } from "@/lib/api/auth"
import {
  resetTestDatabase,
  setupTestDatabase,
  teardownTestDatabase,
  TEST_PASSWORD,
} from "@/test/test-db"

function getRequest(path: string, cookie?: string) {
  return new Request(`http://localhost${path}`, {
    headers: cookie ? { cookie } : undefined,
  })
}

function jsonRequest(path: string, body: unknown, cookie?: string, method = "POST") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  })
}

function deleteRequest(path: string, cookie?: string) {
  return new Request(`http://localhost${path}`, {
    method: "DELETE",
    headers: cookie ? { cookie } : undefined,
  })
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

function getSessionCookie(response: Response) {
  const setCookie = response.headers.get("set-cookie")

  expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`)

  return setCookie?.split(";")[0] ?? ""
}

async function loginAs(email: string) {
  const response = await login(
    jsonRequest("/api/auth/login", {
      email,
      password: TEST_PASSWORD,
    }),
  )

  return getSessionCookie(response)
}

function sellerProductContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  }
}

function cartItemContext(productId: string) {
  return {
    params: Promise.resolve({ productId }),
  }
}

function validSellerProductInput(overrides: Record<string, unknown> = {}) {
  return {
    name: "Task 018 SQL Hotdog Bundle",
    brand: "Purefoods",
    categoryId: "hotdogs",
    originalPrice: 300,
    discountedPrice: 180,
    quantity: 18,
    unit: "packs",
    expiryDate: "2030-06-01T00:00:00.000Z",
    pickupAddress: "Magsaysay Market, Davao City",
    pickupBarangay: "Poblacion District",
    pickupHours: "7:00 AM - 5:00 PM",
    description: "SQL-backed seller product mutation test item.",
    weight: "500g",
    packSize: "1 pack = 20 pcs",
    imageUrl: "/images/hotdogs.jpg",
    ...overrides,
  }
}

describe("backend route handlers", () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await resetTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  it("GET /api/health returns a shared success envelope", async () => {
    const response = getHealth()

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        status: "ok",
        service: "food4all-api",
      },
    })
  })

  it("GET /api/categories returns seeded categories", async () => {
    const response = await getCategories()
    const body = await responseJson(response)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      data: {
        categories: [
          expect.objectContaining({ id: "hotdogs", label: "Hotdogs", sortOrder: 10 }),
          expect.objectContaining({ id: "frozen-foods", label: "Frozen Foods", sortOrder: 20 }),
        ],
      },
    })
  })

  it("GET /api/products returns public seeded products only", async () => {
    const response = await getProducts(getRequest("/api/products"))
    const body = await responseJson(response)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      data: {
        products: [
          expect.objectContaining({
            id: "test-product-active",
            name: "Integration Tender Juicy Hotdog",
            category: "Hotdogs",
            discountedPrice: 185,
          }),
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 1,
        },
      },
    })
  })

  it("GET /api/products/[id] returns one active product", async () => {
    const response = await getProductById(getRequest("/api/products/test-product-active"), {
      params: Promise.resolve({ id: "test-product-active" }),
    })
    const body = await responseJson(response)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      data: {
        product: expect.objectContaining({
          id: "test-product-active",
          seller: "Integration Meat Depot",
          status: "active",
        }),
      },
    })
  })

  it("GET /api/products/[id] returns 404 for a missing product", async () => {
    const response = await getProductById(getRequest("/api/products/missing-product"), {
      params: Promise.resolve({ id: "missing-product" }),
    })

    expect(response.status).toBe(404)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "NOT_FOUND",
      },
    })
  })

  it("POST /api/auth/register succeeds for a valid buyer", async () => {
    const response = await register(
      jsonRequest("/api/auth/register", {
        firstName: "Maria",
        lastName: "Santos",
        email: "MARIA@example.test",
        password: TEST_PASSWORD,
        role: "buyer",
      }),
    )
    const body = await responseJson(response)

    expect(response.status).toBe(201)
    expect(response.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`)
    expect(body).toMatchObject({
      ok: true,
      data: {
        user: expect.objectContaining({
          email: "maria@example.test",
          name: "Maria Santos",
          role: "buyer",
        }),
      },
    })
    expect(JSON.stringify(body)).not.toContain("passwordHash")
  })

  it("POST /api/auth/register succeeds for a valid seller role", async () => {
    const response = await register(
      jsonRequest("/api/auth/register", {
        firstName: "Sari",
        lastName: "Store",
        email: "seller-role@example.test",
        password: TEST_PASSWORD,
        role: "seller",
      }),
    )

    expect(response.status).toBe(201)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        user: expect.objectContaining({
          email: "seller-role@example.test",
          role: "seller",
        }),
      },
    })
  })

  it("POST /api/auth/register returns conflict for duplicate email", async () => {
    const response = await register(
      jsonRequest("/api/auth/register", {
        firstName: "Test",
        lastName: "Buyer",
        email: "buyer@example.test",
        password: TEST_PASSWORD,
        role: "buyer",
      }),
    )

    expect(response.status).toBe(409)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "CONFLICT",
      },
    })
  })

  it("POST /api/auth/register returns validation errors for invalid input", async () => {
    const response = await register(
      jsonRequest("/api/auth/register", {
        firstName: "",
        lastName: "",
        email: "not-an-email",
        password: "short",
      }),
    )

    expect(response.status).toBe(422)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: {
          firstName: "First name is required.",
          lastName: "Last name is required.",
          email: "Enter a valid email address.",
          password: "Password must be at least 8 characters.",
        },
      },
    })
  })

  it("POST /api/auth/login succeeds for valid credentials", async () => {
    const response = await login(
      jsonRequest("/api/auth/login", {
        email: "buyer@example.test",
        password: TEST_PASSWORD,
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        user: expect.objectContaining({
          email: "buyer@example.test",
          role: "buyer",
        }),
      },
    })
  })

  it("POST /api/auth/login fails for invalid credentials", async () => {
    const response = await login(
      jsonRequest("/api/auth/login", {
        email: "buyer@example.test",
        password: "wrong-password",
      }),
    )

    expect(response.status).toBe(401)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
      },
    })
  })

  it("POST /api/auth/login returns validation errors for missing fields", async () => {
    const response = await login(jsonRequest("/api/auth/login", {}))

    expect(response.status).toBe(422)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: {
          email: "Required",
          password: "Required",
        },
      },
    })
  })

  it("GET /api/auth/me returns the current user when a session cookie is present", async () => {
    const loginResponse = await login(
      jsonRequest("/api/auth/login", {
        email: "buyer@example.test",
        password: TEST_PASSWORD,
      }),
    )
    const cookie = getSessionCookie(loginResponse)
    const response = await me(getRequest("/api/auth/me", cookie))

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        user: expect.objectContaining({
          email: "buyer@example.test",
          role: "buyer",
        }),
      },
    })
  })

  it("GET /api/auth/me returns a null user when unauthenticated", async () => {
    const response = await me(getRequest("/api/auth/me"))

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toEqual({
      ok: true,
      data: {
        user: null,
      },
    })
  })

  it("POST /api/auth/logout revokes the session and clears the cookie", async () => {
    const loginResponse = await login(
      jsonRequest("/api/auth/login", {
        email: "buyer@example.test",
        password: TEST_PASSWORD,
      }),
    )
    const cookie = getSessionCookie(loginResponse)
    const response = await logout(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { cookie },
      }),
    )
    const meResponse = await me(getRequest("/api/auth/me", cookie))

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=;`)
    await expect(responseJson(response)).resolves.toEqual({
      ok: true,
      data: {
        loggedOut: true,
      },
    })
    await expect(responseJson(meResponse)).resolves.toEqual({
      ok: true,
      data: {
        user: null,
      },
    })
  })

  it("GET /api/cart returns 401 when unauthenticated", async () => {
    const response = await getCart(getRequest("/api/cart"))

    expect(response.status).toBe(401)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
      },
    })
  })

  it("GET /api/cart returns 403 for seller users", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await getCart(getRequest("/api/cart", sellerCookie))

    expect(response.status).toBe(403)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN",
      },
    })
  })

  it("GET /api/cart returns an empty buyer cart", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const response = await getCart(getRequest("/api/cart", buyerCookie))

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toEqual({
      ok: true,
      data: {
        items: [],
        itemCount: 0,
        subtotal: 0,
        total: 0,
      },
    })
  })

  it("POST /api/cart/items adds a product and computes totals", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const response = await addCartItem(
      jsonRequest(
        "/api/cart/items",
        {
          productId: "test-product-active",
          quantity: 2,
        },
        buyerCookie,
      ),
    )

    expect(response.status).toBe(201)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        items: [
          expect.objectContaining({
            id: "test-product-active",
            productId: "test-product-active",
            name: "Integration Tender Juicy Hotdog",
            price: 185,
            originalPrice: 285,
            quantity: 2,
            lineTotal: 370,
          }),
        ],
        itemCount: 2,
        subtotal: 370,
        total: 370,
      },
    })
  })

  it("POST /api/cart/items increments an existing product quantity", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 2 }, buyerCookie))
    const response = await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 3 }, buyerCookie),
    )

    expect(response.status).toBe(201)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        items: [
          expect.objectContaining({
            productId: "test-product-active",
            quantity: 5,
            lineTotal: 925,
          }),
        ],
        itemCount: 5,
        total: 925,
      },
    })
  })

  it("PATCH /api/cart/items/[productId] updates item quantity", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 2 }, buyerCookie))
    const response = await updateCartItem(
      jsonRequest("/api/cart/items/test-product-active", { quantity: 4 }, buyerCookie, "PATCH"),
      cartItemContext("test-product-active"),
    )

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        items: [
          expect.objectContaining({
            productId: "test-product-active",
            quantity: 4,
            lineTotal: 740,
          }),
        ],
        itemCount: 4,
        total: 740,
      },
    })
  })

  it("PATCH /api/cart/items/[productId] with quantity zero removes the item", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 2 }, buyerCookie))
    const response = await updateCartItem(
      jsonRequest("/api/cart/items/test-product-active", { quantity: 0 }, buyerCookie, "PATCH"),
      cartItemContext("test-product-active"),
    )

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        items: [],
        itemCount: 0,
        total: 0,
      },
    })
  })

  it("DELETE /api/cart/items/[productId] removes one item", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 2 }, buyerCookie))
    await addCartItem(jsonRequest("/api/cart/items", { productId: "test-product-expired", quantity: 1 }, buyerCookie))

    const response = await deleteCartItem(
      deleteRequest("/api/cart/items/test-product-active", buyerCookie),
      cartItemContext("test-product-active"),
    )

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        items: [
          expect.objectContaining({
            productId: "test-product-expired",
            quantity: 1,
          }),
        ],
        itemCount: 1,
        total: 115,
      },
    })
  })

  it("DELETE /api/cart clears the buyer cart", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 2 }, buyerCookie))
    const response = await clearCart(deleteRequest("/api/cart", buyerCookie))

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toEqual({
      ok: true,
      data: {
        items: [],
        itemCount: 0,
        subtotal: 0,
        total: 0,
      },
    })
  })

  it("cart item writes reject invalid quantities", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const addResponse = await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 0 }, buyerCookie),
    )

    await addCartItem(jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 1 }, buyerCookie))
    const updateResponse = await updateCartItem(
      jsonRequest("/api/cart/items/test-product-active", { quantity: 1.5 }, buyerCookie, "PATCH"),
      cartItemContext("test-product-active"),
    )

    expect(addResponse.status).toBe(422)
    await expect(responseJson(addResponse)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: {
          quantity: "Quantity must be a positive whole number.",
        },
      },
    })
    expect(updateResponse.status).toBe(422)
    await expect(responseJson(updateResponse)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: {
          quantity: "Quantity must be a non-negative whole number.",
        },
      },
    })
  })

  it("POST /api/cart/items rejects missing and removed products", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const missingResponse = await addCartItem(
      jsonRequest("/api/cart/items", { productId: "missing-product", quantity: 1 }, buyerCookie),
    )
    const removedResponse = await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-removed", quantity: 1 }, buyerCookie),
    )

    expect(missingResponse.status).toBe(404)
    await expect(responseJson(missingResponse)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "NOT_FOUND",
      },
    })
    expect(removedResponse.status).toBe(404)
    await expect(responseJson(removedResponse)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "NOT_FOUND",
      },
    })
  })

  it("GET /api/seller/products returns 401 when unauthenticated", async () => {
    const response = await listSellerProducts(getRequest("/api/seller/products"))

    expect(response.status).toBe(401)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
      },
    })
  })

  it("GET /api/seller/products returns 403 for buyer users", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const response = await listSellerProducts(getRequest("/api/seller/products", buyerCookie))

    expect(response.status).toBe(403)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN",
      },
    })
  })

  it("GET /api/seller/products returns only the authenticated seller products", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await listSellerProducts(getRequest("/api/seller/products", sellerCookie))
    const body = await responseJson(response)
    const data = body.data as { products: Array<{ id: string; sellerId: string; status: string }> }

    expect(response.status).toBe(200)
    expect(data.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "test-product-active",
          sellerId: "test-seller-profile",
          status: "active",
        }),
        expect.objectContaining({
          id: "test-product-expired",
          sellerId: "test-seller-profile",
          status: "active",
        }),
      ]),
    )
    expect(data.products).toHaveLength(2)
    expect(data.products.map((product) => product.id)).not.toContain("test-other-seller-product")
  })

  it("GET /api/seller/products excludes soft-removed products", async () => {
    const sellerCookie = await loginAs("seller@example.test")

    await deleteSellerProduct(
      deleteRequest("/api/seller/products/test-product-active", sellerCookie),
      sellerProductContext("test-product-active"),
    )

    const response = await listSellerProducts(getRequest("/api/seller/products", sellerCookie))
    const body = await responseJson(response)
    const data = body.data as { products: Array<{ id: string }> }

    expect(response.status).toBe(200)
    expect(data.products.map((product) => product.id)).toEqual(["test-product-expired"])
  })

  it("GET /api/seller/products keeps second seller products isolated", async () => {
    const otherSellerCookie = await loginAs("other-seller@example.test")
    const response = await listSellerProducts(getRequest("/api/seller/products", otherSellerCookie))
    const body = await responseJson(response)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      data: {
        products: [
          expect.objectContaining({
            id: "test-other-seller-product",
            sellerId: "test-other-seller-profile",
          }),
        ],
      },
    })
    const data = body.data as { products: Array<{ id: string }> }

    expect(data.products).toHaveLength(1)
    expect(data.products.map((product) => product.id)).not.toContain("test-product-active")
  })

  it("POST /api/seller/products returns 401 when unauthenticated", async () => {
    const response = await createSellerProduct(
      jsonRequest("/api/seller/products", validSellerProductInput()),
    )

    expect(response.status).toBe(401)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
      },
    })
  })

  it("POST /api/seller/products returns 403 for buyer users", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const response = await createSellerProduct(
      jsonRequest("/api/seller/products", validSellerProductInput(), buyerCookie),
    )

    expect(response.status).toBe(403)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN",
      },
    })
  })

  it("POST /api/seller/products returns validation errors for invalid seller data", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await createSellerProduct(
      jsonRequest(
        "/api/seller/products",
        validSellerProductInput({
          name: "",
          categoryId: "",
          originalPrice: -1,
          discountedPrice: 0,
          discountPercent: 101,
          quantity: 1.5,
          expiryDate: "not-a-date",
        }),
        sellerCookie,
      ),
    )

    expect(response.status).toBe(422)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        fieldErrors: {
          name: "Product name is required.",
          categoryId: "Category is required.",
          originalPrice: "Original price must be a positive number.",
          discountedPrice: "Discounted price must be a positive number.",
          discountPercent: "Discount must be between 0 and 100%.",
          quantity: "Quantity must be a non-negative whole number.",
          expiryDate: "Enter a valid expiry date.",
        },
      },
    })
  })

  it("POST /api/seller/products creates a public product for the authenticated seller", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await createSellerProduct(
      jsonRequest("/api/seller/products", validSellerProductInput(), sellerCookie),
    )
    const body = await responseJson(response)
    const data = body.data as { product: { id: string } }
    const productId = data.product.id
    const listResponse = await getProducts(getRequest("/api/products?search=Task%20018"))
    const detailResponse = await getProductById(getRequest(`/api/products/${productId}`), {
      params: Promise.resolve({ id: productId }),
    })

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      ok: true,
      data: {
        product: expect.objectContaining({
          id: expect.any(String),
          name: "Task 018 SQL Hotdog Bundle",
          category: "Hotdogs",
          originalPrice: 300,
          discountedPrice: 180,
          discountPercent: 40,
          seller: "Integration Meat Depot",
          sellerId: "test-seller-profile",
          status: "active",
        }),
      },
    })
    await expect(responseJson(listResponse)).resolves.toMatchObject({
      ok: true,
      data: {
        products: [
          expect.objectContaining({
            id: productId,
            name: "Task 018 SQL Hotdog Bundle",
          }),
        ],
        pagination: {
          total: 1,
        },
      },
    })
    await expect(responseJson(detailResponse)).resolves.toMatchObject({
      ok: true,
      data: {
        product: expect.objectContaining({
          id: productId,
          name: "Task 018 SQL Hotdog Bundle",
        }),
      },
    })
  })

  it("PATCH /api/seller/products/[id] updates an owned product and public detail reflects it", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await updateSellerProduct(
      jsonRequest(
        "/api/seller/products/test-product-active",
        {
          name: "Updated Integration Hotdogs",
          discountedPrice: 175,
          quantity: 4,
          categoryId: "frozen-foods",
        },
        sellerCookie,
        "PATCH",
      ),
      sellerProductContext("test-product-active"),
    )
    const detailResponse = await getProductById(
      getRequest("/api/products/test-product-active"),
      sellerProductContext("test-product-active"),
    )

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        product: expect.objectContaining({
          id: "test-product-active",
          name: "Updated Integration Hotdogs",
          category: "Frozen Foods",
          discountedPrice: 175,
          discountPercent: 39,
          quantity: 4,
        }),
      },
    })
    await expect(responseJson(detailResponse)).resolves.toMatchObject({
      ok: true,
      data: {
        product: expect.objectContaining({
          id: "test-product-active",
          name: "Updated Integration Hotdogs",
          category: "Frozen Foods",
        }),
      },
    })
  })

  it("PATCH /api/seller/products/[id] blocks mutation of another seller product", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await updateSellerProduct(
      jsonRequest(
        "/api/seller/products/test-other-seller-product",
        {
          name: "Not Mine",
        },
        sellerCookie,
        "PATCH",
      ),
      sellerProductContext("test-other-seller-product"),
    )

    expect(response.status).toBe(403)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN",
      },
    })
  })

  it("DELETE /api/seller/products/[id] soft-removes an owned product from public reads", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await deleteSellerProduct(
      deleteRequest("/api/seller/products/test-product-active", sellerCookie),
      sellerProductContext("test-product-active"),
    )
    const detailResponse = await getProductById(
      getRequest("/api/products/test-product-active"),
      sellerProductContext("test-product-active"),
    )
    const listResponse = await getProducts(getRequest("/api/products?search=Integration%20Tender"))

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: {
        product: expect.objectContaining({
          id: "test-product-active",
          status: "removed",
        }),
      },
    })
    expect(detailResponse.status).toBe(404)
    await expect(responseJson(listResponse)).resolves.toMatchObject({
      ok: true,
      data: {
        products: [],
        pagination: {
          total: 0,
        },
      },
    })
  })

  it("DELETE /api/seller/products/[id] returns 404 for missing products", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await deleteSellerProduct(
      deleteRequest("/api/seller/products/missing-product", sellerCookie),
      sellerProductContext("missing-product"),
    )

    expect(response.status).toBe(404)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: {
        code: "NOT_FOUND",
      },
    })
  })

  // ─── Order tests ───────────────────────────────────────────────

  it("POST /api/orders returns 401 when unauthenticated", async () => {
    const response = await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01", pickupTime: "2:00 PM" }),
    )

    expect(response.status).toBe(401)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    })
  })

  it("POST /api/orders returns 403 for seller users", async () => {
    const sellerCookie = await loginAs("seller@example.test")
    const response = await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01", pickupTime: "2:00 PM" }, sellerCookie),
    )

    expect(response.status).toBe(403)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    })
  })

  it("POST /api/orders returns conflict for an empty cart", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const response = await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01", pickupTime: "2:00 PM" }, buyerCookie),
    )

    expect(response.status).toBe(409)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: false,
      error: { code: "CONFLICT" },
    })
  })

  it("POST /api/orders creates an order from buyer cart with snapshotted prices", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 2 }, buyerCookie),
    )

    const response = await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01T00:00:00.000Z", pickupTime: "2:00 PM" }, buyerCookie),
    )
    const body = await responseJson(response)

    expect(response.status).toBe(201)
    expect(body).toMatchObject({
      ok: true,
      data: {
        order: expect.objectContaining({
          id: expect.any(String),
          buyer: "Test Buyer",
          buyerId: "test-buyer-user",
          sellerId: "test-seller-profile",
          status: "reserved",
          total: 370,
          pickupTime: "2:00 PM",
          pickupCode: expect.stringContaining("F4A-"),
          items: [
            expect.objectContaining({
              productName: "Integration Tender Juicy Hotdog",
              quantity: 2,
              unitPrice: 185,
              originalUnitPrice: 285,
              subtotal: 370,
            }),
          ],
        }),
      },
    })
  })

  it("POST /api/orders clears the cart after checkout", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 1 }, buyerCookie),
    )
    await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01", pickupTime: "2:00 PM" }, buyerCookie),
    )

    const cartResponse = await getCart(getRequest("/api/cart", buyerCookie))

    expect(cartResponse.status).toBe(200)
    await expect(responseJson(cartResponse)).resolves.toMatchObject({
      ok: true,
      data: { items: [], itemCount: 0, total: 0 },
    })
  })

  it("POST /api/orders decrements product stock", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 3 }, buyerCookie),
    )
    await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01", pickupTime: "2:00 PM" }, buyerCookie),
    )

    const productResponse = await getProductById(
      getRequest("/api/products/test-product-active"),
      { params: Promise.resolve({ id: "test-product-active" }) },
    )
    const productBody = await responseJson(productResponse)
    const product = (productBody.data as { product: { quantity: number } }).product

    expect(product.quantity).toBe(9)
  })

  it("GET /api/orders returns buyer orders", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 1 }, buyerCookie),
    )
    await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01", pickupTime: "2:00 PM" }, buyerCookie),
    )

    const response = await getOrders(getRequest("/api/orders", buyerCookie))
    const body = await responseJson(response)

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      ok: true,
      data: {
        orders: [
          expect.objectContaining({
            buyerId: "test-buyer-user",
            status: "reserved",
            total: 185,
            items: [
              expect.objectContaining({
                productName: "Integration Tender Juicy Hotdog",
                quantity: 1,
              }),
            ],
          }),
        ],
      },
    })
  })

  it("GET /api/orders returns 401 for unauthenticated users", async () => {
    const response = await getOrders(getRequest("/api/orders"))

    expect(response.status).toBe(401)
  })

  it("GET /api/orders returns empty for a buyer with no orders", async () => {
    const buyerCookie = await loginAs("buyer@example.test")
    const response = await getOrders(getRequest("/api/orders", buyerCookie))

    expect(response.status).toBe(200)
    await expect(responseJson(response)).resolves.toMatchObject({
      ok: true,
      data: { orders: [] },
    })
  })

  it("order totals are computed server-side from product prices", async () => {
    const buyerCookie = await loginAs("buyer@example.test")

    await addCartItem(
      jsonRequest("/api/cart/items", { productId: "test-product-active", quantity: 4 }, buyerCookie),
    )

    const response = await createOrder(
      jsonRequest("/api/orders", { pickupDate: "2030-06-01", pickupTime: "10:00 AM" }, buyerCookie),
    )
    const body = await responseJson(response)
    const order = (body.data as { order: { total: number; items: { subtotal: number }[] } }).order

    expect(order.total).toBe(740)
    expect(order.items[0]!.subtotal).toBe(740)
  })
})
