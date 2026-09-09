import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'
import { generarActaPDFBuffer } from '@/lib/generatePDF'
import { guardarConstanciaEnDisco } from '@/lib/structuredStorageService'
import type { Entrega } from '@/lib/types'

function calcEstado(fechaRenovacion: Date): string {
  const hoy = new Date()
  const diff = Math.floor((fechaRenovacion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Vencido'
  if (diff <= 15) return 'Por Vencer'
  return 'Vigente'
}

// GET /api/entregas/:id — obtener una entrega individual completa
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entregaId = parseInt(id, 10)
    if (isNaN(entregaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const entrega = await prisma.entrega.findUnique({
      where: { id: entregaId },
      include: {
        trabajador: true,
        detalles: { include: { articulo: true } },
        constanciaArchivos: true,
      },
    })

    if (!entrega) {
      return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })
    }

    return NextResponse.json(entrega)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener entrega' }, { status: 500 })
  }
}

// PATCH /api/entregas/:id — editar entrega existente (artículos + firmas)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entregaId = parseInt(id, 10)
    if (isNaN(entregaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const {
      detalles,
      firmaDigitalUrl,
      firmaSupervisorUrl,
      supervisorNombre,
      supervisorCargo,
      observaciones,
      fechaEntrega,
    } = body

    if (!detalles?.length) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un artículo en la entrega' },
        { status: 400 }
      )
    }

    // 1. Obtener entrega actual para devolver stock
    const entregaActual = await prisma.entrega.findUnique({
      where: { id: entregaId },
      include: {
        trabajador: true,
        detalles: true,
      },
    })

    if (!entregaActual) {
      return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })
    }

    const fechaReal = fechaEntrega ? new Date(fechaEntrega) : entregaActual.fechaEntrega

    // 2. Transacción: devolver stock anterior → eliminar detalles → crear nuevos → actualizar entrega
    const entregaActualizada = await prisma.$transaction(async (tx) => {
      // Devolver stock de artículos anteriores
      for (const det of entregaActual.detalles) {
        await tx.articuloEPP.update({
          where: { id: det.articuloId },
          data: { stockActual: { increment: det.cantidad } },
        })
      }

      // Eliminar detalles anteriores (cascade en BD, pero lo hacemos explícitamente)
      await tx.detalleEntrega.deleteMany({ where: { entregaId } })

      // Crear nuevos detalles y descontar stock
      for (const det of detalles) {
        const articulo = await tx.articuloEPP.findUnique({ where: { id: det.articuloId } })
        if (!articulo) throw new Error(`Artículo ${det.articuloId} no encontrado`)
        if (articulo.stockActual < det.cantidad) {
          throw new Error(
            `Stock insuficiente para: ${articulo.nombre} (Disponible: ${articulo.stockActual})`
          )
        }

        const fechaRen = addDays(fechaReal, articulo.vidaUtilDias)

        await tx.detalleEntrega.create({
          data: {
            entregaId,
            articuloId: det.articuloId,
            cantidad: det.cantidad,
            costoUnitarioMomento: articulo.costoUnitario,
            costoTotal: articulo.costoUnitario * det.cantidad,
            fechaRenovacionCalc: fechaRen,
            estadoRenovacion: calcEstado(fechaRen),
          },
        })

        await tx.articuloEPP.update({
          where: { id: det.articuloId },
          data: { stockActual: { decrement: det.cantidad } },
        })
      }

      // Actualizar cabecera de la entrega
      const updateData: Record<string, unknown> = {
        observaciones: observaciones ?? entregaActual.observaciones,
        fechaEntrega: fechaReal,
      }

      // Firmas: solo actualizar si se envían nuevos valores (null explícito también es válido)
      if ('firmaDigitalUrl' in body) {
        updateData.firmaDigitalUrl = firmaDigitalUrl
      }
      if ('firmaSupervisorUrl' in body) {
        updateData.firmaSupervisorUrl = firmaSupervisorUrl
        updateData.supervisorNombre = supervisorNombre ?? null
        updateData.supervisorCargo = supervisorCargo ?? null
        updateData.fechaFirmaSupervisor = firmaSupervisorUrl ? new Date() : null
      }

      return tx.entrega.update({
        where: { id: entregaId },
        data: updateData,
        include: {
          trabajador: true,
          detalles: { include: { articulo: true } },
          constanciaArchivos: true,
        },
      })
    })

    // 3. Regenerar PDF y actualizar constancia en disco
    try {
      const pdfBuffer = generarActaPDFBuffer(entregaActualizada as unknown as Entrega)
      const rutaRelativa = await guardarConstanciaEnDisco(
        entregaActualizada.trabajador.dni,
        entregaActualizada.trabajador.apellidos,
        entregaActualizada.fechaEntrega,
        entregaActualizada.id,
        pdfBuffer
      )

      await prisma.entrega.update({
        where: { id: entregaId },
        data: {
          rutaPdf: rutaRelativa,
          hashVerificacion: `DAL-${entregaId}-${entregaActualizada.trabajador.dni.slice(-4)}`,
        },
      })

      // Actualizar o crear registro en ConstanciaArchivo
      const constanciaExistente = await prisma.constanciaArchivo.findFirst({
        where: { entregaId },
      })

      if (constanciaExistente) {
        await prisma.constanciaArchivo.update({
          where: { id: constanciaExistente.id },
          data: {
            rutaRelativa,
            nombreArchivo: rutaRelativa.split('/').pop() || 'Acta.pdf',
            pesoBytes: pdfBuffer.byteLength,
          },
        })
      } else {
        await prisma.constanciaArchivo.create({
          data: {
            entregaId,
            trabajadorId: entregaActualizada.trabajadorId,
            rutaRelativa,
            nombreArchivo: rutaRelativa.split('/').pop() || 'Acta.pdf',
            pesoBytes: pdfBuffer.byteLength,
            mimeType: 'application/pdf',
          },
        })
      }

      // Devolver con rutaPdf actualizado
      entregaActualizada.rutaPdf = rutaRelativa
    } catch (pdfErr) {
      console.warn('Advertencia al regenerar PDF en edición:', pdfErr)
    }

    return NextResponse.json(entregaActualizada)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al editar la entrega'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
