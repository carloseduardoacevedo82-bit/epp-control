import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'
import fs from 'fs'

const TURSO_DEFAULT_URL = 'libsql://epp-db-carloseduardoacevedo82-bit.aws-us-east-2.turso.io'
const TURSO_DEFAULT_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk1MjgwMzUsImlkIjoiMDFhMGE4MmItZTMwMS03NDYxLWJjOGYtMzM2NWJmMjdhZjgwIiwia2lkIjoiRnJYRXpmeTc2TkhJTjdmMmdwRDZzVThMZUVtb0RReTRCYkl6WjJsUzJSVSIsInJpZCI6IjVjZWNlY2I2LWZkNWMtNGQ2Mi05ZTUzLTliYzUxMzAyMzkzMyJ9.WLK4_JR3A0DmXselJNH6we0hzFdk-Grh7iBN5iDTYHLQ1U7rAyT_W2yvWQ8TfpjSySIz_jKWPAqAGrxIwm1yBw'

function resolverRutaSqlite(): string {
  const rawUrl = process.env.DATABASE_URL || TURSO_DEFAULT_URL

  // 1. Si se define una URL de base de datos remota LibSQL o PostgreSQL
  if (
    rawUrl &&
    (rawUrl.startsWith('postgresql://') ||
      rawUrl.startsWith('postgres://') ||
      rawUrl.startsWith('libsql://') ||
      rawUrl.startsWith('https://') ||
      rawUrl.startsWith('http://'))
  ) {
    return rawUrl
  }

  // 2. Si se especificó explícitamente una ruta de archivo en DATABASE_URL
  if (rawUrl && rawUrl.startsWith('file:')) {
    const rawPath = rawUrl.replace(/^file:/, '')
    if (path.isAbsolute(rawPath)) return `file:${rawPath}`
    return `file:${path.resolve(process.cwd(), rawPath)}`
  }

  // 3. Fallback por defecto a la base de datos Turso Cloud
  return TURSO_DEFAULT_URL
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL || TURSO_DEFAULT_URL

  // Soporte nativo para PostgreSQL
  if (rawUrl && (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://'))) {
    return new PrismaClient()
  }

  const dbUrl = resolverRutaSqlite()
  const authToken = process.env.TURSO_AUTH_TOKEN || TURSO_DEFAULT_TOKEN

  console.log(`[Prisma Database] Conectando a persistencia: ${dbUrl.startsWith('libsql://') ? 'Turso Cloud 24/7' : dbUrl}`)

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
