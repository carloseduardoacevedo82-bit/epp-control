import path from 'path'
import fs from 'fs'

interface CorreccionRegistro {
  dni: string
  nombres: string
  apellidos: string
  cargo?: string
  area?: string
  bloqueadoManual?: boolean
  fechaCorreccion?: string
}

const RUTA_CORRECCIONES = path.join(process.cwd(), 'data', 'correcciones_permanentes.json')

/**
 * Obtener el diccionario de correcciones permanentes guardadas
 */
export function obtenerCorreccionesPermanentes(): Record<string, CorreccionRegistro> {
  try {
    if (fs.existsSync(RUTA_CORRECCIONES)) {
      const raw = fs.readFileSync(RUTA_CORRECCIONES, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (err) {
    console.warn('[PersistenceService] Error al leer correcciones permanentes:', err)
  }
  return {}
}

/**
 * Guardar una corrección permanente cuando un usuario edita un trabajador en el sistema
 */
export function registrarCorreccionPermanente(datos: {
  dni: string
  nombres: string
  apellidos: string
  cargo?: string
  area?: string
}) {
  try {
    const dir = path.dirname(RUTA_CORRECCIONES)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const correcciones = obtenerCorreccionesPermanentes()
    const dniLimpio = String(datos.dni).trim()

    correcciones[dniLimpio] = {
      dni: dniLimpio,
      nombres: String(datos.nombres).replace(/\s+/g, ' ').trim(),
      apellidos: String(datos.apellidos).replace(/\s+/g, ' ').trim(),
      cargo: datos.cargo ? String(datos.cargo).trim() : undefined,
      area: datos.area ? String(datos.area).trim() : undefined,
      bloqueadoManual: true,
      fechaCorreccion: new Date().toISOString(),
    }

    fs.writeFileSync(RUTA_CORRECCIONES, JSON.stringify(correcciones, null, 2), 'utf-8')
    console.log(`[PersistenceService] Corrección permanente guardada para DNI ${dniLimpio}: ${datos.apellidos}, ${datos.nombres}`)
  } catch (err) {
    console.error('[PersistenceService] Error al guardar corrección permanente:', err)
  }
}

/**
 * Normaliza nombres de carpetas de constancias
 */
function normalizarApellido(apellidos: string): string {
  return apellidos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .trim()
}

/**
 * Si se modificaron los apellidos o DNI del trabajador, renombra su carpeta de actas
 * y actualiza las rutas en la base de datos para que los enlaces nunca se rompan ni muestren nombres desactualizados.
 */
export function renombrarCarpetaYActualizarRutasConstancias(
  dni: string,
  apellidosViejos: string,
  apellidosNuevos: string,
  dbSync?: any
) {
  try {
    const oldFolderBase = `${dni.trim()}_${normalizarApellido(apellidosViejos)}`
    const newFolderBase = `${dni.trim()}_${normalizarApellido(apellidosNuevos)}`

    if (oldFolderBase === newFolderBase) return

    const baseConstancias = process.env.STORAGE_PATH || path.join(process.cwd(), 'public', 'constancias')
    const oldPath = path.join(baseConstancias, oldFolderBase)
    const newPath = path.join(baseConstancias, newFolderBase)

    if (fs.existsSync(oldPath)) {
      if (!fs.existsSync(newPath)) {
        fs.renameSync(oldPath, newPath)
      } else {
        const files = fs.readdirSync(oldPath)
        for (const f of files) {
          fs.copyFileSync(path.join(oldPath, f), path.join(newPath, f))
        }
        fs.rmSync(oldPath, { recursive: true, force: true })
      }
      console.log(`[PersistenceService] Carpeta renombrada de ${oldFolderBase} a ${newFolderBase}`)
    }

    if (dbSync) {
      dbSync
        .prepare(`
          UPDATE Entrega 
          SET rutaPdf = REPLACE(rutaPdf, ?, ?)
          WHERE rutaPdf LIKE ?
        `)
        .run(oldFolderBase, newFolderBase, `%${oldFolderBase}%`)

      dbSync
        .prepare(`
          UPDATE ConstanciaArchivo 
          SET rutaRelativa = REPLACE(rutaRelativa, ?, ?)
          WHERE rutaRelativa LIKE ?
        `)
        .run(oldFolderBase, newFolderBase, `%${oldFolderBase}%`)
    }
  } catch (err) {
    console.warn('[PersistenceService] Nota al renombrar carpeta o actualizar rutas:', err)
  }
}

/**
 * Ejecuta validaciones y sincronizaciones de consistencia en el archivo SQLite directamente
 * para asegurar que ninguna corrección manual se revierta al reiniciar o desplegar.
 */
export function asegurarConsistenciaEnSqlite(dbFilePath: string) {
  try {
    if (!fs.existsSync(dbFilePath)) return

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sqlite = require('node:sqlite')
    const db = new sqlite.DatabaseSync(dbFilePath)

    // 1. Asegurar columnas en Entrega
    try {
      const colsEntrega = db.prepare("PRAGMA table_info('Entrega')").all() as Array<{ name: string }>
      const nombresColsEntrega = colsEntrega.map((c) => c.name)

      if (!nombresColsEntrega.includes('firmaSupervisorUrl')) {
        db.prepare('ALTER TABLE Entrega ADD COLUMN firmaSupervisorUrl TEXT').run()
      }
      if (!nombresColsEntrega.includes('supervisorNombre')) {
        db.prepare('ALTER TABLE Entrega ADD COLUMN supervisorNombre TEXT').run()
      }
      if (!nombresColsEntrega.includes('supervisorCargo')) {
        db.prepare('ALTER TABLE Entrega ADD COLUMN supervisorCargo TEXT').run()
      }
      if (!nombresColsEntrega.includes('fechaFirmaSupervisor')) {
        db.prepare('ALTER TABLE Entrega ADD COLUMN fechaFirmaSupervisor DATETIME').run()
      }
    } catch (e: any) {
      console.warn('[PersistenceService] Advertencia al verificar columnas de Entrega:', e.message)
    }

    // 2. Corregir cualquier rezago específico de Cordova dDegollar
    try {
      db.prepare(`
        UPDATE Trabajador 
        SET apellidos = 'Cordova Degollar' 
        WHERE dni = '74405998' AND apellidos LIKE '%dDegollar%'
      `).run()

      db.prepare(`
        UPDATE Entrega 
        SET rutaPdf = REPLACE(rutaPdf, 'Cordova_dDegollar', 'Cordova_Degollar')
        WHERE rutaPdf LIKE '%Cordova_dDegollar%'
      `).run()

      db.prepare(`
        UPDATE ConstanciaArchivo 
        SET rutaRelativa = REPLACE(rutaRelativa, 'Cordova_dDegollar', 'Cordova_Degollar')
        WHERE rutaRelativa LIKE '%Cordova_dDegollar%'
      `).run()

      // Limpieza de dobles espacios en apellidos
      db.prepare(`UPDATE Trabajador SET apellidos = REPLACE(apellidos, '  ', ' ') WHERE apellidos LIKE '%  %'`).run()
      db.prepare(`UPDATE Trabajador SET nombres = REPLACE(nombres, '  ', ' ') WHERE nombres LIKE '%  %'`).run()
    } catch (e: any) {
      console.warn('[PersistenceService] Advertencia al aplicar limpieza de Cordova Degollar:', e.message)
    }

    // 3. Aplicar todas las correcciones permanentes registradas en el JSON
    const correcciones = obtenerCorreccionesPermanentes()
    for (const dni of Object.keys(correcciones)) {
      const item = correcciones[dni]
      try {
        db.prepare(`
          UPDATE Trabajador 
          SET nombres = ?, apellidos = ?, updatedAt = datetime('now')
          WHERE dni = ?
        `).run(item.nombres, item.apellidos, dni)
      } catch (e: any) {
        console.warn(`[PersistenceService] Error aplicando corrección a DNI ${dni}:`, e.message)
      }
    }

    db.close()
  } catch (err: any) {
    console.warn('[PersistenceService] Error general en asegurarConsistenciaEnSqlite:', err.message)
  }
}
