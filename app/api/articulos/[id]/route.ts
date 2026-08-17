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
    const body = await req.json()
    const articulo = await prisma.articuloEPP.update({
      where: { id: Number(id) },
      data: body,
    })
    return NextResponse.json(articulo)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
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
