import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL

  // Soporte directo para PostgreSQL en la nube (Supabase, Neon, Railway, Render)
  if (rawUrl && (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://'))) {
    return new PrismaClient()
  }

  // Soporte para SQLite local, volumen persistente Docker o LibSQL/Turso en la nube
  const dbUrl = rawUrl || `file:${path.join(process.cwd(), 'dev.db')}`
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  const adapter = new PrismaLibSql({
    url: dbUrl,
    authToken: authToken,
  })

  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

