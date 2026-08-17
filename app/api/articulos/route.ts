import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoria = searchParams.get('categoria')
    const soloActivos = searchParams.get('activos') === 'true'

    const articulos = await prisma.articuloEPP.findMany({
      where: {
        ...(categoria ? { categoria } : {}),
        ...(soloActivos ? { activo: true } : {}),
      },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    })
    return NextResponse.json(articulos)
  } catch {
    return NextResponse.json({ error: 'Error al obtener artículos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const articulo = await prisma.articuloEPP.create({ data: body })
    return NextResponse.json(articulo, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El código ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear artículo' }, { status: 500 })
  }
}
