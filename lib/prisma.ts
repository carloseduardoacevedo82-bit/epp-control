import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'
import fs from 'fs'

function resolverRutaSqlite(): string {
  const rawUrl = process.env.DATABASE_URL

  // 1. Si se define una URL de base de datos remota o PostgreSQL
  if (rawUrl && (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://') || rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://') || rawUrl.startsWith('http://'))) {
    return rawUrl
  }

  // 2. Si se especificó explícitamente una ruta de archivo en DATABASE_URL
  if (rawUrl && rawUrl.startsWith('file:')) {
    const rawPath = rawUrl.replace(/^file:/, '')
    // Si la ruta ya es absoluta
    if (path.isAbsolute(rawPath)) return `file:${rawPath}`
    return `file:${path.resolve(process.cwd(), rawPath)}`
  }

  // 3. Buscar bases de datos SQLite existentes en el proyecto
  const candidatos = [
    path.join(process.cwd(), 'data', 'dev.db'),
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
    '/app/data/dev.db',
    '/app/dev.db',
  ]

  let baseExistente = ''
  for (const c of candidatos) {
    try {
      if (fs.existsSync(c)) {
        baseExistente = c
        break
      }
    } catch {}
  }

  // 4. En entornos Linux / Docker / Render:
  // Para evitar estrictamente el error SQLITE_READONLY debido a permisos de directorio en /app,
  // nos aseguramos de que el archivo SQLite resida en un directorio con permisos completos de escritura (como /app/data o /tmp).
  if (process.platform !== 'win32') {
    const directorioEscribible = fs.existsSync('/app/data') ? '/app/data' : '/tmp'
    const targetPath = path.join(directorioEscribible, 'dev.db')

    try {
      // Si aún no existe en el directorio escribible pero hay una base semilla existente, copiarla
      if (!fs.existsSync(targetPath) && baseExistente && fs.existsSync(baseExistente)) {
        fs.copyFileSync(baseExistente, targetPath)
        try {
          fs.chmodSync(targetPath, 0o666)
        } catch {}
      }

      // Asegurar permisos en el directorio escribible
      try {
        fs.chmodSync(directorioEscribible, 0o777)
      } catch {}

      if (fs.existsSync(targetPath)) {
        return `file:${targetPath}`
      }
    } catch (e) {
      console.warn('[Prisma LibSQL] Advertencia al configurar ruta escribible SQLite:', e)
    }
  }

  // 5. Entorno local Windows / Desarrollo
  const localDb = baseExistente || path.join(process.cwd(), 'dev.db')
  return `file:${localDb}`
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL

  // Soporte nativo para PostgreSQL
  if (rawUrl && (rawUrl.startsWith('postgresql://') || rawUrl.startsWith('postgres://'))) {
    return new PrismaClient()
  }

  const dbUrl = resolverRutaSqlite()
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
