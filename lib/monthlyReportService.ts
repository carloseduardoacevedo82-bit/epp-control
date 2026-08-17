import fs from 'fs'
import path from 'path'
import * as XLSX from 'xlsx'
import { prisma } from './prisma'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

export interface CierreMensualInfo {
  mesClave: string // '2026-08'
  nombreMes: string // 'Agosto 2026'
  archivoExcel: string
  rutaRelativa: string
  rutaAbsoluta: string
  totalEntregas: number
  totalItems: number
  totalGasto: number
  totalTrabajadores: number
  fechaGenerado: string
  existeEnDisco: boolean
}

const CARPETA_REPORTES = path.join(process.cwd(), 'reportes_mensuales')

// Asegura que la carpeta principal exista
export function asegurarCarpetaReportes() {
  if (!fs.existsSync(CARPETA_REPORTES)) {
    fs.mkdirSync(CARPETA_REPORTES, { recursive: true })
  }
  return CARPETA_REPORTES
}

export async function generarCierreMensual(mesFecha: Date): Promise<CierreMensualInfo> {
  asegurarCarpetaReportes()

  const fechaInicio = startOfMonth(mesFecha)
  const fechaFin = endOfMonth(mesFecha)
  const mesClave = format(fechaInicio, 'yyyy-MM')
  const nombreMes = format(fechaInicio, "MMMM 'de' yyyy", { locale: es })
  const nombreMesCap = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)

  // Crear subcarpeta para el mes
  const carpetaMes = path.join(CARPETA_REPORTES, mesClave)
  if (!fs.existsSync(carpetaMes)) {
    fs.mkdirSync(carpetaMes, { recursive: true })
  }

  // Consultar todas las entregas del mes
  const entregas = await prisma.entrega.findMany({
    where: {
      fechaEntrega: {
        gte: fechaInicio,
        lte: fechaFin,
      },
    },
    include: {
      trabajador: true,
      detalles: {
        include: {
          articulo: true,
        },
      },
    },
    orderBy: {
      fechaEntrega: 'asc',
    },
  })

  // Aplanar datos para el reporte
  const filas: any[] = []
  let totalGasto = 0
  let totalItems = 0
  const trabajadoresIds = new Set<number>()

  for (const e of entregas) {
    trabajadoresIds.add(e.trabajador.id)
    for (const d of e.detalles) {
      totalGasto += d.costoTotal
      totalItems += d.cantidad
      filas.push({
        idEntrega: `ENT-${String(e.id).padStart(5, '0')}`,
        dni: e.trabajador.dni,
        trabajador: `${e.trabajador.apellidos}, ${e.trabajador.nombres}`,
        cargo: e.trabajador.cargo,
        area: e.trabajador.area,
        codigo: d.articulo.codigo,
        articulo: d.articulo.nombre,
        categoria: d.articulo.categoria,
        talla: d.articulo.talla || 'Único',
        cantidad: d.cantidad,
        costoUnitario: d.costoUnitarioMomento,
        costoTotal: d.costoTotal,
        fechaEntrega: format(new Date(e.fechaEntrega), 'dd/MM/yyyy'),
        fechaRenovacion: format(new Date(d.fechaRenovacionCalc), 'dd/MM/yyyy'),
        estado: d.estadoRenovacion,
        observaciones: e.observaciones || '—',
      })
    }
  }

  // ── Generar Libro Excel XLSX ──────────────────────────────────────────────
  const wb = XLSX.utils.book_new()

  // 1. Hoja: Detalle de Entregas
  const encabezadoEmpresa = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    ['SISTEMA DE CONTROL Y GESTIÓN DE ENTREGA DE EPPS Y UNIFORMES'],
    [`CIERRE MENSUAL DE ENTREGAS DE EPP Y UNIFORMES — ${nombreMesCap.toUpperCase()}`],
    [`RUC: 20615714128  |  Fecha de Emisión: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}  |  Estado: OFICIAL AUDITABLE`],
    [],
    ['N° Constancia', 'DNI', 'Trabajador (Apellidos y Nombres)', 'Cargo', 'Área', 'Código SKU', 'Artículo EPP / Uniforme', 'Categoría', 'Talla', 'Cant.', 'Costo Unit. (S/)', 'Costo Total (S/)', 'F. Entrega', 'F. Renovación', 'Estado Vida Útil', 'Observaciones'],
  ]

  const datosTabla = filas.map(f => [
    f.idEntrega,
    String(f.dni || ''),
    f.trabajador || '',
    f.cargo || '',
    f.area || '',
    f.codigo || '',
    f.articulo || '',
    f.categoria || '',
    f.talla || 'Estándar',
    Number(f.cantidad) || 0,
    Number(Number(f.costoUnitario || 0).toFixed(2)),
    Number(Number(f.costoTotal || 0).toFixed(2)),
    f.fechaEntrega || '',
    f.fechaRenovacion || '',
    f.estado || '',
    f.observaciones || '—',
  ])

  const totalGastoNum = Number(totalGasto.toFixed(2))
  const filaTotal = ['TOTALES GENERALES:', '', '', '', '', '', '', '', '', totalItems, '', totalGastoNum, '', '', '', '']
  const wsDetalle = XLSX.utils.aoa_to_sheet([...encabezadoEmpresa, ...datosTabla, [], filaTotal])

  wsDetalle['!cols'] = [
    { wch: 16 }, { wch: 14 }, { wch: 36 }, { wch: 24 }, { wch: 20 },
    { wch: 15 }, { wch: 40 }, { wch: 24 }, { wch: 12 }, { wch: 10 },
    { wch: 16 }, { wch: 16 }, { wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 32 },
  ]

  wsDetalle['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 15 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 15 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } },
    { s: { r: encabezadoEmpresa.length + datosTabla.length + 1, c: 0 }, e: { r: encabezadoEmpresa.length + datosTabla.length + 1, c: 8 } },
  ]

  wsDetalle['!autofilter'] = { ref: `A6:P${6 + datosTabla.length}` }

  // Formatear columnas de moneda
  const rangeDet = XLSX.utils.decode_range(wsDetalle['!ref'] || 'A1:P100')
  for (let R = 6; R <= rangeDet.e.r; ++R) {
    const cellK = wsDetalle[XLSX.utils.encode_cell({ r: R, c: 10 })]
    if (cellK && typeof cellK.v === 'number') cellK.z = '"S/" #,##0.00'
    const cellL = wsDetalle[XLSX.utils.encode_cell({ r: R, c: 11 })]
    if (cellL && typeof cellL.v === 'number') cellL.z = '"S/" #,##0.00'
  }

  XLSX.utils.book_append_sheet(wb, wsDetalle, '1. Detalle de Entregas')

  // 2. Hoja: Resumen por Área
  const areas = [...new Set(filas.map(f => f.area))]
  const encArea = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    [`RESUMEN DE CONSUMO POR ÁREA — ${nombreMesCap.toUpperCase()}`],
    [`RUC: 20615714128  |  Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`],
    [],
    ['Área de Trabajo', 'Total Ítems Entregados', 'Gasto Total (S/)', 'Trabajadores Atendidos'],
  ]
  const datosArea = areas.map(area => {
    const areaFilas = filas.filter(f => f.area === area)
    return [
      area,
      areaFilas.reduce((s, f) => s + f.cantidad, 0),
      Number(areaFilas.reduce((s, f) => s + f.costoTotal, 0).toFixed(2)),
      new Set(areaFilas.map(f => f.dni)).size,
    ]
  })
  const wsArea = XLSX.utils.aoa_to_sheet([...encArea, ...datosArea])
  wsArea['!cols'] = [{ wch: 28 }, { wch: 24 }, { wch: 20 }, { wch: 25 }]
  wsArea['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
  ]
  wsArea['!autofilter'] = { ref: `A5:D${5 + datosArea.length}` }
  XLSX.utils.book_append_sheet(wb, wsArea, '2. Resumen por Área')

  // 3. Hoja: Resumen por Categoría EPP
  const categorias = [...new Set(filas.map(f => f.categoria))]
  const encCat = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    [`RESUMEN POR CATEGORÍA DE EPP — ${nombreMesCap.toUpperCase()}`],
    [`RUC: 20615714128  |  Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`],
    [],
    ['Categoría EPP', 'Total Unidades', 'Inversión Total (S/)'],
  ]
  const datosCat = categorias.map(cat => {
    const catFilas = filas.filter(f => f.categoria === cat)
    return [
      cat,
      catFilas.reduce((s, f) => s + f.cantidad, 0),
      Number(catFilas.reduce((s, f) => s + f.costoTotal, 0).toFixed(2)),
    ]
  })
  const wsCat = XLSX.utils.aoa_to_sheet([...encCat, ...datosCat])
  wsCat['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 22 }]
  wsCat['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
  ]
  wsCat['!autofilter'] = { ref: `A5:C${5 + datosCat.length}` }
  XLSX.utils.book_append_sheet(wb, wsCat, '3. Resumen por Categoría')

  // Guardar archivo Excel en disco usando Buffer
  const nombreArchivo = `Cierre_Mensual_DALUPEZMAR_${mesClave}.xlsx`
  const rutaAbsoluta = path.join(carpetaMes, nombreArchivo)
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  fs.writeFileSync(rutaAbsoluta, excelBuffer)

  // Guardar archivo metadata JSON
  const infoCierre: CierreMensualInfo = {
    mesClave,
    nombreMes: nombreMesCap,
    archivoExcel: nombreArchivo,
    rutaRelativa: path.relative(process.cwd(), rutaAbsoluta),
    rutaAbsoluta,
    totalEntregas: entregas.length,
    totalItems,
    totalGasto,
    totalTrabajadores: trabajadoresIds.size,
    fechaGenerado: new Date().toISOString(),
    existeEnDisco: true,
  }

  const rutaJson = path.join(carpetaMes, `metadata_${mesClave}.json`)
  fs.writeFileSync(rutaJson, JSON.stringify(infoCierre, null, 2), 'utf-8')

  return infoCierre
}

// Lista todos los cierres mensuales disponibles en la carpeta
export async function listarCierresMensuales(): Promise<CierreMensualInfo[]> {
  asegurarCarpetaReportes()

  const carpetas = fs.readdirSync(CARPETA_REPORTES).filter(item => {
    const fullPath = path.join(CARPETA_REPORTES, item)
    return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}$/.test(item)
  })

  const resultados: CierreMensualInfo[] = []

  for (const mesClave of carpetas.sort().reverse()) {
    const carpetaMes = path.join(CARPETA_REPORTES, mesClave)
    const rutaJson = path.join(carpetaMes, `metadata_${mesClave}.json`)
    const rutaExcel = path.join(carpetaMes, `Cierre_Mensual_DALUPEZMAR_${mesClave}.xlsx`)

    if (fs.existsSync(rutaJson)) {
      try {
        const raw = fs.readFileSync(rutaJson, 'utf-8')
        const data = JSON.parse(raw) as CierreMensualInfo
        data.existeEnDisco = fs.existsSync(rutaExcel)
        resultados.push(data)
      } catch (err) {
        // Fallback si no hay json válido
      }
    } else if (fs.existsSync(rutaExcel)) {
      const stats = fs.statSync(rutaExcel)
      resultados.push({
        mesClave,
        nombreMes: mesClave,
        archivoExcel: `Cierre_Mensual_DALUPEZMAR_${mesClave}.xlsx`,
        rutaRelativa: path.relative(process.cwd(), rutaExcel),
        rutaAbsoluta: rutaExcel,
        totalEntregas: 0,
        totalItems: 0,
        totalGasto: 0,
        totalTrabajadores: 0,
        fechaGenerado: stats.mtime.toISOString(),
        existeEnDisco: true,
      })
    }
  }

  return resultados
}
