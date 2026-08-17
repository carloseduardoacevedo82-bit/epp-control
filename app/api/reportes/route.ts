import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const trabajadorId = searchParams.get('trabajadorId')
    const area = searchParams.get('area')
    const categoria = searchParams.get('categoria')
    const estadoRenovacion = searchParams.get('estadoRenovacion')

    const detalles = await prisma.detalleEntrega.findMany({
      where: {
        ...(estadoRenovacion ? { estadoRenovacion } : {}),
        ...(categoria ? { articulo: { categoria } } : {}),
        entrega: {
          ...(fechaInicio || fechaFin
            ? {
                fechaEntrega: {
                  ...(fechaInicio ? { gte: new Date(fechaInicio) } : {}),
                  ...(fechaFin ? { lte: new Date(fechaFin + 'T23:59:59') } : {}),
                },
              }
            : {}),
          ...(trabajadorId ? { trabajadorId: Number(trabajadorId) } : {}),
          ...(area ? { trabajador: { area } } : {}),
        },
      },
      include: {
        articulo: true,
        entrega: { include: { trabajador: true } },
      },
      orderBy: { entrega: { fechaEntrega: 'desc' } },
    })

    const filas = detalles.map((d) => ({
      dni: d.entrega.trabajador.dni,
      trabajador: `${d.entrega.trabajador.apellidos}, ${d.entrega.trabajador.nombres}`,
      area: d.entrega.trabajador.area,
      articulo: d.articulo.nombre,
      talla: d.articulo.talla ?? '-',
      cantidad: d.cantidad,
      costoUnitario: d.costoUnitarioMomento,
      costoTotal: d.costoTotal,
      fechaEntrega: format(new Date(d.entrega.fechaEntrega), 'dd/MM/yyyy'),
      fechaRenovacion: format(new Date(d.fechaRenovacionCalc), 'dd/MM/yyyy'),
      estado: d.estadoRenovacion,
    }))

    return NextResponse.json(filas)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener reporte' }, { status: 500 })
  }
}
