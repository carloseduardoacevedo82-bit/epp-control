import * as XLSX from 'xlsx'
import { CATEGORIAS_EPP, TALLAS_CALZADO, TALLAS_ROPA, TALLAS_PANTALON } from './types'

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

/**
 * Catálogo maestro oficial con SKUs estandarizados para referencia y listas desplegables
 */
export const CATALOGO_MAESTRO_EPP = [
  // 👟 CALZADO (Tallas 35 a la 47)
  ...['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'].map(t => ({
    codigo: `CAL-BOTG-${t}`,
    nombre: `Botas caña largas de goma punta de acero T${t}`,
    categoria: 'Calzado',
    talla: t,
    costo: 55.00,
    vidaUtil: 180,
    stockMinimo: 5,
    marca: 'Delta Plus / Bata',
  })),
  ...['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'].map(t => ({
    codigo: `CAL-BOTD-${t}`,
    nombre: `Botas de seguridad dieléctricas T${t}`,
    categoria: 'Calzado',
    talla: t,
    costo: 70.00,
    vidaUtil: 365,
    stockMinimo: 5,
    marca: 'Nazca / Bata',
  })),
  ...['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'].map(t => ({
    codigo: `CAL-BOTT-${t}`,
    nombre: `Botas térmicas antideslizantes T${t}`,
    categoria: 'Calzado',
    talla: t,
    costo: 90.00,
    vidaUtil: 365,
    stockMinimo: 5,
    marca: 'Delta Plus Frío',
  })),
  ...['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'].map(t => ({
    codigo: `CAL-BOTC-${t}`,
    nombre: `Botines de seguridad de cuero punta de acero T${t}`,
    categoria: 'Calzado',
    talla: t,
    costo: 95.00,
    vidaUtil: 365,
    stockMinimo: 5,
    marca: 'Nazca',
  })),

  // 👕 UNIFORMES Y ROPA (XS a la XXXXL)
  ...['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(t => ({
    codigo: `UNI-POLC-${t}`,
    nombre: `Polo manga corta algodón con cuello camisero Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 25.00,
    vidaUtil: 365,
    stockMinimo: 10,
    marca: 'DALUPEZMAR Textil',
  })),
  ...['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(t => ({
    codigo: `UNI-POLL-${t}`,
    nombre: `Polo manga larga con cintas reflectivas Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 28.00,
    vidaUtil: 365,
    stockMinimo: 10,
    marca: 'DALUPEZMAR Textil',
  })),
  ...['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(t => ({
    codigo: `UNI-SUET-${t}`,
    nombre: `Suéter manga larga cuello redondo Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 30.00,
    vidaUtil: 180,
    stockMinimo: 10,
    marca: 'DALUPEZMAR Textil',
  })),
  ...['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(t => ({
    codigo: `UNI-CHAI-${t}`,
    nombre: `Chaqueta ignífuga antiestática Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 60.00,
    vidaUtil: 365,
    stockMinimo: 5,
    marca: 'DALUPEZMAR Industrial',
  })),
  ...['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(t => ({
    codigo: `UNI-CASA-${t}`,
    nombre: `Casaca térmica para cámara de refrigeración Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 85.00,
    vidaUtil: 365,
    stockMinimo: 5,
    marca: 'DALUPEZMAR Frío',
  })),
  ...['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'].map(t => ({
    codigo: `UNI-CHAL-${t}`,
    nombre: `Chaleco térmico reflectivo tipo brigadista Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 45.00,
    vidaUtil: 365,
    stockMinimo: 5,
    marca: 'DALUPEZMAR Textil',
  })),

  // 👖 PANTALONES (28 al 50)
  ...['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'].map(t => ({
    codigo: `UNI-PAND-${t}`,
    nombre: `Pantalón largo drill con cinta reflectiva Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 30.00,
    vidaUtil: 180,
    stockMinimo: 10,
    marca: 'DALUPEZMAR Textil',
  })),
  ...['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'].map(t => ({
    codigo: `UNI-PANT-${t}`,
    nombre: `Pantalón térmico impermeable para congelados Talla ${t}`,
    categoria: 'Uniforme',
    talla: t,
    costo: 65.00,
    vidaUtil: 365,
    stockMinimo: 5,
    marca: 'DALUPEZMAR Frío',
  })),

  // 🛡️ IMPLEMENTOS Y ACCESORIOS ESTÁNDAR
  { codigo: 'UNI-MEDG-U', nombre: 'Medias gruesas de trabajo', categoria: 'Uniforme', talla: 'Talla Única', costo: 10.00, vidaUtil: 180, stockMinimo: 20, marca: 'Estándar' },
  { codigo: 'UNI-MEDT-U', nombre: 'Medias térmicas para baja temperatura', categoria: 'Uniforme', talla: 'Talla Única', costo: 15.00, vidaUtil: 180, stockMinimo: 15, marca: 'Estándar' },
  { codigo: 'EPP-CAB-01', nombre: 'Casco de seguridad Tipo 1 Clase E', categoria: 'Protección Cabeza', talla: 'Talla Única', costo: 35.00, vidaUtil: 365, stockMinimo: 10, marca: 'MSA / 3M' },
  { codigo: 'EPP-CAB-02', nombre: 'Casco dieléctrico blanco con barbiquejo', categoria: 'Protección Cabeza', talla: 'Talla Única', costo: 45.00, vidaUtil: 365, stockMinimo: 10, marca: 'MSA' },
  { codigo: 'EPP-CAB-03', nombre: 'Toca fantasma', categoria: 'Protección Cabeza', talla: 'Talla Única', costo: 15.00, vidaUtil: 180, stockMinimo: 25, marca: 'Estándar' },
  { codigo: 'EPP-CAB-04', nombre: 'Gorro con solapa para sol / legionario', categoria: 'Protección Cabeza', talla: 'Talla Única', costo: 13.00, vidaUtil: 180, stockMinimo: 15, marca: 'Estándar' },
  { codigo: 'EPP-CAB-05', nombre: 'Vincha para cabello', categoria: 'Protección Cabeza', talla: 'Talla Única', costo: 5.00, vidaUtil: 180, stockMinimo: 20, marca: 'Estándar' },
  { codigo: 'EPP-CAB-06', nombre: 'Pasamontañas térmico', categoria: 'Protección Cabeza', talla: 'Talla Única', costo: 18.00, vidaUtil: 365, stockMinimo: 10, marca: 'Estándar' },
  { codigo: 'EPP-VIS-01', nombre: 'Lentes de seguridad transparentes anti-impacto', categoria: 'Protección Visual', talla: 'Talla Única', costo: 18.00, vidaUtil: 180, stockMinimo: 20, marca: '3M Virtua' },
  { codigo: 'EPP-VIS-02', nombre: 'Lentes de seguridad oscuros con protección UV', categoria: 'Protección Visual', talla: 'Talla Única', costo: 18.00, vidaUtil: 180, stockMinimo: 15, marca: '3M Virtua' },
  { codigo: 'EPP-VIS-03', nombre: 'Lentes antiempañantes de seguridad', categoria: 'Protección Visual', talla: 'Talla Única', costo: 25.00, vidaUtil: 180, stockMinimo: 15, marca: '3M SecureFit' },
  { codigo: 'EPP-VIS-04', nombre: 'Protector facial transparente con cabezal', categoria: 'Protección Visual', talla: 'Talla Única', costo: 40.00, vidaUtil: 180, stockMinimo: 5, marca: 'MSA' },
  { codigo: 'EPP-AUD-01', nombre: 'Tapones auditivos de silicona reutilizables', categoria: 'Protección Auditiva', talla: 'Talla Única', costo: 2.00, vidaUtil: 30, stockMinimo: 50, marca: '3M Ultrafit' },
  { codigo: 'EPP-AUD-02', nombre: 'Orejeras de seguridad tipo copa para casco', categoria: 'Protección Auditiva', talla: 'Talla Única', costo: 48.00, vidaUtil: 365, stockMinimo: 8, marca: '3M Peltor' },
  { codigo: 'EPP-MAN-01', nombre: 'Guantes de lana con puntos de PVC', categoria: 'Protección Manos', talla: 'Talla Única', costo: 15.00, vidaUtil: 90, stockMinimo: 20, marca: 'Estándar' },
  { codigo: 'EPP-MAN-02', nombre: 'Guantes de alta temperatura naranjados', categoria: 'Protección Manos', talla: 'Talla Única', costo: 20.00, vidaUtil: 90, stockMinimo: 15, marca: 'Ansell' },
  { codigo: 'EPP-MAN-03', nombre: 'Guantes de corte nivel 5 anticorte', categoria: 'Protección Manos', talla: 'Talla Única', costo: 22.00, vidaUtil: 90, stockMinimo: 15, marca: 'Delta Plus' },
  { codigo: 'EPP-MAN-04', nombre: 'Guantes térmicos para frío', categoria: 'Protección Manos', talla: 'Talla Única', costo: 28.00, vidaUtil: 180, stockMinimo: 10, marca: 'Delta Plus' },
  { codigo: 'EPP-MAN-05', nombre: 'Guantes de nitrilo resistente a químicos', categoria: 'Protección Manos', talla: 'Talla Única', costo: 12.00, vidaUtil: 60, stockMinimo: 25, marca: 'Ansell Solvex' },
  { codigo: 'EPP-MAN-06', nombre: 'Guantes de badana para operador', categoria: 'Protección Manos', talla: 'Talla Única', costo: 16.50, vidaUtil: 90, stockMinimo: 15, marca: 'Estándar' },
  { codigo: 'EPP-RES-01', nombre: 'Respirador semimascarilla de silicona doble vía', categoria: 'Protección Respiratoria', talla: 'Talla Única', costo: 25.00, vidaUtil: 90, stockMinimo: 10, marca: '3M 6200' },
  { codigo: 'EPP-RES-02', nombre: 'Filtros para partículas y polvo P100', categoria: 'Protección Respiratoria', talla: 'Talla Única', costo: 35.00, vidaUtil: 60, stockMinimo: 15, marca: '3M 2097' },
  { codigo: 'EPP-ALT-01', nombre: 'Arnés de seguridad de cuerpo entero 4 anillos', categoria: 'Protección Alturas', talla: 'Talla Única', costo: 55.00, vidaUtil: 730, stockMinimo: 5, marca: 'Delta Plus' },
  { codigo: 'EPP-ALT-02', nombre: 'Línea de vida con absorbedor de impacto', categoria: 'Protección Alturas', talla: 'Talla Única', costo: 75.00, vidaUtil: 730, stockMinimo: 5, marca: 'Delta Plus' },
  { codigo: 'EPP-CLI-01', nombre: 'Poncho para lluvia impermeable con capucha', categoria: 'Protección Climática', talla: 'Talla Única', costo: 32.00, vidaUtil: 365, stockMinimo: 10, marca: 'Estándar' },
  { codigo: 'EPP-ACC-01', nombre: 'Cinturón porta herramientas de cuero reforzado', categoria: 'Herramientas / Accesorios', talla: 'Talla Única', costo: 30.00, vidaUtil: 730, stockMinimo: 5, marca: 'Estándar' },
]

/**
 * Genera y descarga el libro Excel con plantilla de carga masiva y hojas de referencia de SKUs y listas desplegables
 */
export const descargarPlantillaInventario = () => {
  const wb = XLSX.utils.book_new()

  // ─── HOJA 1: PLANTILLA DE CARGA PRINCIPAL ─────────────────────────────────
  const filasPlantilla: any[][] = [
    [...CABECERAS_OFICIALES],
    ['CAL-BOTG-42', 'Botas caña largas de goma punta de acero T42', 'Calzado', '42', 30, 5, 55.00, 180, 'Delta Plus / Bata'],
    ['CAL-BOTD-41', 'Botas de seguridad dieléctricas T41', 'Calzado', '41', 20, 5, 70.00, 365, 'Nazca / Bata'],
    ['UNI-PAND-34', 'Pantalón largo drill con cinta reflectiva Talla 34', 'Uniforme', '34', 40, 10, 30.00, 180, 'DALUPEZMAR Textil'],
    ['UNI-PANT-36', 'Pantalón térmico impermeable para congelados Talla 36', 'Uniforme', '36', 15, 5, 65.00, 365, 'DALUPEZMAR Frío'],
    ['UNI-POLC-L', 'Polo manga corta algodón con cuello camisero Talla L', 'Uniforme', 'L', 50, 10, 25.00, 365, 'DALUPEZMAR Textil'],
    ['UNI-CASA-XL', 'Casaca térmica para cámara de refrigeración Talla XL', 'Uniforme', 'XL', 12, 5, 85.00, 365, 'DALUPEZMAR Frío'],
    ['EPP-CAB-01', 'Casco de seguridad Tipo 1 Clase E', 'Protección Cabeza', 'Talla Única', 60, 10, 35.00, 365, 'MSA / 3M'],
    ['EPP-VIS-01', 'Lentes de seguridad transparentes anti-impacto', 'Protección Visual', 'Talla Única', 100, 20, 18.00, 180, '3M Virtua'],
    ['EPP-AUD-01', 'Tapones auditivos de silicona reutilizables', 'Protección Auditiva', 'Talla Única', 300, 50, 2.00, 30, '3M Ultrafit'],
    ['EPP-MAN-01', 'Guantes de lana con puntos de PVC', 'Protección Manos', 'Talla Única', 120, 20, 15.00, 90, 'Estándar'],
    ['EPP-RES-01', 'Respirador semimascarilla de silicona doble vía', 'Protección Respiratoria', 'Talla Única', 60, 10, 25.00, 90, '3M 6200'],
    ['EPP-ALT-01', 'Arnés de seguridad de cuerpo entero 4 anillos', 'Protección Alturas', 'Talla Única', 25, 5, 55.00, 730, 'Delta Plus'],
  ]

  const wsCarga = XLSX.utils.aoa_to_sheet(filasPlantilla)
  wsCarga['!cols'] = [
    { wch: 18 }, // CODIGO_ARTICULO
    { wch: 55 }, // NOMBRE_DESCRIPCION
    { wch: 26 }, // CATEGORIA
    { wch: 14 }, // TALLA
    { wch: 16 }, // STOCK_ACTUAL
    { wch: 16 }, // STOCK_MINIMO
    { wch: 16 }, // COSTO_UNITARIO
    { wch: 16 }, // VIDA_UTIL_DIAS
    { wch: 25 }, // MARCA_FABRICANTE
  ]

  XLSX.utils.book_append_sheet(wb, wsCarga, 'Carga_Inventario_EPP')

  // ─── HOJA 2: CATÁLOGO MAESTRO DE SKUS OFICIALES ───────────────────────────
  const cabecerasCatalogo = [
    'CODIGO_SKU',
    'DESCRIPCION_OFICIAL',
    'CATEGORIA',
    'TALLA',
    'COSTO_UNITARIO_SOLES',
    'VIDA_UTIL_DIAS',
    'STOCK_MIN_SUGERIDO',
    'MARCA_PROVEEDOR',
  ]

  const filasCatalogo = [
    cabecerasCatalogo,
    ...CATALOGO_MAESTRO_EPP.map(item => [
      item.codigo,
      item.nombre,
      item.categoria,
      item.talla,
      item.costo,
      item.vidaUtil,
      item.stockMinimo,
      item.marca,
    ]),
  ]

  const wsCatalogo = XLSX.utils.aoa_to_sheet(filasCatalogo)
  wsCatalogo['!cols'] = [
    { wch: 18 },
    { wch: 58 },
    { wch: 26 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(wb, wsCatalogo, 'Catálogo_Maestro_SKUs')

  // ─── HOJA 3: LISTAS DESPLEGABLES DE APOYO ─────────────────────────────────
  const maxFilas = Math.max(
    CATEGORIAS_EPP.length,
    TALLAS_CALZADO.length,
    TALLAS_PANTALON.length,
    TALLAS_ROPA.length
  )

  const filasListas: any[][] = [
    ['CATEGORÍAS_OFICIALES', 'TALLAS_CALZADO_35_47', 'TALLAS_PANTALON_28_50', 'TALLAS_ROPA_XS_4XL'],
  ]

  for (let i = 0; i < maxFilas; i++) {
    filasListas.push([
      CATEGORIAS_EPP[i] || '',
      TALLAS_CALZADO[i] || '',
      TALLAS_PANTALON[i] || '',
      TALLAS_ROPA[i] || '',
    ])
  }

  const wsListas = XLSX.utils.aoa_to_sheet(filasListas)
  wsListas['!cols'] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
  ]
  XLSX.utils.book_append_sheet(wb, wsListas, 'Listas_Desplegables')

  XLSX.writeFile(wb, 'Plantilla_Carga_Inventario_EPP_DALUPEZMAR.xlsx')
}
