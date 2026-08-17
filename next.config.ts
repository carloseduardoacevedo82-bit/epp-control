import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'prisma', '@prisma/adapter-libsql', '@libsql/client'],
  allowedDevOrigins: [
    '*.trycloudflare.com',
    'trycloudflare.com',
    '*.loca.lt',
    'loca.lt',
    '*.lhr.life',
    '192.168.1.11',
    'localhost',
    '127.0.0.1',
  ],
  turbopack: {},
}

export default nextConfig
