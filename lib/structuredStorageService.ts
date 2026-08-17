import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'
import { format } from 'date-fns'
import type { CarpetaTrabajadorConstancias, ConstanciaArchivoItem } from './types'

const CARPETA_BASE_CONSTANCIAS = process.env.STORAGE_PATH || path.join(process.cwd(), 'public', 'constancias')

export function asegurarCarpetaBase() {
  if (!fs.existsSync(CARPETA_BASE_CONSTANCIAS)) {
    fs.mkdirSync(CARPETA_BASE_CONSTANCIAS, { recursive: true })
  }
  return CARPETA_BASE_CONSTANCIAS
}

/**
 * Normaliza nombres y apellidos para rutas de carpetas seguras
 */
export function normalizarNombreCarpeta(dni: string, apellidos: string): string {
  const apellidoLimpio = apellidos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .trim()
  return `${dni.trim()}_${apellidoLimpio}`
}

/**
 * Retorna la ruta relativa y absoluta para una constancia PDF
 * Formato: /constancias/{DNI_TRABAJADOR}_{APELLIDO}/{FECHA_ENTREGA}_Acta_{ID}.pdf
 */
export function construirRutaConstancia(
  dni: string,
  apellidos: string,
  fechaEntrega: Date | string,
  entregaId: number
) {
  asegurarCarpetaBase()

  const nombreCarpeta = normalizarNombreCarpeta(dni, apellidos)
  const carpetaTrabajador = path.join(CARPETA_BASE_CONSTANCIAS, nombreCarpeta)

  if (!fs.existsSync(carpetaTrabajador)) {
    fs.mkdirSync(carpetaTrabajador, { recursive: true })
  }

  const fechaStr = format(new Date(fechaEntrega), 'yyyy-MM-dd')
  const idPad = String(entregaId).padStart(5, '0')
  const nombreArchivo = `${fechaStr}_Acta_ENT-${idPad}.pdf`

  const rutaRelativa = `/constancias/${nombreCarpeta}/${nombreArchivo}`
  const rutaAbsoluta = path.join(carpetaTrabajador, nombreArchivo)

  return {
    nombreCarpeta,
    nombreArchivo,
    rutaRelativa,
    rutaAbsoluta,
  }
}

/**
 * Guarda el buffer de un PDF en la estructura de carpetas automatizada
 */
export async function guardarConstanciaEnDisco(
  dni: string,
  apellidos: string,
  fechaEntrega: Date | string,
  entregaId: number,
  pdfBuffer: Uint8Array | Buffer
): Promise<string> {
  const { rutaAbsoluta, rutaRelativa } = construirRutaConstancia(dni, apellidos, fechaEntrega, entregaId)
  fs.writeFileSync(rutaAbsoluta, Buffer.from(pdfBuffer))
  return rutaRelativa
}

import { prisma } from './prisma'
import { parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { crearDocumentoActaPDF } from './generatePDF'

/**
 * Genera un archivo ZIP con todos los archivos PDF planos (sin carpetas internas) para un mes específico
 */
export async function generarZipConstanciasMensual(mesParam: string): Promise<Buffer> {
  asegurarCarpetaBase()
  const zip = new JSZip()

  const fechaBase = parseISO(`${mesParam}-01`)
  const fechaInicio = startOfMonth(fechaBase)
  const fechaFin = endOfMonth(fechaBase)

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
        include: { articulo: true },
      },
    },
    orderBy: { fechaEntrega: 'asc' },
  })

  for (const e of entregas) {
    const t = e.trabajador
    const nombreCarpeta = normalizarNombreCarpeta(t.dni, t.apellidos)
    const fechaStr = format(new Date(e.fechaEntrega), 'yyyy-MM-dd')
    const idPad = String(e.id).padStart(5, '0')
    const nombreArchivo = `${fechaStr}_Acta_ENT-${idPad}.pdf`

    const apellidoLimpio = t.apellidos
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .trim()
    const nombreLimpio = t.nombres
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .trim()

    // Nombre plano y claro sin carpetas
    const nombrePdfPlano = `${fechaStr}_ENT-${idPad}_${t.dni}_${apellidoLimpio}_${nombreLimpio}.pdf`

    const rutaEnDisco = path.join(CARPETA_BASE_CONSTANCIAS, nombreCarpeta, nombreArchivo)
    let pdfBuffer: Buffer

    if (fs.existsSync(rutaEnDisco)) {
      pdfBuffer = fs.readFileSync(rutaEnDisco)
    } else {
      const doc = crearDocumentoActaPDF(e as any)
      pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      try {
        const carpetaTrabajador = path.join(CARPETA_BASE_CONSTANCIAS, nombreCarpeta)
        if (!fs.existsSync(carpetaTrabajador)) {
          fs.mkdirSync(carpetaTrabajador, { recursive: true })
        }
        fs.writeFileSync(rutaEnDisco, pdfBuffer)
      } catch (err) {}
    }

    // Agregar directamente el PDF sin subcarpetas
    zip.file(nombrePdfPlano, pdfBuffer)
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return zipBuffer
}

/**
 * Genera un archivo ZIP con todos los archivos PDF planos (sin carpetas internas)
 */
export async function generarZipConstancias(filtroCarpeta?: string): Promise<Buffer> {
  asegurarCarpetaBase()
  const zip = new JSZip()

  if (filtroCarpeta) {
    const carpetaPath = path.join(CARPETA_BASE_CONSTANCIAS, filtroCarpeta)
    if (fs.existsSync(carpetaPath)) {
      const archivos = fs.readdirSync(carpetaPath).filter(f => f.endsWith('.pdf'))
      for (const archivo of archivos) {
        const contenido = fs.readFileSync(path.join(carpetaPath, archivo))
        zip.file(archivo, contenido)
      }
    }
  } else {
    const entregas = await prisma.entrega.findMany({
      include: {
        trabajador: true,
        detalles: { include: { articulo: true } },
      },
      orderBy: { fechaEntrega: 'asc' },
    })

    for (const e of entregas) {
      const t = e.trabajador
      const nombreCarpeta = normalizarNombreCarpeta(t.dni, t.apellidos)
      const fechaStr = format(new Date(e.fechaEntrega), 'yyyy-MM-dd')
      const idPad = String(e.id).padStart(5, '0')
      const nombreArchivo = `${fechaStr}_Acta_ENT-${idPad}.pdf`

      const apellidoLimpio = t.apellidos
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .trim()
      const nombreLimpio = t.nombres
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .trim()

      const nombrePdfPlano = `${fechaStr}_ENT-${idPad}_${t.dni}_${apellidoLimpio}_${nombreLimpio}.pdf`

      const rutaEnDisco = path.join(CARPETA_BASE_CONSTANCIAS, nombreCarpeta, nombreArchivo)
      let pdfBuffer: Buffer

      if (fs.existsSync(rutaEnDisco)) {
        pdfBuffer = fs.readFileSync(rutaEnDisco)
      } else {
        const doc = crearDocumentoActaPDF(e as any)
        pdfBuffer = Buffer.from(doc.output('arraybuffer'))
        try {
          const carpetaTrabajador = path.join(CARPETA_BASE_CONSTANCIAS, nombreCarpeta)
          if (!fs.existsSync(carpetaTrabajador)) {
            fs.mkdirSync(carpetaTrabajador, { recursive: true })
          }
          fs.writeFileSync(rutaEnDisco, pdfBuffer)
        } catch {}
      }

      // Agregar archivo plano sin subcarpetas
      zip.file(nombrePdfPlano, pdfBuffer)
    }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return zipBuffer
}
