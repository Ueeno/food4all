import { describe, expect, it, beforeAll, beforeEach, afterAll } from "vitest"

import { GET as getCategories } from "@/app/api/categories/route"
import { GET as getHealth } from "@/app/api/health/route"
import { GET as getProductById } from "@/app/api/products/[id]/route"
import { GET as getProducts } from "@/app/api/products/route"
import { POST as login } from "@/app/api/auth/login/route"
import { GET as me } from "@/app/api/auth/me/route"
import { POST as logout } from "@/app/api/auth/logout/route"
import { POST as register } from "@/app/api/auth/register/route"
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

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
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
})
