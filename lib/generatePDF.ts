import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Entrega } from './types'

const EMPRESA = {
  nombre: 'DALUPEZMAR S.A.C.',
  razonSocial: 'DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.',
  ruc: '20615714128',
  direccion: 'Av. Industrial N° 452 - Callao / Lima, Perú',
  ssoma: 'Sistema de Gestión de Seguridad y Salud en el Trabajo (SST)',
  norma: 'Ley N° 29783 / D.S. N° 005-2012-TR',
}

/**
 * Construye el documento jsPDF con diseño institucional y legal
 */
export function crearDocumentoActaPDF(entrega: Entrega): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14

  // ── ENCABEZADO INSTITUCIONAL ──────────────────────────────────────────
  // Barra superior azul marino profesional
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageWidth, 36, 'F')

  // Acento turquesa / azul claro
  doc.setFillColor(14, 165, 233) // sky-500
  doc.rect(0, 36, pageWidth, 2.5, 'F')

  // Nombre empresa (blanco)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(EMPRESA.razonSocial, pageWidth / 2, 13, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225) // slate-300
  doc.text(`RUC: ${EMPRESA.ruc}   •   ${EMPRESA.ssoma}`, pageWidth / 2, 20, { align: 'center' })

  // Título del documento
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CONSTANCIA OFICIAL DE ENTREGA DE EPP Y UNIFORMES', pageWidth / 2, 29, { align: 'center' })

  // ── DATOS DEL DOCUMENTO (FOLIO Y FECHA) ──────────────────────────────
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')

  const fechaFormateada = format(new Date(entrega.fechaEntrega), "dd 'de' MMMM 'de' yyyy", { locale: es })
  const folio = `ENT-${String(entrega.id).padStart(5, '0')}`

  // Caja de Folio y Fecha
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(margin, 43, pageWidth - margin * 2, 10, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.text(`N° Constancia: ${folio}`, margin + 5, 49.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha y Hora de Emisión: ${fechaFormateada} - ${format(new Date(entrega.fechaEntrega), 'HH:mm')} hrs`, pageWidth - margin - 5, 49.5, { align: 'right' })

  // ── DATOS DEL TRABAJADOR ────────────────────────────────────────────────
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(margin, 56, pageWidth - margin * 2, 6.5, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('1. INFORMACIÓN DEL COLABORADOR / BENEFICIARIO', margin + 4, 60.5)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(8.5)

  const t = entrega.trabajador
  const col1 = margin + 3
  const col2 = pageWidth / 2 + 3

  doc.setFont('helvetica', 'bold')
  doc.text('Apellidos y Nombres:', col1, 68)
  doc.text('DNI / Doc. Identidad:', col2, 68)
  doc.setFont('helvetica', 'normal')
  doc.text(`${t.apellidos}, ${t.nombres}`, col1 + 38, 68)
  doc.text(t.dni, col2 + 38, 68)

  doc.setFont('helvetica', 'bold')
  doc.text('Puesto / Cargo:', col1, 74)
  doc.text('Área Operativa:', col2, 74)
  doc.setFont('helvetica', 'normal')
  doc.text(t.cargo, col1 + 38, 74)
  doc.text(t.area, col2 + 38, 74)

  // Tallas registradas
  doc.setFont('helvetica', 'bold')
  doc.text('Tallas Registradas:', col1, 80)
  doc.setFont('helvetica', 'normal')
  const tallasStr = [
    t.tallaPantalon ? `Pantalón: ${t.tallaPantalon}` : '',
    t.tallaCamisa ? `Camisa/Polo: ${t.tallaCamisa}` : '',
    t.tallaCalzado ? `Calzado: ${t.tallaCalzado}` : '',
  ]
    .filter(Boolean)
    .join('   |   ') || 'Tallas estándar de planta'
  doc.text(tallasStr, col1 + 38, 80)

  // ── TABLA DE ARTÍCULOS ENTREGADOS ──────────────────────────────────────
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(margin, 86, pageWidth - margin * 2, 6.5, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('2. DETALLE DE EQUIPOS DE PROTECCIÓN PERSONAL Y UNIFORMES ASIGNADOS', margin + 4, 90.5)

  const tableData = entrega.detalles.map((d, i) => [
    i + 1,
    d.articulo.codigo,
    d.articulo.nombre,
    d.articulo.categoria,
    d.articulo.talla || 'Estándar',
    d.articulo.marcaFabricante || '3M / DALUPEZMAR',
    d.cantidad,
    `S/ ${d.costoUnitarioMomento.toFixed(2)}`,
    `S/ ${d.costoTotal.toFixed(2)}`,
    format(new Date(d.fechaRenovacionCalc), 'dd/MM/yyyy'),
    d.estadoRenovacion,
  ])

  const totalItems = entrega.detalles.reduce((sum, d) => sum + d.cantidad, 0)
  const totalCosto = entrega.detalles.reduce((sum, d) => sum + d.costoTotal, 0)

  autoTable(doc, {
    startY: 94.5,
    margin: { left: margin, right: margin },
    head: [[
      '#',
      'Código',
      'Descripción del EPP / Prenda',
      'Categoría',
      'Talla',
      'Marca',
      'Cant.',
      'P. Unit.',
      'Total',
      'F. Renovación',
      'Estado',
    ]],
    body: tableData,
    foot: [[
      '',
      '',
      'TOTAL GENERAL:',
      '',
      '',
      '',
      totalItems,
      '',
      `S/ ${totalCosto.toFixed(2)}`,
      '',
      '',
    ]],
    styles: { fontSize: 7.2, cellPadding: 1.8, textColor: [30, 41, 59] },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'center' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7 },
      1: { halign: 'center', cellWidth: 16 },
      2: { halign: 'left', cellWidth: 36 },
      3: { halign: 'left', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 10 },
      5: { halign: 'left', cellWidth: 16 },
      6: { halign: 'center', cellWidth: 10 },
      7: { halign: 'right', cellWidth: 16 },
      8: { halign: 'right', cellWidth: 16 },
      9: { halign: 'center', cellWidth: 17 },
      10: { halign: 'center', cellWidth: 16 },
    },
  })

  // ── DECLARACIÓN LEGAL Y COMPROMISO SSOMA ──────────────────────────────
  const finalY = (doc as any).lastAutoTable.finalY + 4
  const boxWidth = pageWidth - margin * 2
  const textWidth = boxWidth - 8

  // Barra de título sección 3
  doc.setFillColor(30, 41, 59)
  doc.roundedRect(margin, finalY, boxWidth, 6, 1.2, 1.2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('3. DECLARACIÓN DE CONFORMIDAD Y COMPROMISO LEGAL (SSOMA)', margin + 4, finalY + 4.2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(51, 65, 85)

  const declaracion = `Yo, ${t.apellidos} ${t.nombres}, identificado(a) con DNI N° ${t.dni}, en mi calidad de ${t.cargo} del área de ${t.area}, declaro haber recibido en óptimas condiciones de calidad, higiene y funcionalidad los Equipos de Protección Personal (EPP) y uniformes detallados en la presente acta. Me comprometo a utilizarlos de forma obligatoria y continua durante toda mi jornada laboral, conservarlos diligentemente y reportar de inmediato cualquier daño o desgaste, de conformidad con la Ley N° 29783 (Ley de Seguridad y Salud en el Trabajo) y su Reglamento D.S. N° 005-2012-TR.`

  const splitText = doc.splitTextToSize(declaracion, textWidth)
  const lineH = 3.2
  const textHeight = splitText.length * lineH

  // Caja de fondo para el texto de la declaración
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(margin, finalY + 7.5, boxWidth, textHeight + 4, 1.5, 1.5, 'FD')
  doc.text(splitText, margin + 4, finalY + 11.2)

  let nextSectionY = finalY + 7.5 + textHeight + 5.5

  // Observaciones de Campo si existen (en su propia cajita destacada y separada)
  if (entrega.observaciones && entrega.observaciones.trim().length > 0) {
    doc.setFillColor(254, 243, 199) // amber-100
    doc.setDrawColor(251, 191, 36) // amber-400
    doc.roundedRect(margin, nextSectionY, boxWidth, 6.5, 1.2, 1.2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(146, 64, 14) // amber-800
    doc.text('Observaciones de Campo:', margin + 3.5, nextSectionY + 4.3)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    doc.text(entrega.observaciones, margin + 38, nextSectionY + 4.3)

    nextSectionY += 8.5
  }

  // ── SECCIÓN DE FIRMAS DIGITALES ──────────────────────────────────────────
  const firmaY = Math.min(Math.max(nextSectionY + 2, 238), 244)

  // Caja para firma del trabajador
  doc.setDrawColor(203, 213, 225)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(margin, firmaY, 78, 38, 2, 2, 'FD')

  // Caja para firma de SSOMA / Entrega
  doc.roundedRect(pageWidth - margin - 78, firmaY, 78, 38, 2, 2, 'FD')

  // Estampar Firma Digital en Canvas si existe
  if (entrega.firmaDigitalUrl && entrega.firmaDigitalUrl.startsWith('data:image')) {
    try {
      doc.addImage(entrega.firmaDigitalUrl, 'PNG', margin + 4, firmaY + 2, 70, 22)
    } catch {
      // Firma no disponible
    }
  }

  // Línea y datos trabajador
  doc.setDrawColor(15, 23, 42)
  doc.line(margin + 6, firmaY + 26, margin + 72, firmaY + 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('Firma Digital / Táctil del Colaborador', margin + 39, firmaY + 30, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`${t.apellidos}, ${t.nombres} | DNI: ${t.dni}`, margin + 39, firmaY + 34, { align: 'center' })

  // Línea y datos SSOMA
  doc.line(pageWidth - margin - 72, firmaY + 26, pageWidth - margin - 6, firmaY + 26)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.text('Supervisor SSOMA / Almacén Central', pageWidth - margin - 39, firmaY + 30, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.', pageWidth - margin - 39, firmaY + 34, { align: 'center' })

  // ── PIE DE PÁGINA Y CÓDIGO DE INTEGRIDAD ─────────────────────────────────
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 284, pageWidth, 13, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.text(
    `DALUPEZMAR S.A.C.  |  RUC: ${EMPRESA.ruc}  |  Acta Electrónica Verificable N° ${folio}  |  Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`,
    pageWidth / 2,
    290,
    { align: 'center' }
  )

  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  const rutaDoc = entrega.rutaPdf || `/constancias/${t.dni}_${t.apellidos.replace(/\s/g, '_')}/${format(new Date(entrega.fechaEntrega), 'yyyy-MM-dd')}_Acta_${folio}.pdf`
  doc.text(`Ruta de archivo: ${rutaDoc}`, pageWidth / 2, 294, { align: 'center' })

  return doc
}

/**
 * Descarga el PDF directamente en el navegador
 */
export function generarActaEntregaPDF(entrega: Entrega): void {
  const doc = crearDocumentoActaPDF(entrega)
  const t = entrega.trabajador
  const folio = `ENT-${String(entrega.id).padStart(5, '0')}`
  const nombreArchivo = `Constancia_EPP_${t.dni}_${t.apellidos.replace(/\s/g, '_')}_${folio}.pdf`
  doc.save(nombreArchivo)
}

/**
 * Retorna la URL Blob del PDF para visualizarlo directamente en pantalla o modal
 */
export function obtenerActaPDFBlobUrl(entrega: Entrega): string {
  const doc = crearDocumentoActaPDF(entrega)
  const blob = doc.output('blob')
  return URL.createObjectURL(blob)
}

/**
 * Retorna el PDF como ArrayBuffer / Uint8Array para archivarlo en disco o API
 */
export function generarActaPDFBuffer(entrega: Entrega): Uint8Array {
  const doc = crearDocumentoActaPDF(entrega)
  const arrayBuffer = doc.output('arraybuffer')
  return new Uint8Array(arrayBuffer)
}
