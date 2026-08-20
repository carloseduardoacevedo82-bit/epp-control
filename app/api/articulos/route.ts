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

    if (!body.codigo || !body.nombre || body.costoUnitario === undefined) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (código, nombre, costo unitario)' }, { status: 400 })
    }

    const dataToCreate = {
      codigo: String(body.codigo).trim().toUpperCase(),
      nombre: String(body.nombre).trim(),
      categoria: String(body.categoria || 'General').trim(),
      talla: body.talla ? String(body.talla).trim() : null,
      costoUnitario: Number(body.costoUnitario) || 0,
      vidaUtilDias: parseInt(String(body.vidaUtilDias || 365), 10) || 365,
      stockActual: parseInt(String(body.stockActual || 0), 10) || 0,
      stockMinimo: parseInt(String(body.stockMinimo || 5), 10) || 5,
      marcaFabricante: body.marcaFabricante ? String(body.marcaFabricante).trim() : 'Estándar',
      activo: body.activo !== false,
    }

    const articulo = await prisma.articuloEPP.create({ data: dataToCreate })
    return NextResponse.json(articulo, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear artículo:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'El código SKU ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message || 'Error al crear artículo' }, { status: 500 })
  }
}
