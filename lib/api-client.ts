import type { ApiErrorCode, ApiErrorResponse, ApiSuccessResponse } from "@/lib/api-contracts"

type JsonRequestMethod = "GET" | "POST" | "PATCH" | "DELETE"

export interface ApiClientOptions<Body = unknown> {
  method?: JsonRequestMethod
  body?: Body
  headers?: HeadersInit
  signal?: AbortSignal
}

interface ApiClientErrorOptions {
  code: ApiErrorCode
  status: number
  fieldErrors?: Record<string, string>
}

export class ApiClientError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly fieldErrors?: Record<string, string>

  constructor(message: string, options: ApiClientErrorOptions) {
    super(message)
    this.name = "ApiClientError"
    this.code = options.code
    this.status = options.status
    this.fieldErrors = options.fieldErrors
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    value === "BAD_REQUEST" ||
    value === "UNAUTHENTICATED" ||
    value === "FORBIDDEN" ||
    value === "NOT_FOUND" ||
    value === "CONFLICT" ||
    value === "VALIDATION_ERROR" ||
    value === "SERVER_ERROR"
  )
}

function isApiSuccessResponse<Data>(value: unknown): value is ApiSuccessResponse<Data> {
  return isRecord(value) && value.ok === true && "data" in value
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value) || value.ok !== false || !isRecord(value.error)) {
    return false
  }

  return isApiErrorCode(value.error.code) && typeof value.error.message === "string"
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST"
  if (status === 401) return "UNAUTHENTICATED"
  if (status === 403) return "FORBIDDEN"
  if (status === 404) return "NOT_FOUND"
  if (status === 409) return "CONFLICT"
  if (status === 422) return "VALIDATION_ERROR"
  return "SERVER_ERROR"
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

export async function apiRequest<Data, Body = unknown>(
  path: string,
  options: ApiClientOptions<Body> = {},
): Promise<Data> {
  const { body, headers, method = body === undefined ? "GET" : "POST", signal } = options
  const requestHeaders = new Headers(headers)

  requestHeaders.set("accept", "application/json")

  const init: RequestInit = {
    method,
    credentials: "include",
    headers: requestHeaders,
    signal,
  }

  if (body !== undefined) {
    requestHeaders.set("content-type", "application/json")
    init.body = JSON.stringify(body)
  }

  let response: Response

  try {
    response = await fetch(path, init)
  } catch {
    throw new ApiClientError("Network request failed.", {
      code: "SERVER_ERROR",
      status: 0,
    })
  }

  const parsed = await parseJsonSafely(response)

  if (isApiSuccessResponse<Data>(parsed)) {
    return parsed.data
  }

  if (isApiErrorResponse(parsed)) {
    throw new ApiClientError(parsed.error.message, {
      code: parsed.error.code,
      status: response.status,
      fieldErrors: parsed.error.fieldErrors,
    })
  }

  throw new ApiClientError(
    response.ok ? "Unexpected API response." : response.statusText || "Request failed.",
    {
      code: codeFromStatus(response.status),
      status: response.status,
    },
  )
}
