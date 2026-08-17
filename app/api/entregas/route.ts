import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, format } from 'date-fns'
import { guardarConstanciaEnDisco } from '@/lib/structuredStorageService'
import { generarActaPDFBuffer } from '@/lib/generatePDF'
import type { Entrega } from '@/lib/types'

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
    const trabajadorId = searchParams.get('trabajadorId')
    const limit = Number(searchParams.get('limit') || 100)

    const entregas = await prisma.entrega.findMany({
      where: trabajadorId ? { trabajadorId: Number(trabajadorId) } : {},
      include: {
        trabajador: true,
        detalles: { include: { articulo: true } },
        constanciaArchivos: true,
      },
      orderBy: { fechaEntrega: 'desc' },
      take: limit,
    })
    return NextResponse.json(entregas)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener entregas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { trabajadorId, firmaDigitalUrl, observaciones, detalles, creadoPorId } = body

    if (!trabajadorId || !detalles?.length) {
      return NextResponse.json({ error: 'Datos incompletos: trabajador o artículos faltantes' }, { status: 400 })
    }

    const trabajador = await prisma.trabajador.findUnique({
      where: { id: trabajadorId },
    })

    if (!trabajador) {
      return NextResponse.json({ error: 'El trabajador no existe en el sistema' }, { status: 404 })
    }

    // Crear entrega + detalles en transacción
    const entrega = await prisma.$transaction(async (tx) => {
      const nuevaEntrega = await tx.entrega.create({
        data: {
          trabajadorId,
          firmaDigitalUrl,
          observaciones,
          creadoPorId: creadoPorId ? Number(creadoPorId) : null,
          fechaEntrega: new Date(),
        },
      })

      for (const det of detalles) {
        const articulo = await tx.articuloEPP.findUnique({ where: { id: det.articuloId } })
        if (!articulo) throw new Error(`Artículo ${det.articuloId} no encontrado`)
        if (articulo.stockActual < det.cantidad) {
          throw new Error(`Stock insuficiente para: ${articulo.nombre} (Disponible: ${articulo.stockActual})`)
        }

        const fechaRen = addDays(new Date(), articulo.vidaUtilDias)

        await tx.detalleEntrega.create({
          data: {
            entregaId: nuevaEntrega.id,
            articuloId: det.articuloId,
            cantidad: det.cantidad,
            costoUnitarioMomento: articulo.costoUnitario,
            costoTotal: articulo.costoUnitario * det.cantidad,
            fechaRenovacionCalc: fechaRen,
            estadoRenovacion: calcEstado(fechaRen),
          },
        })

        // Descontar stock
        await tx.articuloEPP.update({
          where: { id: det.articuloId },
          data: { stockActual: { decrement: det.cantidad } },
        })
      }

      return nuevaEntrega
    })

    // Consultar entrega completa con relaciones
    const entregaCompleta = await prisma.entrega.findUnique({
      where: { id: entrega.id },
      include: {
        trabajador: true,
        detalles: { include: { articulo: true } },
      },
    })

    if (entregaCompleta) {
      try {
        // Generar y archivar el PDF automáticamente en la estructura de carpetas
        const pdfBuffer = generarActaPDFBuffer(entregaCompleta as unknown as Entrega)
        const rutaRelativa = await guardarConstanciaEnDisco(
          trabajador.dni,
          trabajador.apellidos,
          entregaCompleta.fechaEntrega,
          entregaCompleta.id,
          pdfBuffer
        )

        // Actualizar la entrega con la ruta y registrar en ConstanciaArchivo
        await prisma.entrega.update({
          where: { id: entregaCompleta.id },
          data: {
            rutaPdf: rutaRelativa,
            hashVerificacion: `DAL-${entregaCompleta.id}-${trabajador.dni.slice(-4)}`,
          },
        })

        await prisma.constanciaArchivo.create({
          data: {
            entregaId: entregaCompleta.id,
            trabajadorId: trabajador.id,
            rutaRelativa,
            nombreArchivo: rutaRelativa.split('/').pop() || 'Acta.pdf',
            pesoBytes: pdfBuffer.byteLength,
            mimeType: 'application/pdf',
          },
        })

        // Asignar en respuesta
        entregaCompleta.rutaPdf = rutaRelativa
      } catch (pdfErr) {
        console.warn('Advertencia al guardar PDF estructurado en disco:', pdfErr)
      }
    }

    return NextResponse.json(entregaCompleta, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al crear entrega'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
