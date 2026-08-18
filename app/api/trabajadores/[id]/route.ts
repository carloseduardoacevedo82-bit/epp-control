import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sincronizarTrabajadorHaciaAsistencia } from '@/lib/syncAsistencia'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: Number(id) },
      include: {
        entregas: {
          include: { detalles: { include: { articulo: true } } },
          orderBy: { fechaEntrega: 'desc' },
        },
      },
    })
    if (!trabajador) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(trabajador)
  } catch {
    return NextResponse.json({ error: 'Error al obtener trabajador' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const trabajador = await prisma.trabajador.update({
      where: { id: Number(id) },
      data: body,
    })
    // Sincronizar en tiempo real con sistema de asistencia y fotochecks
    sincronizarTrabajadorHaciaAsistencia(trabajador)
    return NextResponse.json(trabajador)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar trabajador' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Baja lógica
    const trabajador = await prisma.trabajador.update({
      where: { id: Number(id) },
      data: { estado: 'inactivo' },
    })
    // Sincronizar baja con sistema de asistencia
    sincronizarTrabajadorHaciaAsistencia(trabajador)
    return NextResponse.json(trabajador)
  } catch {
    return NextResponse.json({ error: 'Error al dar de baja' }, { status: 500 })
  }
}

