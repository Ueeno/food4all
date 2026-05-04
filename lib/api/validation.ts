import type { NextResponse } from "next/server"
import { z } from "zod"

import { badRequest, validationError } from "@/lib/api/response"

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
)

const optionalPositiveInteger = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : Number(value)),
  z.number().int().positive().optional(),
)

const optionalNonNegativeInteger = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : Number(value)),
  z.number().int().min(0).optional(),
)

const optionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined
  if (value === "true" || value === true) return true
  if (value === "false" || value === false) return false
  return value
}, z.boolean().optional())

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  phone: optionalTrimmedString,
  email: z.string().trim().email("Enter a valid email address.").transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(["buyer", "seller"]).optional(),
})

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Password is required."),
})

export const productListQuerySchema = z.object({
  search: optionalTrimmedString,
  categoryId: optionalTrimmedString,
  sellerId: optionalTrimmedString,
  maxDaysUntilExpiry: optionalNonNegativeInteger,
  featured: optionalBoolean,
  hot: optionalBoolean,
  page: optionalPositiveInteger.default(1),
  pageSize: optionalPositiveInteger.default(20).pipe(z.number().max(50)),
})

export const idParamSchema = z.object({
  id: z.string().trim().min(1, "Resource id is required."),
})

export function getZodFieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = error.flatten().fieldErrors

  return Object.fromEntries(
    Object.entries(flattened)
      .map(([field, messages]) => [field, messages?.[0]])
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  )
}

export type ParsedRequest<Data> =
  | { ok: true; data: Data }
  | { ok: false; response: NextResponse }

export async function parseJsonRequest<Schema extends z.ZodTypeAny>(
  request: Request,
  schema: Schema,
): Promise<ParsedRequest<z.infer<Schema>>> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return { ok: false, response: badRequest("Request body must be valid JSON.") }
  }

  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return {
      ok: false,
      response: validationError(getZodFieldErrors(parsed.error)),
    }
  }

  return { ok: true, data: parsed.data }
}
