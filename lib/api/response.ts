import { NextResponse } from "next/server"

import type { ApiErrorCode, ApiErrorResponse, ApiSuccessResponse } from "@/lib/api-contracts"

export type ApiFieldErrors = Record<string, string>

export function apiSuccess<Data>(data: Data, init: ResponseInit = {}) {
  return NextResponse.json<ApiSuccessResponse<Data>>(
    { ok: true, data },
    {
      ...init,
      status: init.status ?? 200,
    },
  )
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  fieldErrors?: ApiFieldErrors,
) {
  const body: ApiErrorResponse = {
    ok: false,
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  }

  return NextResponse.json(body, { status })
}

export function badRequest(message = "The request could not be processed.") {
  return apiError("BAD_REQUEST", message, 400)
}

export function validationError(
  fieldErrors: ApiFieldErrors,
  message = "Please fix the highlighted fields.",
) {
  return apiError("VALIDATION_ERROR", message, 422, fieldErrors)
}

export function unauthorized(message = "Authentication is required.") {
  return apiError("UNAUTHENTICATED", message, 401)
}

export function forbidden(message = "You do not have access to this resource.") {
  return apiError("FORBIDDEN", message, 403)
}

export function notFound(message = "The requested resource was not found.") {
  return apiError("NOT_FOUND", message, 404)
}

export function conflict(message = "The request conflicts with existing data.") {
  return apiError("CONFLICT", message, 409)
}

export function serverError(message = "Something went wrong.") {
  return apiError("SERVER_ERROR", message, 500)
}
