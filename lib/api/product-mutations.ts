export const productInclude = {
  category: true,
  seller: true,
} as const

export function pesosToCents(price: number): number {
  return Math.round(price * 100)
}

export function calculateDiscountPercent(originalPriceCents: number, discountedPriceCents: number): number {
  return Math.round((1 - discountedPriceCents / originalPriceCents) * 100)
}

export function hasValidDiscount(originalPriceCents: number, discountedPriceCents: number): boolean {
  const discount = (1 - discountedPriceCents / originalPriceCents) * 100

  return discount >= 0 && discount <= 100
}
