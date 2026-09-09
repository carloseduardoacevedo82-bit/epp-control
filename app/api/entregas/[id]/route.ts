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

    // 1. Obtener entrega actual
    const entregaActual = await prisma.entrega.findUnique({
      where: { id: entregaId },
      include: { trabajador: true, detalles: true },
    })

    if (!entregaActual) {
      return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })
    }

    const fechaReal = fechaEntrega ? new Date(fechaEntrega) : entregaActual.fechaEntrega

    // ═══════════════════════════════════════════════════════════════════════════
    // CAPA DE SEGURIDAD 1: Pre-validar stock ANTES de tocar cualquier dato.
    // Construimos el stock efectivo (actual + lo que devolvería esta entrega)
    // y comprobamos que alcanza para TODOS los nuevos artículos.
    // Si hay cualquier problema, rechazamos SIN haber modificado nada en BD.
    // ═══════════════════════════════════════════════════════════════════════════
    {
      const devolucionMap: Record<number, number> = {}
      for (const det of entregaActual.detalles) {
        devolucionMap[det.articuloId] = (devolucionMap[det.articuloId] ?? 0) + det.cantidad
      }

      const articuloIds = [...new Set(detalles.map((d: { articuloId: number }) => d.articuloId))]
      const articulosBD = await prisma.articuloEPP.findMany({
        where: { id: { in: articuloIds as number[] } },
      })
      const articuloMap = new Map(articulosBD.map(a => [a.id, a]))

      const erroresStock: string[] = []
      for (const det of detalles) {
        const art = articuloMap.get(det.articuloId)
        if (!art) {
          erroresStock.push(`Artículo ID ${det.articuloId} no existe`)
          continue
        }
        const stockEfectivo = art.stockActual + (devolucionMap[det.articuloId] ?? 0)
        if (det.cantidad <= 0) {
          erroresStock.push(`Cantidad inválida (${det.cantidad}) para: ${art.nombre}`)
        } else if (stockEfectivo < det.cantidad) {
          erroresStock.push(
            `Stock insuficiente para "${art.nombre}": necesitas ${det.cantidad}, disponible ${stockEfectivo}`
          )
        }
      }

      if (erroresStock.length > 0) {
        return NextResponse.json(
          { error: `No se puede guardar. Problemas de stock:\n• ${erroresStock.join('\n• ')}` },
          { status: 422 }
        )
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAPA DE SEGURIDAD 2: Protección de firmas existentes.
    // Solo se modifica una firma si llega un string válido (>10 chars = base64 real)
    // o el flag explícito clearFirma=true. Nunca se borra una firma por accidente.
    //   undefined = no tocar el campo existente
    //   null      = borrado explícito (requiere clearFirma=true)
    //   string    = nueva firma
    // ═══════════════════════════════════════════════════════════════════════════
    const firmaColaboradorNueva: string | null | undefined =
      typeof firmaDigitalUrl === 'string' && firmaDigitalUrl.length > 10
        ? firmaDigitalUrl
        : body.clearFirmaColaborador === true
        ? null
        : undefined // mantener la existente

    const firmaSupervisorNueva: string | null | undefined =
      typeof firmaSupervisorUrl === 'string' && firmaSupervisorUrl.length > 10
        ? firmaSupervisorUrl
        : body.clearFirmaSupervisor === true
        ? null
        : undefined // mantener la existente

    // ═══════════════════════════════════════════════════════════════════════════
    // TRANSACCIÓN ATÓMICA — todo o nada
    // ═══════════════════════════════════════════════════════════════════════════
    const entregaActualizada = await prisma.$transaction(async (tx) => {
      // Devolver stock de artículos anteriores
      for (const det of entregaActual.detalles) {
        await tx.articuloEPP.update({
          where: { id: det.articuloId },
          data: { stockActual: { increment: det.cantidad } },
        })
      }

      // Eliminar detalles anteriores
      await tx.detalleEntrega.deleteMany({ where: { entregaId } })

      // Crear nuevos detalles y descontar stock
      for (const det of detalles) {
        const articulo = await tx.articuloEPP.findUnique({ where: { id: det.articuloId } })
        if (!articulo) throw new Error(`Artículo ${det.articuloId} no encontrado`)
        // Segunda guardia de stock dentro de la transacción (por si hubo cambio concurrente)
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

      // ═══════════════════════════════════════════════════════════════════════
      // CAPA DE SEGURIDAD 3: Solo actualizar campos enviados explícitamente.
      // Cualquier campo no enviado conserva su valor anterior.
      // ═══════════════════════════════════════════════════════════════════════
      const updateData: Record<string, unknown> = {
        observaciones: observaciones !== undefined ? observaciones : entregaActual.observaciones,
        fechaEntrega: fechaReal,
      }

      // Firma del colaborador
      if (firmaColaboradorNueva !== undefined) {
        updateData.firmaDigitalUrl = firmaColaboradorNueva
      }

      // Firma del supervisor
      if (firmaSupervisorNueva !== undefined) {
        updateData.firmaSupervisorUrl = firmaSupervisorNueva
        if (firmaSupervisorNueva) {
          updateData.supervisorNombre = supervisorNombre ?? entregaActual.supervisorNombre
          updateData.supervisorCargo  = supervisorCargo  ?? entregaActual.supervisorCargo
          updateData.fechaFirmaSupervisor = new Date()
        } else {
          // Borrado explícito con clearFirmaSupervisor=true
          updateData.supervisorNombre = null
          updateData.supervisorCargo  = null
          updateData.fechaFirmaSupervisor = null
        }
      } else if (supervisorNombre !== undefined || supervisorCargo !== undefined) {
        // Solo cambió el nombre/cargo del supervisor (sin tocar la firma)
        updateData.supervisorNombre = supervisorNombre ?? entregaActual.supervisorNombre
        updateData.supervisorCargo  = supervisorCargo  ?? entregaActual.supervisorCargo
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
