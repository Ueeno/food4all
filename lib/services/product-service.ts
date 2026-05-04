import { apiRequest, isApiClientError } from "@/lib/api-client"
import type { ApiProduct, ProductListQuery } from "@/lib/api-contracts"
import type { Product } from "@/lib/types"

function cloneProduct(product: Product): Product {
  return { ...product }
}

function productListPath(query: ProductListQuery = {}) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  }

  const queryString = params.toString()

  return queryString ? `/api/products?${queryString}` : "/api/products"
}

export async function getProducts(query: ProductListQuery = {}): Promise<Product[]> {
  const { products } = await apiRequest<{
    products: ApiProduct[]
    pagination: {
      page: number
      pageSize: number
      total: number
    }
  }>(productListPath(query))

  return products.map(cloneProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { product } = await apiRequest<{ product: ApiProduct }>(
      `/api/products/${encodeURIComponent(id)}`,
    )

    return cloneProduct(product)
  } catch (error) {
    if (isApiClientError(error) && error.code === "NOT_FOUND") {
      return null
    }

    throw error
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return getProducts()

  return getProducts({ search: normalizedQuery })
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  return getProducts({ categoryId })
}

export async function getFeaturedProducts(): Promise<Product[]> {
  return getProducts({ featured: true })
}

export async function getHotProducts(): Promise<Product[]> {
  return getProducts({ hot: true })
}

export async function getExpiringProducts(maxDaysUntilExpiry = 14): Promise<Product[]> {
  return getProducts({ maxDaysUntilExpiry })
}
