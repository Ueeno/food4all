import { CATEGORIES } from "@/lib/mock-data"
import type { Category } from "@/lib/types"

export async function getCategories(): Promise<Category[]> {
  return CATEGORIES.map((category) => ({ ...category }))
}
