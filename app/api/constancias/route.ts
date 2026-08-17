import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generarZipConstancias, generarZipConstanciasMensual, normalizarNombreCarpeta } from '@/lib/structuredStorageService'
import type { CarpetaTrabajadorConstancias, ConstanciaArchivoItem } from '@/lib/types'
import { parseISO, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const downloadZip = searchParams.get('zip') === 'true'
    const filtroCarpeta = searchParams.get('carpeta')
    const filtroMes = searchParams.get('mes') // Ej: '2026-08'

    // Si se solicita descarga en archivo ZIP
    if (downloadZip) {
      let zipBuffer: Buffer
      let nombreZip: string

      if (filtroMes) {
        zipBuffer = await generarZipConstanciasMensual(filtroMes)
        nombreZip = `Constancias_EPP_DALUPEZMAR_${filtroMes}.zip`
      } else if (filtroCarpeta) {
        zipBuffer = await generarZipConstancias(filtroCarpeta)
        nombreZip = `Constancias_${filtroCarpeta}.zip`
      } else {
        zipBuffer = await generarZipConstancias()
        nombreZip = `Constancias_EPP_DALUPEZMAR_Historico_Completo.zip`
      }

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${nombreZip}"`,
        },
      })
    }

    // Listado estructurado de constancias y carpetas
    let whereCondition = {}
    if (filtroMes) {
      const fechaBase = parseISO(`${filtroMes}-01`)
      whereCondition = {
        fechaEntrega: {
          gte: startOfMonth(fechaBase),
          lte: endOfMonth(fechaBase),
        },
      }
    }

    const entregas = await prisma.entrega.findMany({
      where: whereCondition,
      include: {
        trabajador: true,
        detalles: { include: { articulo: true } },
      },
      orderBy: { fechaEntrega: 'desc' },
    })

    const carpetasMap = new Map<string, CarpetaTrabajadorConstancias>()

    for (const e of entregas) {
      const t = e.trabajador
      const nombreCarpeta = normalizarNombreCarpeta(t.dni, t.apellidos)

      if (!carpetasMap.has(nombreCarpeta)) {
        carpetasMap.set(nombreCarpeta, {
          dni: t.dni,
          apellidosNombres: `${t.apellidos}, ${t.nombres}`,
          area: t.area,
          cargo: t.cargo,
          rutaCarpeta: `/constancias/${nombreCarpeta}`,
          totalConstancias: 0,
          archivos: [],
        })
      }

      const carpeta = carpetasMap.get(nombreCarpeta)!
      carpeta.totalConstancias++

      const costoTotal = e.detalles.reduce((s, d) => s + d.costoTotal, 0)
      const totalItems = e.detalles.reduce((s, d) => s + d.cantidad, 0)

      const idPad = String(e.id).padStart(5, '0')
      const fechaStr = new Date(e.fechaEntrega).toISOString().split('T')[0]
      const nombreArchivo = `${fechaStr}_Acta_ENT-${idPad}.pdf`

      carpeta.archivos.push({
        id: e.id,
        entregaId: e.id,
        trabajadorId: t.id,
        trabajadorNombre: `${t.apellidos}, ${t.nombres}`,
        trabajadorDni: t.dni,
        rutaRelativa: e.rutaPdf || `/constancias/${nombreCarpeta}/${nombreArchivo}`,
        nombreArchivo,
        fechaEntrega: e.fechaEntrega.toISOString(),
        totalItems,
        costoTotal,
      })
    }

    const listaCarpetas = Array.from(carpetasMap.values())

    return NextResponse.json({
      ok: true,
      totalCarpetas: listaCarpetas.length,
      totalConstancias: entregas.length,
      carpetas: listaCarpetas,
    })
  } catch (error: any) {
    console.error('Error al listar constancias:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener constancias estructuradas' },
      { status: 500 }
    )
  }
}
