import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface DatosCierreConsolidado {
  mesClave: string // '2026-08'
  nombreMes: string // 'Agosto de 2026'
  filasEntregas: any[]
  resumenAreas: any[]
  resumenCategorias: any[]
  resumenVidaUtil: any[]
  inventarioValorizado: any[]
}

export function construirLibroConsolidadoMensual(datos: DatosCierreConsolidado): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  const { nombreMes, mesClave, filasEntregas, resumenAreas, resumenCategorias, resumenVidaUtil, inventarioValorizado } = datos

  // ── HOJA 1: DETALLE DE ENTREGAS Y ACTAS (FORMATO TABLA COMPLETO) ────────────
  const enc1 = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    ['SISTEMA DE CONTROL Y GESTIÓN DE ENTREGA DE EPPS Y UNIFORMES'],
    [`REPORTE CONSOLIDADO MENSUAL DE ENTREGAS — ${nombreMes.toUpperCase()}`],
    [`RUC: 20615714128  |  Fecha de Emisión: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}  |  Estado: OFICIAL AUDITABLE`],
    [],
    [
      'N° Folio',
      'DNI',
      'Colaborador (Apellidos y Nombres)',
      'Cargo',
      'Área Operativa',
      'Código SKU',
      'Descripción EPP / Prenda',
      'Categoría',
      'Talla',
      'Marca',
      'Cant.',
      'C. Unit. (S/)',
      'C. Total (S/)',
      'F. Entrega',
      'F. Renovación',
      'Estado Vida Útil',
      'Ruta Acta Digital (PDF)',
    ],
  ]

  const cuerpo1 = filasEntregas.map(f => [
    f.idEntrega || f.folio,
    String(f.dni || ''),
    f.trabajador || '',
    f.cargo || '',
    f.area || '',
    f.codigo || '',
    f.articulo || '',
    f.categoria || '',
    f.talla || 'Estándar',
    f.marcaFabricante || 'Estándar',
    Number(f.cantidad) || 0,
    Number(Number(f.costoUnitario || 0).toFixed(2)),
    Number(Number(f.costoTotal || 0).toFixed(2)),
    f.fechaEntrega || '',
    f.fechaRenovacion || '',
    f.estado || '',
    f.rutaPdf || `/constancias/${f.dni}_${String(f.trabajador || '').replace(/\s+/g, '_')}/${f.fechaEntrega}_Acta_${f.idEntrega}.pdf`,
  ])

  const totalGasto1 = Number(filasEntregas.reduce((s, f) => s + (Number(f.costoTotal) || 0), 0).toFixed(2))
  const totalItems1 = filasEntregas.reduce((s, f) => s + (Number(f.cantidad) || 0), 0)

  const pie1 = [
    'TOTALES GENERALES:',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalItems1,
    '',
    totalGasto1,
    '',
    '',
    '',
    '',
  ]

  const ws1 = XLSX.utils.aoa_to_sheet([...enc1, ...cuerpo1, [], pie1])

  // Anchos optimizados de columnas para visualización perfecta
  ws1['!cols'] = [
    { wch: 15 }, // Folio
    { wch: 14 }, // DNI
    { wch: 36 }, // Colaborador
    { wch: 26 }, // Cargo
    { wch: 20 }, // Área
    { wch: 16 }, // Código SKU
    { wch: 42 }, // Descripción EPP
    { wch: 24 }, // Categoría
    { wch: 12 }, // Talla
    { wch: 18 }, // Marca
    { wch: 10 }, // Cant.
    { wch: 16 }, // C. Unit (S/)
    { wch: 16 }, // C. Total (S/)
    { wch: 15 }, // F. Entrega
    { wch: 16 }, // F. Renovación
    { wch: 18 }, // Estado Vida Útil
    { wch: 50 }, // Ruta PDF
  ]

  // Merges de encabezado corporativo para que se lea completo sin truncarse
  ws1['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } }, // A1:Q1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 16 } }, // A2:Q2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 16 } }, // A3:Q3
    { s: { r: 3, c: 0 }, e: { r: 3, c: 16 } }, // A4:Q4
    { s: { r: enc1.length + cuerpo1.length + 1, c: 0 }, e: { r: enc1.length + cuerpo1.length + 1, c: 9 } }, // Merge TOTALES A..J
  ]

  // Activar filtros de tabla de Excel en la fila de encabezados (Fila 6)
  const filaInicioTabla = 6
  const filaFinTabla = filaInicioTabla + cuerpo1.length
  ws1['!autofilter'] = { ref: `A${filaInicioTabla}:Q${filaFinTabla}` }

  // Aplicar formato de moneda y números
  const range = XLSX.utils.decode_range(ws1['!ref'] || 'A1:Q100')
  for (let R = filaInicioTabla; R <= range.e.r; ++R) {
    // Columna K (Cant - col 10)
    const cellK = ws1[XLSX.utils.encode_cell({ r: R, c: 10 })]
    if (cellK && typeof cellK.v === 'number') {
      cellK.z = '#,##0'
    }
    // Columna L (C. Unit - col 11)
    const cellL = ws1[XLSX.utils.encode_cell({ r: R, c: 11 })]
    if (cellL && typeof cellL.v === 'number') {
      cellL.z = '"S/" #,##0.00'
    }
    // Columna M (C. Total - col 12)
    const cellM = ws1[XLSX.utils.encode_cell({ r: R, c: 12 })]
    if (cellM && typeof cellM.v === 'number') {
      cellM.z = '"S/" #,##0.00'
    }
  }

  XLSX.utils.book_append_sheet(wb, ws1, '1. Detalle de Entregas')

  // ── HOJA 2: RESUMEN POR ÁREA Y CARGO ──────────────────────────────────────
  const enc2 = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    [`RESUMEN DE CONSUMO DE EPP Y UNIFORMES POR ÁREA — ${nombreMes.toUpperCase()}`],
    [`RUC: 20615714128  |  Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`],
    [],
    ['Área / Departamento', 'Colaboradores Atendidos', 'Total Prendas / EPP', 'Inversión Total (S/)', 'Costo Promedio p/ Persona (S/)'],
  ]

  const cuerpo2 = resumenAreas.map(r => [
    r['Área / Departamento'] || r.area || 'Sin Área',
    Number(r['Colaboradores Atendidos'] || r.cantTrabajadores || 0),
    Number(r['Total Prendas / EPP'] || r.cantItems || 0),
    Number(Number(r['Inversión Total (S/)'] || r.gastoTotal || 0).toFixed(2)),
    Number(Number(r['Costo Promedio p/ Persona'] || r.promedio || 0).toFixed(2)),
  ])

  const ws2 = XLSX.utils.aoa_to_sheet([...enc2, ...cuerpo2])
  ws2['!cols'] = [{ wch: 28 }, { wch: 25 }, { wch: 22 }, { wch: 22 }, { wch: 30 }]
  ws2['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
  ]
  ws2['!autofilter'] = { ref: `A5:E${5 + cuerpo2.length}` }

  XLSX.utils.book_append_sheet(wb, ws2, '2. Consumo por Área')

  // ── HOJA 3: CONTROL DE VIDA ÚTIL Y RENOVACIONES ───────────────────────────
  const enc3 = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    [`CONTROL DE VIDA ÚTIL Y RENOVACIONES DE EPP — ${nombreMes.toUpperCase()}`],
    [`RUC: 20615714128  |  Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`],
    [],
    ['N° Folio', 'Colaborador', 'Área', 'Artículo Asignado', 'F. Asignación', 'F. Vencimiento / Renovación', 'Condición Actual'],
  ]

  const cuerpo3 = resumenVidaUtil.map(r => [
    r.Folio || r.idEntrega || '',
    r.Colaborador || r.trabajador || '',
    r.Área || r.area || '',
    r.Artículo || r.articulo || '',
    r['F. Asignación'] || r.fechaEntrega || '',
    r['F. Vencimiento'] || r.fechaRenovacion || '',
    r['Condición Actual'] || r.estado || '',
  ])

  const ws3 = XLSX.utils.aoa_to_sheet([...enc3, ...cuerpo3])
  ws3['!cols'] = [{ wch: 16 }, { wch: 34 }, { wch: 20 }, { wch: 36 }, { wch: 16 }, { wch: 26 }, { wch: 18 }]
  ws3['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
  ]
  ws3['!autofilter'] = { ref: `A5:G${5 + cuerpo3.length}` }

  XLSX.utils.book_append_sheet(wb, ws3, '3. Estado de Vida Útil')

  // ── HOJA 4: INVENTARIO VALORIZADO Y STOCK CRÍTICO ────────────────────────
  const enc4 = [
    ['DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.'],
    [`INVENTARIO VALORIZADO DE EPP Y UNIFORMES — ${nombreMes.toUpperCase()}`],
    [`RUC: 20615714128  |  Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`],
    [],
    ['Código SKU', 'Descripción del Artículo', 'Categoría', 'Talla', 'Stock Actual', 'Stock Mínimo', 'C. Unitario (S/)', 'Valor Total (S/)', 'Estado de Stock'],
  ]

  const cuerpo4 = inventarioValorizado.map(r => [
    r['Código SKU'] || r.codigo || '',
    r['Descripción'] || r.nombre || '',
    r['Categoría'] || r.categoria || '',
    r['Talla'] || r.talla || 'Estándar',
    Number(r['Stock Actual'] || r.stockActual || 0),
    Number(r['Stock Mínimo'] || r.stockMinimo || 0),
    Number(Number(r['Costo Unitario (S/)'] || r.costoUnitario || 0).toFixed(2)),
    Number(Number(r['Valorización Total (S/)'] || r.valorTotal || 0).toFixed(2)),
    r['Alerta Stock'] || r.estadoStock || 'NORMAL',
  ])

  const ws4 = XLSX.utils.aoa_to_sheet([...enc4, ...cuerpo4])
  ws4['!cols'] = [{ wch: 16 }, { wch: 40 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 20 }]
  ws4['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
  ]
  ws4['!autofilter'] = { ref: `A5:I${5 + cuerpo4.length}` }

  XLSX.utils.book_append_sheet(wb, ws4, '4. Inventario Valorizado')

  return wb
}

/**
 * Descarga en el navegador el libro de consolidado mensual
 */
export function exportarConsolidadoMensualExcel(datos: DatosCierreConsolidado) {
  const wb = construirLibroConsolidadoMensual(datos)
  const nombreArchivo = `Consolidado_Mensual_EPP_DALUPEZMAR_${datos.mesClave}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
