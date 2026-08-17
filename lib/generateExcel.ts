import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import type { FilaReporte } from './types'

export function exportarExcel(filas: FilaReporte[], titulo = 'Reporte_EPP'): void {
  if (!filas.length) return

  const wb = XLSX.utils.book_new()

  // ── Hoja principal ───────────────────────────────────────────────────────
  const encabezados = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    ['SISTEMA DE CONTROL Y GESTIÓN DE ENTREGA DE EPPS Y UNIFORMES'],
    ['REPORTE DE ENTREGAS Y ACTAS DE EPP'],
    [`RUC: 20615714128  |  Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}  |  OFICIAL AUDITABLE`],
    [],
    ['DNI', 'Trabajador (Apellidos y Nombres)', 'Área Operativa', 'Artículo EPP / Prenda', 'Talla', 'Cant.', 'Costo Unit. (S/)', 'Costo Total (S/)', 'Fecha Entrega', 'Fecha Renovación', 'Estado Vida Útil'],
  ]

  const datos = filas.map((f) => [
    String(f.dni || ''),
    f.trabajador || '',
    f.area || '',
    f.articulo || '',
    f.talla || 'Estándar',
    Number(f.cantidad) || 0,
    Number(Number(f.costoUnitario || 0).toFixed(2)),
    Number(Number(f.costoTotal || 0).toFixed(2)),
    f.fechaEntrega || '',
    f.fechaRenovacion || '',
    f.estado || '',
  ])

  // Total
  const totalCosto = Number(filas.reduce((sum, f) => sum + f.costoTotal, 0).toFixed(2))
  const totalCant = filas.reduce((sum, f) => sum + f.cantidad, 0)
  const fila_total = ['TOTALES GENERALES:', '', '', '', '', totalCant, '', totalCosto, '', '', '']

  const wsData = [...encabezados, ...datos, [], fila_total]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Anchos de columna
  ws['!cols'] = [
    { wch: 14 }, // DNI
    { wch: 36 }, // Trabajador
    { wch: 22 }, // Área
    { wch: 38 }, // Artículo
    { wch: 12 }, // Talla
    { wch: 10 }, // Cantidad
    { wch: 16 }, // Costo Unit
    { wch: 16 }, // Costo Total
    { wch: 15 }, // Fecha Entrega
    { wch: 16 }, // Fecha Renovación
    { wch: 18 }, // Estado
  ]

  // Merge para encabezado empresa
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 10 } },
    { s: { r: encabezados.length + datos.length + 1, c: 0 }, e: { r: encabezados.length + datos.length + 1, c: 4 } },
  ]

  ws['!autofilter'] = { ref: `A6:K${6 + datos.length}` }

  // Formatear columnas de moneda
  const rangeX = XLSX.utils.decode_range(ws['!ref'] || 'A1:K100')
  for (let R = 6; R <= rangeX.e.r; ++R) {
    const cellF = ws[XLSX.utils.encode_cell({ r: R, c: 5 })]
    if (cellF && typeof cellF.v === 'number') cellF.z = '#,##0'
    const cellG = ws[XLSX.utils.encode_cell({ r: R, c: 6 })]
    if (cellG && typeof cellG.v === 'number') cellG.z = '"S/" #,##0.00'
    const cellH = ws[XLSX.utils.encode_cell({ r: R, c: 7 })]
    if (cellH && typeof cellH.v === 'number') cellH.z = '"S/" #,##0.00'
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Entregas EPP')

  // ── Hoja de resumen por área ─────────────────────────────────────────────
  const areas = [...new Set(filas.map((f) => f.area))]
  const resumenArea = areas.map((area) => {
    const areaFilas = filas.filter((f) => f.area === area)
    return {
      Área: area,
      'Cant. Entregas': areaFilas.length,
      'Gasto Total (S/)': areaFilas.reduce((s, f) => s + f.costoTotal, 0).toFixed(2),
    }
  })

  const wsResumen = XLSX.utils.json_to_sheet(resumenArea)
  wsResumen['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen por Área')

  // Descargar
  const nombreArchivo = `${titulo}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
