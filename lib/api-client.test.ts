import { afterEach, describe, expect, it, vi } from "vitest"

import { apiErrorResponse, apiSuccessResponse } from "@/test/api-fetch-mock"
import { ApiClientError, apiRequest } from "./api-client"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("api client", () => {
  it("unwraps success envelopes and sends JSON requests with credentials", async () => {
    const fetchMock = vi.fn(async () =>
      apiSuccessResponse({
        user: {
          id: "user-1",
          name: "Maria Santos",
          email: "maria@example.test",
          role: "buyer",
        },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const data = await apiRequest<{
      user: { id: string; email: string }
    }>("/api/auth/login", {
      method: "POST",
      body: {
        email: "maria@example.test",
        password: "password123",
      },
    })
    const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>
    const init = calls[0]?.[1]

    if (!init) throw new Error("Expected fetch to be called with request init")

    expect(data.user).toMatchObject({
      id: "user-1",
      email: "maria@example.test",
    })
    expect(init.method).toBe("POST")
    expect(init.credentials).toBe("include")
    expect(init.body).toBe(
      JSON.stringify({
        email: "maria@example.test",
        password: "password123",
      }),
    )
    expect((init.headers as Headers).get("accept")).toBe("application/json")
    expect((init.headers as Headers).get("content-type")).toBe("application/json")
  })

  it("throws typed API errors from error envelopes", async () => {
    const fetchMock = vi.fn(async () =>
      apiErrorResponse("VALIDATION_ERROR", "Please fix the highlighted fields.", 422, {
        email: "Enter a valid email address.",
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(apiRequest("/api/auth/register")).rejects.toMatchObject({
      name: "ApiClientError",
      code: "VALIDATION_ERROR",
      status: 422,
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        email: "Enter a valid email address.",
      },
    })
  })

  it("safely handles non-JSON error responses", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("server exploded", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(apiRequest("/api/products")).rejects.toMatchObject({
      code: "SERVER_ERROR",
      status: 500,
      message: "Internal Server Error",
    })
  })

  it("wraps network failures in an API client error", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("fetch failed")
    })
    vi.stubGlobal("fetch", fetchMock)

    await expect(apiRequest("/api/products")).rejects.toBeInstanceOf(ApiClientError)
    await expect(apiRequest("/api/products")).rejects.toMatchObject({
      code: "SERVER_ERROR",
      status: 0,
      message: "Network request failed.",
    })
  })
})
