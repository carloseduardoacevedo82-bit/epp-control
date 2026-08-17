# ==============================================================================
# Dockerfile Multi-Stage Optimizado para Next.js 16 (App Router + Prisma)
# Control de EPPs y Uniformes - DALUPEZMAR S.A.C.
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Dependencias (deps)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar manifiestos de paquetes y esquema de base de datos
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependencias exactas
RUN npm ci

# ------------------------------------------------------------------------------
# 2. Compilación (builder)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generar cliente de Prisma para la compilación
RUN npx prisma generate

# Construir la aplicación Next.js en modo Standalone
RUN npm run build

# ------------------------------------------------------------------------------
# 3. Servidor de Producción (runner)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario y grupo de seguridad sin privilegios root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Crear directorios para persistencia de datos (SQLite y PDFs generados)
RUN mkdir -p /app/public/constancias /app/data && \
    chown -R nextjs:nodejs /app/public/constancias /app/data

# Copiar artefactos compilados y assets estáticos
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Ejecutar el servidor standalone de Next.js
CMD ["node", "server.js"]
