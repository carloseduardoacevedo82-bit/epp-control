import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const articulo = await prisma.articuloEPP.findUnique({ where: { id: Number(id) } })
    if (!articulo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(articulo)
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const artId = Number(id)
    if (isNaN(artId)) {
      return NextResponse.json({ error: 'ID de artículo inválido' }, { status: 400 })
    }

    const body = await req.json()
    const updateData: Record<string, any> = {}

    if (body.codigo !== undefined) updateData.codigo = String(body.codigo).trim().toUpperCase()
    if (body.nombre !== undefined) updateData.nombre = String(body.nombre).trim()
    if (body.categoria !== undefined) updateData.categoria = String(body.categoria).trim()
    if (body.talla !== undefined) updateData.talla = body.talla ? String(body.talla).trim() : null
    if (body.costoUnitario !== undefined) updateData.costoUnitario = Number(body.costoUnitario) || 0
    if (body.vidaUtilDias !== undefined) updateData.vidaUtilDias = parseInt(String(body.vidaUtilDias), 10) || 365
    if (body.stockActual !== undefined) updateData.stockActual = parseInt(String(body.stockActual), 10) || 0
    if (body.stockMinimo !== undefined) updateData.stockMinimo = parseInt(String(body.stockMinimo), 10) || 0
    if (body.marcaFabricante !== undefined) {
      updateData.marcaFabricante = body.marcaFabricante ? String(body.marcaFabricante).trim() : 'Estándar'
    }
    if (body.activo !== undefined) updateData.activo = Boolean(body.activo)

    const articulo = await prisma.articuloEPP.update({
      where: { id: artId },
      data: updateData,
    })
    return NextResponse.json(articulo)
  } catch (error: any) {
    console.error('Error al actualizar artículo:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'El código SKU ya existe en otro artículo' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message || 'Error al actualizar artículo' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.articuloEPP.update({
      where: { id: Number(id) },
      data: { activo: false },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
