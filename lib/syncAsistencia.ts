import path from 'path'
import fs from 'fs'
import { prisma } from './prisma'

function getAsistenciaDb(dbPath: string): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqlite = require('node:sqlite')
  return new sqlite.DatabaseSync(dbPath)
}

export interface SyncResult {
  totalAsistencia: number
  creados: number
  actualizados: number
  inactivados: number
  origen: 'NUBE_API' | 'SQLITE_LOCAL'
  detalles: Array<{
    dni: string
    codigoFotocheck: string | null
    nombreCompleto: string
    accion: 'CREADO' | 'ACTUALIZADO' | 'SIN_CAMBIOS' | 'DADO_DE_BAJA'
    cargo: string
    area: string
  }>
}

/**
 * Obtener colaboradores desde la API en la nube (Render) o base SQLite local
 */
async function obtenerColaboradoresDesdeAsistencia(): Promise<{ employees: any[]; origen: 'NUBE_API' | 'SQLITE_LOCAL' }> {
  const apiUrl = process.env.ASISTENCIA_API_URL || 'https://dalupezmar-asistencia.onrender.com/api/v1'
  
  // 1. Intentar primero consumir la API en la nube oficial de DALUPEZMAR Asistencia
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(`${apiUrl}/sync/employees`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EPP-Control-Sync/1.0'
      },
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const json = await res.json()
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        return { employees: json.data, origen: 'NUBE_API' }
      }
    }
  } catch (apiErr: any) {
    console.warn('[Sync Asistencia] No se pudo conectar a la API nube de Asistencia:', apiErr.message)
  }

  // 2. Fallback a base de datos SQLite local si se ejecuta en entorno local
  const posiblesRutas = [
    path.join(process.cwd(), '..', 'sistema-asistencia-fotocheck', 'database', 'asistencia.db'),
    path.join(process.cwd(), 'scratch', 'sistema-asistencia-fotocheck', 'database', 'asistencia.db'),
    'C:/Users/Carlos/.gemini/antigravity-ide/scratch/sistema-asistencia-fotocheck/database/asistencia.db',
  ]

  let dbAsistenciaPath = ''
  for (const r of posiblesRutas) {
    if (fs.existsSync(r)) {
      dbAsistenciaPath = r
      break
    }
  }

  if (dbAsistenciaPath) {
    try {
      const asisDb = getAsistenciaDb(dbAsistenciaPath)
      const rows = asisDb
        .prepare(`
          SELECT 
            e.id,
            e.employee_code,
            e.document_type,
            e.document_number,
            e.first_name,
            e.last_name,
            e.status,
            e.blood_type,
            e.emergency_contact_phone,
            e.hire_date,
            d.name as department_name,
            p.name as position_name,
            b.name as branch_name,
            bg.badge_code,
            bg.barcode_value,
            bg.qr_token_hash
          FROM employees e
          LEFT JOIN departments d ON e.department_id = d.id
          LEFT JOIN positions p ON e.position_id = p.id
          LEFT JOIN branches b ON e.branch_id = b.id
          LEFT JOIN badges bg ON e.id = bg.employee_id AND bg.status = 'ACTIVE'
          ORDER BY e.last_name ASC
        `)
        .all() as any[]
      
      return { employees: rows, origen: 'SQLITE_LOCAL' }
    } catch (dbErr: any) {
      console.warn('[Sync Asistencia] Error leyendo SQLite local:', dbErr.message)
    }
  }

  throw new Error('No se pudo establecer conexión con el Sistema de Asistencia (API en la nube ni base de datos local disponible).')
}

export async function sincronizarTrabajadoresDesdeAsistencia(): Promise<SyncResult> {
  const { employees, origen } = await obtenerColaboradoresDesdeAsistencia()

  let creados = 0
  let actualizados = 0
  let inactivados = 0
  const detalles: SyncResult['detalles'] = []

  for (const emp of employees) {
    const dni = String(emp.document_number).trim()
    const codigoFotocheck = emp.employee_code || (emp.badge_code ? String(emp.badge_code).replace('BADGE-', '') : null)
    const nombres = String(emp.first_name || '').trim()
    const apellidos = String(emp.last_name || '').trim()
    const cargo = emp.position_name || 'Operario de Producción'
    const area = (emp.position_name && emp.position_name.toUpperCase().includes('TROQUELADO'))
      ? 'Troquelado de Anillas'
      : (emp.department_name || 'Producción')
    const estado = (emp.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'activo' : 'inactivo'
    const grupoSanguineo = emp.blood_type || 'O+'
    const contactoEmergencia = emp.emergency_contact_phone || '+51 911111111'
    const plantaPrincipal = emp.branch_name || 'DALUPEZMAR Planta Principal'

    const existente = await prisma.trabajador.findUnique({
      where: { dni },
    })

    if (!existente) {
      await prisma.trabajador.create({
        data: {
          dni,
          codigoFotocheck,
          nombres,
          apellidos,
          cargo,
          area,
          estado,
          grupoSanguineo,
          contactoEmergencia,
          plantaPrincipal,
          fechaIngreso: emp.hire_date ? new Date(emp.hire_date) : new Date(),
        },
      })
      creados++
      if (estado === 'inactivo') inactivados++
      detalles.push({
        dni,
        codigoFotocheck,
        nombreCompleto: `${apellidos}, ${nombres}`,
        accion: 'CREADO',
        cargo,
        area,
      })
    } else {
      let huboCambios = false
      const dataUpdate: any = {}

      if (existente.codigoFotocheck !== codigoFotocheck && codigoFotocheck) {
        dataUpdate.codigoFotocheck = codigoFotocheck
        huboCambios = true
      }
      if (existente.estado !== estado) {
        dataUpdate.estado = estado
        huboCambios = true
        if (estado === 'inactivo') inactivados++
      }
      if (existente.cargo !== cargo) {
        dataUpdate.cargo = cargo
        huboCambios = true
      }
      if (existente.area !== area) {
        dataUpdate.area = area
        huboCambios = true
      }
      if (existente.grupoSanguineo !== grupoSanguineo) {
        dataUpdate.grupoSanguineo = grupoSanguineo
        huboCambios = true
      }
      if (existente.contactoEmergencia !== contactoEmergencia) {
        dataUpdate.contactoEmergencia = contactoEmergencia
        huboCambios = true
      }
      if (existente.plantaPrincipal !== plantaPrincipal) {
        dataUpdate.plantaPrincipal = plantaPrincipal
        huboCambios = true
      }

      if (huboCambios) {
        await prisma.trabajador.update({
          where: { id: existente.id },
          data: dataUpdate,
        })
        actualizados++
        detalles.push({
          dni,
          codigoFotocheck,
          nombreCompleto: `${apellidos}, ${nombres}`,
          accion: estado === 'inactivo' ? 'DADO_DE_BAJA' : 'ACTUALIZADO',
          cargo,
          area,
        })
      } else {
        detalles.push({
          dni,
          codigoFotocheck,
          nombreCompleto: `${apellidos}, ${nombres}`,
          accion: 'SIN_CAMBIOS',
          cargo,
          area,
        })
      }
    }
  }

  return {
    totalAsistencia: employees.length,
    creados,
    actualizados,
    inactivados,
    origen,
    detalles,
  }
}

export function sincronizarTrabajadorHaciaAsistencia(trabajador: {
  dni: string
  codigoFotocheck?: string | null
  nombres: string
  apellidos: string
  cargo: string
  area: string
  estado: string
  grupoSanguineo?: string | null
  contactoEmergencia?: string | null
  plantaPrincipal?: string | null
}) {
  try {
    const posiblesRutas = [
      path.join(process.cwd(), '..', 'sistema-asistencia-fotocheck', 'database', 'asistencia.db'),
      path.join(process.cwd(), 'scratch', 'sistema-asistencia-fotocheck', 'database', 'asistencia.db'),
      'C:/Users/Carlos/.gemini/antigravity-ide/scratch/sistema-asistencia-fotocheck/database/asistencia.db',
    ]

    let dbAsistenciaPath = ''
    for (const r of posiblesRutas) {
      if (fs.existsSync(r)) {
        dbAsistenciaPath = r
        break
      }
    }

    if (!dbAsistenciaPath) return

    const asisDb = getAsistenciaDb(dbAsistenciaPath)
    const dni = String(trabajador.dni).trim()
    const statusAsistencia = trabajador.estado === 'activo' ? 'ACTIVE' : 'INACTIVE'

    // Buscar si existe en employees
    const emp = asisDb.prepare('SELECT id FROM employees WHERE document_number = ?').get(dni) as any

    if (emp) {
      asisDb
        .prepare(`
          UPDATE employees 
          SET first_name = ?, last_name = ?, status = ?, blood_type = ?, emergency_contact_phone = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .run(
          trabajador.nombres,
          trabajador.apellidos,
          statusAsistencia,
          trabajador.grupoSanguineo || 'O+',
          trabajador.contactoEmergencia || '+51 911111111',
          emp.id
        )

      const badgeStatus = statusAsistencia === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
      asisDb.prepare('UPDATE badges SET status = ? WHERE employee_id = ?').run(badgeStatus, emp.id)
    }
  } catch (err: any) {
    console.warn('Nota al sincronizar hacia base de datos local:', err.message)
  }
}
