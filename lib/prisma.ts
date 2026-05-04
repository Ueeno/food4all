import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

import { PrismaClient } from "@/lib/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaDatabaseUrl?: string
}

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? "file:./prisma/dev.db"
}

export function getPrisma(): PrismaClient {
  const databaseUrl = getDatabaseUrl()

  if (globalForPrisma.prisma && globalForPrisma.prismaDatabaseUrl !== databaseUrl) {
    throw new Error("Prisma database URL changed. Disconnect the current client before using a new database.")
  }

  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({
      url: databaseUrl,
    })

    globalForPrisma.prisma = new PrismaClient({ adapter })
    globalForPrisma.prismaDatabaseUrl = databaseUrl
  }

  return globalForPrisma.prisma
}

export async function disconnectPrisma(): Promise<void> {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect()
  }

  globalForPrisma.prisma = undefined
  globalForPrisma.prismaDatabaseUrl = undefined
}
