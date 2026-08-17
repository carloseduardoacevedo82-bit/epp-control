import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { FilaValidadaImportacion } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, nombreArchivo, usuarioResponsable } = body as {
      items: FilaValidadaImportacion[]
      nombreArchivo?: string
      usuarioResponsable?: string
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No se enviaron artículos para importar' }, { status: 400 })
    }

    const itemsValidos = items.filter(i => i.esValida)
    if (itemsValidos.length === 0) {
      return NextResponse.json({ error: 'Ninguno de los artículos enviados cumple con las validaciones' }, { status: 400 })
    }

    let insertados = 0
    let actualizados = 0

    // Ejecutar transaccionalmente o en lote
    for (const item of itemsValidos) {
      const existente = await prisma.articuloEPP.findUnique({
        where: { codigo: item.codigo },
      })

      if (existente) {
        await prisma.articuloEPP.update({
          where: { codigo: item.codigo },
          data: {
            nombre: item.nombre,
            categoria: item.categoria,
            talla: item.talla === 'Estándar' ? null : item.talla,
            costoUnitario: item.costoUnitario,
            vidaUtilDias: item.vidaUtilDias,
            stockActual: item.stockActual,
            stockMinimo: item.stockMinimo,
            marcaFabricante: item.marcaFabricante || 'Estándar',
            activo: true,
          },
        })
        actualizados++
      } else {
        await prisma.articuloEPP.create({
          data: {
            codigo: item.codigo,
            nombre: item.nombre,
            categoria: item.categoria,
            talla: item.talla === 'Estándar' ? null : item.talla,
            costoUnitario: item.costoUnitario,
            vidaUtilDias: item.vidaUtilDias,
            stockActual: item.stockActual,
            stockMinimo: item.stockMinimo,
            marcaFabricante: item.marcaFabricante || 'Estándar',
            activo: true,
          },
        })
        insertados++
      }
    }

    // Registrar en Log de Importaciones
    const log = await prisma.logImportacion.create({
      data: {
        nombreArchivo: nombreArchivo || 'Carga_Inventario.xlsx',
        totalFilas: items.length,
        filasExitosas: itemsValidos.length,
        filasConError: items.length - itemsValidos.length,
        usuarioResponsable: usuarioResponsable || 'Admin SST',
        detallesJson: JSON.stringify({
          insertados,
          actualizados,
          erroresTotal: items.length - itemsValidos.length,
        }),
      },
    })

    return NextResponse.json({
      ok: true,
      mensaje: `Importación exitosa: ${insertados} artículos nuevos creados, ${actualizados} actualizados.`,
      insertados,
      actualizados,
      totalProcesados: itemsValidos.length,
      logId: log.id,
    })
  } catch (error: any) {
    console.error('Error al importar artículos:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al procesar la carga masiva' },
      { status: 500 }
    )
  }
}
