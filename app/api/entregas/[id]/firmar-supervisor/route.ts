import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generarActaPDFBuffer } from '@/lib/generatePDF'
import { guardarConstanciaEnDisco } from '@/lib/structuredStorageService'
import type { Entrega } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entregaId = parseInt(id, 10)

    if (isNaN(entregaId)) {
      return NextResponse.json({ error: 'ID de entrega inválido' }, { status: 400 })
    }

    const body = await req.json()
    const { firmaSupervisorUrl, supervisorNombre, supervisorCargo } = body

    if (!firmaSupervisorUrl || !supervisorNombre) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios: firma del supervisor y nombre' },
        { status: 400 }
      )
    }

    const entregaExistente = await prisma.entrega.findUnique({
      where: { id: entregaId },
      include: {
        trabajador: true,
        detalles: { include: { articulo: true } },
      },
    })

    if (!entregaExistente) {
      return NextResponse.json({ error: 'Constancia no encontrada' }, { status: 404 })
    }

    // Actualizar registro en base de datos
    const entregaActualizada = await prisma.entrega.update({
      where: { id: entregaId },
      data: {
        firmaSupervisorUrl,
        supervisorNombre,
        supervisorCargo: supervisorCargo || 'Supervisor General',
        fechaFirmaSupervisor: new Date(),
      },
      include: {
        trabajador: true,
        detalles: { include: { articulo: true } },
      },
    })

    // Regenerar PDF oficial con ambas firmas y guardarlo en disco
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
        data: { rutaPdf: rutaRelativa },
      })
    } catch (e) {
      console.warn('Advertencia al regenerar PDF en disco:', e)
    }

    return NextResponse.json({
      ok: true,
      mensaje: 'Firma de supervisor registrada con éxito',
      entrega: entregaActualizada,
    })
  } catch (error: any) {
    console.error('Error al registrar firma del supervisor:', error)
    return NextResponse.json(
      { error: error.message || 'Error al procesar la firma del supervisor' },
      { status: 500 }
    )
  }
}
