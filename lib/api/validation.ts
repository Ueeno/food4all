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

const requiredTrimmedString = (message: string) => z.string().trim().min(1, message)

const optionalNonEmptyTrimmedString = (message: string) =>
  z.string().trim().min(1, message).optional()

const requiredPositiveNumber = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    z.number({ required_error: message, invalid_type_error: message }).finite(message).positive(message),
  )

const optionalPositiveNumber = (message: string) =>
  z.preprocess(
    (value) => (value === undefined ? undefined : typeof value === "string" ? Number(value) : value),
    z.number({ invalid_type_error: message }).finite(message).positive(message).optional(),
  )

const requiredNonNegativeInteger = (message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    z
      .number({ required_error: message, invalid_type_error: message })
      .int(message)
      .min(0, message),
  )

const optionalNonNegativeIntegerValue = (message: string) =>
  z.preprocess(
    (value) => (value === undefined ? undefined : typeof value === "string" ? Number(value) : value),
    z.number({ invalid_type_error: message }).int(message).min(0, message).optional(),
  )

const requiredExpiryDate = z
  .string()
  .trim()
  .min(1, "Expiry date is required.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid expiry date.")

const optionalExpiryDate = z
  .string()
  .trim()
  .min(1, "Enter a valid expiry date.")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid expiry date.")
  .optional()

const optionalDiscountPercent = z.preprocess(
  (value) => (value === undefined ? undefined : typeof value === "string" ? Number(value) : value),
  z
    .number({ invalid_type_error: "Discount must be between 0 and 100%." })
    .int("Discount must be between 0 and 100%.")
    .min(0, "Discount must be between 0 and 100%.")
    .max(100, "Discount must be between 0 and 100%.")
    .optional(),
)

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

export const productIdParamSchema = z.object({
  productId: z.string().trim().min(1, "Product id is required."),
})

export const addCartItemSchema = z.object({
  productId: requiredTrimmedString("Product is required."),
  quantity: z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    z
      .number({ required_error: "Quantity is required.", invalid_type_error: "Quantity must be a positive whole number." })
      .int("Quantity must be a positive whole number.")
      .positive("Quantity must be a positive whole number."),
  ),
})

export const updateCartItemSchema = z.object({
  quantity: z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    z
      .number({ required_error: "Quantity is required.", invalid_type_error: "Quantity must be a non-negative whole number." })
      .int("Quantity must be a non-negative whole number.")
      .min(0, "Quantity must be a non-negative whole number."),
  ),
})

export const sellerProductCreateSchema = z
  .object({
    name: requiredTrimmedString("Product name is required."),
    brand: requiredTrimmedString("Brand is required."),
    categoryId: requiredTrimmedString("Category is required."),
    originalPrice: requiredPositiveNumber("Original price must be a positive number."),
    discountedPrice: requiredPositiveNumber("Discounted price must be a positive number."),
    discountPercent: optionalDiscountPercent,
    quantity: requiredNonNegativeInteger("Quantity must be a non-negative whole number."),
    unit: requiredTrimmedString("Unit is required."),
    expiryDate: requiredExpiryDate,
    pickupAddress: requiredTrimmedString("Pickup address is required."),
    pickupBarangay: optionalTrimmedString,
    pickupHours: requiredTrimmedString("Pickup hours are required."),
    description: requiredTrimmedString("Description is required."),
    weight: requiredTrimmedString("Weight is required."),
    packSize: requiredTrimmedString("Pack size is required."),
    imageUrl: optionalTrimmedString,
    isHot: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .superRefine((product, context) => {
    const discount = (1 - product.discountedPrice / product.originalPrice) * 100

    if (discount < 0 || discount > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountedPrice"],
        message: "Discount must be between 0 and 100%.",
      })
    }
  })

export const sellerProductUpdateSchema = z
  .object({
    name: optionalNonEmptyTrimmedString("Product name is required."),
    brand: optionalNonEmptyTrimmedString("Brand is required."),
    categoryId: optionalNonEmptyTrimmedString("Category is required."),
    originalPrice: optionalPositiveNumber("Original price must be a positive number."),
    discountedPrice: optionalPositiveNumber("Discounted price must be a positive number."),
    discountPercent: optionalDiscountPercent,
    quantity: optionalNonNegativeIntegerValue("Quantity must be a non-negative whole number."),
    unit: optionalNonEmptyTrimmedString("Unit is required."),
    expiryDate: optionalExpiryDate,
    pickupAddress: optionalNonEmptyTrimmedString("Pickup address is required."),
    pickupBarangay: optionalTrimmedString,
    pickupHours: optionalNonEmptyTrimmedString("Pickup hours are required."),
    description: optionalNonEmptyTrimmedString("Description is required."),
    weight: optionalNonEmptyTrimmedString("Weight is required."),
    packSize: optionalNonEmptyTrimmedString("Pack size is required."),
    imageUrl: optionalTrimmedString,
    isHot: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .superRefine((product, context) => {
    if (product.originalPrice === undefined || product.discountedPrice === undefined) return

    const discount = (1 - product.discountedPrice / product.originalPrice) * 100

    if (discount < 0 || discount > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountedPrice"],
        message: "Discount must be between 0 and 100%.",
      })
    }
  })

export const createOrderSchema = z.object({
  pickupDate: z
    .string()
    .trim()
    .min(1, "Pickup date is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid pickup date."),
  pickupTime: z.string().trim().min(1, "Pickup time is required."),
})

export const verifyPickupSchema = z.object({
  code: z
    .string({
      required_error: "Pickup code is required.",
      invalid_type_error: "Pickup code is required.",
    })
    .trim()
    .min(1, "Pickup code is required.")
    .transform((value) => value.toUpperCase())
    .refine((value) => /^F4A-[A-Z0-9]{4}$/.test(value), "Enter a valid pickup code."),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(["preparing", "ready", "cancelled"], {
    required_error: "Status is required.",
    invalid_type_error: "Invalid status transition.",
  }),
})

export const setRoleSchema = z.object({
  role: z.enum(["buyer", "seller"], {
    required_error: "Role is required.",
    invalid_type_error: "Role must be buyer or seller.",
  }),
})

export const sellerProfileUpdateSchema = z.object({
  businessName: optionalNonEmptyTrimmedString("Business name is required."),
  address: optionalNonEmptyTrimmedString("Address is required."),
  barangay: optionalTrimmedString,
  contactNumber: optionalNonEmptyTrimmedString("Contact number is required."),
  isOpen: z.boolean({ invalid_type_error: "Store status must be true or false." }).optional(),
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
