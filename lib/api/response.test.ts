import { describe, expect, it } from "vitest"

import { apiSuccess, unauthorized, validationError } from "@/lib/api/response"

describe("API response helpers", () => {
  it("wraps success payloads in the shared envelope", async () => {
    const response = apiSuccess({ status: "ok" }, { status: 201 })

    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { status: "ok" },
    })
    expect(response.status).toBe(201)
  })

  it("wraps validation errors in the shared error format", async () => {
    const response = validationError({ email: "Enter a valid email address." })

    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please fix the highlighted fields.",
        fieldErrors: {
          email: "Enter a valid email address.",
        },
      },
    })
    expect(response.status).toBe(422)
  })

  it("supports standard unauthorized responses", async () => {
    const response = unauthorized()

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
      },
    })
    expect(response.status).toBe(401)
  })
})
