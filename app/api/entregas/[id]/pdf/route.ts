import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generarActaPDFBuffer } from '@/lib/generatePDF'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entregaId = parseInt(id, 10)

    if (isNaN(entregaId)) {
      return NextResponse.json({ error: 'ID de entrega inválido' }, { status: 400 })
    }

    const entrega = await prisma.entrega.findUnique({
      where: { id: entregaId },
      include: {
        trabajador: true,
        detalles: {
          include: { articulo: true },
        },
      },
    })

    if (!entrega) {
      return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })
    }

    const pdfBuffer = generarActaPDFBuffer(entrega as any)
    const folio = `ENT-${String(entrega.id).padStart(5, '0')}`
    const apellidoLimpio = entrega.trabajador.apellidos
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
    const nombreArchivo = `Constancia_${folio}_${entrega.trabajador.dni}_${apellidoLimpio}.pdf`

    return new Response(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${nombreArchivo}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error: any) {
    console.error('Error generando stream de PDF:', error)
    return NextResponse.json({ error: 'Error al generar documento PDF' }, { status: 500 })
  }
}
