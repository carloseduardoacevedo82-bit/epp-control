import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generarZipConstancias, generarZipConstanciasMensual, normalizarNombreCarpeta } from '@/lib/structuredStorageService'
import type { CarpetaTrabajadorConstancias, ConstanciaArchivoItem } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const downloadZip = searchParams.get('zip') === 'true'
    const filtroCarpeta = searchParams.get('carpeta')
    const filtroMes = searchParams.get('mes') // Ej: '2026-09', 'todos'

    // Si se solicita descarga en archivo ZIP
    if (downloadZip) {
      let zipBuffer: Buffer
      let nombreZip: string

      if (filtroMes && filtroMes !== 'todos' && filtroMes !== 'all') {
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

    // 1. Obtener todas las entregas para construir el catálogo histórico de meses
    const todasLasEntregas = await prisma.entrega.findMany({
      select: {
        id: true,
        fechaEntrega: true,
        detalles: { select: { costoTotal: true, cantidad: true } },
      },
      orderBy: { fechaEntrega: 'desc' },
    })

    // Mapear meses con datos
    const mapaMeses = new Map<string, { mes: string; label: string; totalActas: number; totalPrendas: number; totalCosto: number }>()

    const mesActualStr = format(new Date(), 'yyyy-MM')
    // Garantizar que el mes actual siempre figure
    const fechaActualDate = new Date()
    const labelMesActual = format(fechaActualDate, 'MMMM yyyy', { locale: es })
    mapaMeses.set(mesActualStr, {
      mes: mesActualStr,
      label: labelMesActual.charAt(0).toUpperCase() + labelMesActual.slice(1),
      totalActas: 0,
      totalPrendas: 0,
      totalCosto: 0,
    })

    for (const e of todasLasEntregas) {
      const mStr = format(new Date(e.fechaEntrega), 'yyyy-MM')
      const labelM = format(new Date(e.fechaEntrega), 'MMMM yyyy', { locale: es })
      const capitalLabel = labelM.charAt(0).toUpperCase() + labelM.slice(1)
      
      const prendas = e.detalles.reduce((acc, d) => acc + d.cantidad, 0)
      const costo = e.detalles.reduce((acc, d) => acc + d.costoTotal, 0)

      if (!mapaMeses.has(mStr)) {
        mapaMeses.set(mStr, {
          mes: mStr,
          label: capitalLabel,
          totalActas: 0,
          totalPrendas: 0,
          totalCosto: 0,
        })
      }

      const mData = mapaMeses.get(mStr)!
      mData.totalActas++
      mData.totalPrendas += prendas
      mData.totalCosto += costo
    }

    const mesesDisponibles = Array.from(mapaMeses.values()).sort((a, b) => b.mes.localeCompare(a.mes))

    // 2. Filtro de entregas a retornar
    let whereCondition: any = {}
    const esFiltroHistoricoCompleto = !filtroMes || filtroMes === 'todos' || filtroMes === 'all'

    if (!esFiltroHistoricoCompleto && filtroMes) {
      // Manejar mes YYYY-MM seguro con rango UTC
      const [yearStr, monthStr] = filtroMes.split('-')
      const y = parseInt(yearStr, 10)
      const m = parseInt(monthStr, 10)
      
      // Fecha inicio: 1er dia del mes a las 00:00:00 UTC
      const inicioMes = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0))
      // Fecha fin: último milisegundo del mes UTC (mes m día 0 da el último día del mes m-1)
      const finMes = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999))

      whereCondition = {
        fechaEntrega: {
          gte: inicioMes,
          lte: finMes,
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
    let inversionTotalPeriodo = 0
    let totalPrendasPeriodo = 0

    for (const e of entregas) {
      const t = e.trabajador
      const nombreCarpeta = normalizarNombreCarpeta(t.dni, t.apellidos)

      if (!carpetasMap.has(nombreCarpeta)) {
        carpetasMap.set(nombreCarpeta, {
          dni: t.dni,
          codigoFotocheck: t.codigoFotocheck || undefined,
          apellidosNombres: `${t.apellidos}, ${t.nombres}`,
          area: t.area,
          cargo: t.cargo,
          estado: t.estado,
          trabajadorId: t.id,
          rutaCarpeta: `/constancias/${nombreCarpeta}`,
          totalConstancias: 0,
          archivos: [],
        })
      }

      const carpeta = carpetasMap.get(nombreCarpeta)!
      carpeta.totalConstancias++

      const costoTotal = e.detalles.reduce((s, d) => s + d.costoTotal, 0)
      const totalItems = e.detalles.reduce((s, d) => s + d.cantidad, 0)

      inversionTotalPeriodo += costoTotal
      totalPrendasPeriodo += totalItems

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
        firmaDigitalUrl: e.firmaDigitalUrl,
        firmaSupervisorUrl: e.firmaSupervisorUrl,
        supervisorNombre: e.supervisorNombre,
        supervisorCargo: e.supervisorCargo,
      })
    }

    const listaCarpetas = Array.from(carpetasMap.values())

    return NextResponse.json({
      ok: true,
      periodoSeleccionado: esFiltroHistoricoCompleto ? 'todos' : filtroMes,
      mesActual: mesActualStr,
      mesesDisponibles,
      resumenPeriodo: {
        totalActas: entregas.length,
        totalCarpetas: listaCarpetas.length,
        totalPrendas: totalPrendasPeriodo,
        inversionTotal: inversionTotalPeriodo,
      },
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
