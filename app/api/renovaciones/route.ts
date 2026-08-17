import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function calcEstado(fechaRenovacion: Date): string {
  const hoy = new Date()
  const diff = Math.floor((fechaRenovacion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Vencido'
  if (diff <= 15) return 'Por Vencer'
  return 'Vigente'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const area = searchParams.get('area')
    const estado = searchParams.get('estado')
    const categoria = searchParams.get('categoria')

    // Actualizar estados de renovación primero
    const todosDetalles = await prisma.detalleEntrega.findMany({
      select: { id: true, fechaRenovacionCalc: true, estadoRenovacion: true },
    })

    for (const det of todosDetalles) {
      const nuevoEstado = calcEstado(new Date(det.fechaRenovacionCalc))
      if (nuevoEstado !== det.estadoRenovacion) {
        await prisma.detalleEntrega.update({
          where: { id: det.id },
          data: { estadoRenovacion: nuevoEstado },
        })
      }
    }

    const detalles = await prisma.detalleEntrega.findMany({
      where: {
        ...(estado ? { estadoRenovacion: estado } : {}),
        ...(categoria ? { articulo: { categoria } } : {}),
        ...(area ? { entrega: { trabajador: { area } } } : {}),
      },
      include: {
        articulo: true,
        entrega: {
          include: { trabajador: true },
        },
      },
      orderBy: { fechaRenovacionCalc: 'asc' },
    })

    return NextResponse.json(detalles)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener renovaciones' }, { status: 500 })
  }
}
