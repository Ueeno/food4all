import { apiRequest } from "@/lib/api-client"
import type { ApiCategory } from "@/lib/api-contracts"
import type { Category } from "@/lib/types"

export async function getCategories(): Promise<Category[]> {
  const { categories } = await apiRequest<{ categories: ApiCategory[] }>("/api/categories")

  return categories.map((category) => ({ ...category }))
}
