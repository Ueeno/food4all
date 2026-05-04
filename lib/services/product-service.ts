import { PRODUCTS } from "@/lib/mock-data"
import type { Product } from "@/lib/types"

function cloneProduct(product: Product): Product {
  return { ...product }
}

function categoryToId(category: string) {
  return category.toLowerCase().replace(/\s+/g, "-")
}

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS.map(cloneProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = PRODUCTS.find((item) => item.id === id)
  return product ? cloneProduct(product) : null
}

export async function searchProducts(query: string): Promise<Product[]> {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return getProducts()

  return PRODUCTS.filter(
    (product) =>
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.seller.toLowerCase().includes(normalizedQuery) ||
      product.brand.toLowerCase().includes(normalizedQuery),
  ).map(cloneProduct)
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return PRODUCTS.filter((product) => categoryToId(product.category) === categoryId).map(cloneProduct)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return PRODUCTS.filter((product) => product.isFeatured).map(cloneProduct)
}

export async function getHotProducts(): Promise<Product[]> {
  return PRODUCTS.filter((product) => product.isHot).map(cloneProduct)
}

export async function getExpiringProducts(maxDaysUntilExpiry = 14): Promise<Product[]> {
  return PRODUCTS.filter((product) => product.daysUntilExpiry <= maxDaysUntilExpiry).map(cloneProduct)
}
