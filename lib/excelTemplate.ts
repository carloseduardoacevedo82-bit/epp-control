import * as XLSX from 'xlsx'

/**
 * Genera y descarga la plantilla Excel oficial para la carga masiva de inventario de EPP
 * Cumple estrictamente con el formato y validación de columnas requerido.
 */
export const descargarPlantillaInventario = () => {
  const encabezados = [
    [
      'CODIGO_ARTICULO',
      'NOMBRE_DESCRIPCION',
      'CATEGORIA',
      'TALLA',
      'STOCK_ACTUAL',
      'STOCK_MINIMO',
      'COSTO_UNITARIO',
      'VIDA_UTIL_DIAS',
      'MARCA_FABRICANTE',
    ],
    [
      'EPP-CAS-01',
      'Casco Dielectrico Blanco Clase E',
      'Protección Cabeza',
      'Estándar',
      50,
      10,
      48.50,
      365,
      'MSA',
    ],
    [
      'CAL-BOT-42',
      'Botines de Seguridad Cuero Punta Acero',
      'Calzado',
      '42',
      25,
      5,
      120.00,
      180,
      'Nazca',
    ],
    [
      'UNI-POL-L',
      'Polo Manga Larga Cintas Reflectivas',
      'Uniforme',
      'L',
      100,
      20,
      28.00,
      90,
      'Confección Local',
    ],
    [
      'EPP-LEN-OSC',
      'Lentes de Seguridad Anti-Empañante Oscuro',
      'Protección Visual',
      'Estándar',
      80,
      15,
      14.50,
      120,
      '3M',
    ],
    [
      'EPP-GUA-NIT',
      'Guantes de Nitrilo Resistencia Química Talla 9',
      'Protección Manos',
      '9',
      120,
      30,
      9.80,
      60,
      'Ansell',
    ],
  ]

  const ws = XLSX.utils.aoa_to_sheet(encabezados)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Inventario')

  // Ajuste de ancho de columnas
  ws['!cols'] = [
    { wch: 18 },
    { wch: 42 },
    { wch: 22 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
  ]

  XLSX.writeFile(wb, 'Plantilla_Carga_Inventario_EPP.xlsx')
}

export const CABECERAS_OFICIALES = [
  'CODIGO_ARTICULO',
  'NOMBRE_DESCRIPCION',
  'CATEGORIA',
  'TALLA',
  'STOCK_ACTUAL',
  'STOCK_MINIMO',
  'COSTO_UNITARIO',
  'VIDA_UTIL_DIAS',
  'MARCA_FABRICANTE',
] as const
