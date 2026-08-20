import * as XLSX from 'xlsx'
import type { FilaValidadaImportacion, ResumenImportacionExcel } from './types'
import { CABECERAS_OFICIALES } from './excelTemplate'

/**
 * Procesa un archivo Excel/CSV y realiza una validación exhaustiva fila por fila en tiempo real
 */
export async function validarArchivoExcel(
  file: File | ArrayBuffer,
  nombreArchivo = 'archivo.xlsx'
): Promise<ResumenImportacionExcel> {
  let buffer: ArrayBuffer
  if (file instanceof File) {
    buffer = await file.arrayBuffer()
  } else {
    buffer = file
  }

  const wb = XLSX.read(buffer, { type: 'array' })
  let hojaNombre = wb.SheetNames.find(n => n.includes('Carga') || n.includes('Inventario') || n.includes('Plantilla')) || wb.SheetNames[0]

  if (!hojaNombre) {
    throw new Error('El archivo Excel no contiene hojas de cálculo.')
  }

  const hoja = wb.Sheets[hojaNombre]
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!jsonData || jsonData.length === 0) {
    throw new Error('La hoja de cálculo está vacía.')
  }

  // Identificar fila de encabezados
  const primeraFila = (jsonData[0] as any[]).map(c => String(c || '').trim().toUpperCase())
  
  // Validar presencia de cabeceras mínimas obligatorias
  const cabecerasFaltantes = CABECERAS_OFICIALES.filter(
    col => !primeraFila.includes(col)
  )

  if (cabecerasFaltantes.length > 0) {
    throw new Error(
      `El archivo no cumple con el formato oficial. Faltan las siguientes columnas: ${cabecerasFaltantes.join(', ')}. Descargue la plantilla oficial para mayor seguridad.`
    )
  }

  // Mapa de índices de columnas
  const indices: Record<string, number> = {}
  CABECERAS_OFICIALES.forEach(col => {
    indices[col] = primeraFila.indexOf(col)
  })

  const items: FilaValidadaImportacion[] = []
  const skusVistosEnArchivo = new Set<string>()
  const skusDuplicadosEnArchivo = new Set<string>()

  // Primera pasada para detectar duplicados dentro del mismo archivo
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (!row || row.every(cell => String(cell || '').trim() === '')) continue

    const codigoRaw = String(row[indices.CODIGO_ARTICULO] ?? '').trim().toUpperCase()
    if (codigoRaw) {
      if (skusVistosEnArchivo.has(codigoRaw)) {
        skusDuplicadosEnArchivo.add(codigoRaw)
      } else {
        skusVistosEnArchivo.add(codigoRaw)
      }
    }
  }

  // Segunda pasada para validación detallada por fila
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (!row || row.every(cell => String(cell || '').trim() === '')) continue

    const errores: string[] = []
    const numeroFila = i + 1 // Base 1 correspondiente al Excel

    const codigo = String(row[indices.CODIGO_ARTICULO] ?? '').trim().toUpperCase()
    const nombre = String(row[indices.NOMBRE_DESCRIPCION] ?? '').trim()
    const categoria = String(row[indices.CATEGORIA] ?? '').trim()
    const talla = String(row[indices.TALLA] ?? '').trim() || 'Estándar'
    const stockActualRaw = row[indices.STOCK_ACTUAL]
    const stockMinimoRaw = row[indices.STOCK_MINIMO]
    const costoUnitarioRaw = row[indices.COSTO_UNITARIO]
    const vidaUtilDiasRaw = row[indices.VIDA_UTIL_DIAS]
    const marcaFabricante = String(row[indices.MARCA_FABRICANTE] ?? '').trim() || 'Estándar'

    // Validar Código
    if (!codigo) {
      errores.push('El CODIGO_ARTICULO es obligatorio.')
    } else if (codigo.length < 3) {
      errores.push('El código SKU debe tener al menos 3 caracteres.')
    }

    const esDuplicadoEnArchivo = skusDuplicadosEnArchivo.has(codigo)
    if (esDuplicadoEnArchivo) {
      errores.push(`Código duplicado dentro de este mismo archivo Excel (${codigo}).`)
    }

    // Validar Nombre
    if (!nombre) {
      errores.push('NOMBRE_DESCRIPCION es obligatorio.')
    } else if (nombre.length < 3) {
      errores.push('La descripción debe ser más detallada.')
    }

    // Validar Categoría
    if (!categoria) {
      errores.push('CATEGORIA es obligatoria.')
    }

    // Validar Stock Actual
    const stockActual = Number(stockActualRaw)
    if (stockActualRaw === '' || isNaN(stockActual) || stockActual < 0 || !Number.isInteger(stockActual)) {
      errores.push('STOCK_ACTUAL debe ser un número entero mayor o igual a 0.')
    }

    // Validar Stock Mínimo
    const stockMinimo = Number(stockMinimoRaw)
    if (stockMinimoRaw === '' || isNaN(stockMinimo) || stockMinimo < 0 || !Number.isInteger(stockMinimo)) {
      errores.push('STOCK_MINIMO debe ser un número entero mayor o igual a 0.')
    }

    // Validar Costo Unitario
    const costoUnitario = Number(costoUnitarioRaw)
    if (costoUnitarioRaw === '' || isNaN(costoUnitario) || costoUnitario < 0) {
      errores.push('COSTO_UNITARIO debe ser un valor numérico decimal válido (ej. 45.50).')
    }

    // Validar Vida Útil en Días
    const vidaUtilDias = Number(vidaUtilDiasRaw)
    if (vidaUtilDiasRaw === '' || isNaN(vidaUtilDias) || vidaUtilDias <= 0 || !Number.isInteger(vidaUtilDias)) {
      errores.push('VIDA_UTIL_DIAS debe ser un número entero positivo mayor a 0 (ej. 180 o 365).')
    }

    items.push({
      numeroFila,
      codigo: codigo || `FILA-${numeroFila}`,
      nombre: nombre || 'Sin descripción',
      categoria: categoria || 'General',
      talla,
      stockActual: isNaN(stockActual) ? 0 : Math.max(0, stockActual),
      stockMinimo: isNaN(stockMinimo) ? 5 : Math.max(0, stockMinimo),
      costoUnitario: isNaN(costoUnitario) ? 0 : Math.max(0, Number(costoUnitario.toFixed(2))),
      vidaUtilDias: isNaN(vidaUtilDias) ? 365 : Math.max(1, vidaUtilDias),
      marcaFabricante,
      esValida: errores.length === 0,
      errores,
      esDuplicadoEnArchivo,
    })
  }

  const filasValidas = items.filter(i => i.esValida).length
  const filasConError = items.filter(i => !i.esValida).length

  return {
    totalFilas: items.length,
    filasValidas,
    filasConError,
    filasNuevas: filasValidas,
    filasActualizadas: 0,
    items,
    nombreArchivo,
  }
}
