import { mapApiCategory } from "@/lib/api/mappers"
import { apiSuccess, serverError } from "@/lib/api/response"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    const prisma = getPrisma()
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    })

    return apiSuccess({
      categories: categories.map(mapApiCategory),
    })
  } catch (error) {
    console.error("Category list failed", error)
    return serverError()
  }
}
