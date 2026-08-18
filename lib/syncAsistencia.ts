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
  detalles: Array<{
    dni: string
    codigoFotocheck: string | null
    nombreCompleto: string
    accion: 'CREADO' | 'ACTUALIZADO' | 'SIN_CAMBIOS' | 'DADO_DE_BAJA'
    cargo: string
    area: string
  }>
}

export async function sincronizarTrabajadoresDesdeAsistencia(): Promise<SyncResult> {
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

  if (!dbAsistenciaPath) {
    throw new Error('No se encontró el archivo de base de datos del sistema de asistencia (asistencia.db)')
  }

  const asisDb = getAsistenciaDb(dbAsistenciaPath)

  const employees = asisDb
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
    `)
    .all() as any[]

  let creados = 0
  let actualizados = 0
  let inactivados = 0
  const detalles: SyncResult['detalles'] = []

  for (const emp of employees) {
    const dni = String(emp.document_number).trim()
    const codigoFotocheck = emp.employee_code || (emp.badge_code ? String(emp.badge_code).replace('BADGE-', '') : null)
    const nombres = String(emp.first_name).trim()
    const apellidos = String(emp.last_name).trim()
    const cargo = emp.position_name || 'Operario Producción'
    const area = emp.department_name || 'Producción'
    const estado = (emp.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'activo' : 'inactivo'
    const grupoSanguineo = emp.blood_type || 'O+'
    const contactoEmergencia = emp.emergency_contact_phone || '+51 911111111'
    const plantaPrincipal = emp.branch_name || 'PECEPE S.A.C.'

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

      if (existente.codigoFotocheck !== codigoFotocheck) {
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

      // Actualizar estado del badge
      const badgeStatus = statusAsistencia === 'ACTIVE' ? 'ACTIVE' : 'REVOKED'
      asisDb.prepare('UPDATE badges SET status = ? WHERE employee_id = ?').run(badgeStatus, emp.id)
    } else {
      // Obtener el siguiente código correlativo de empleado
      const lastCode = asisDb.prepare('SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1').get() as any
      let nextNum = 1050
      if (lastCode && lastCode.employee_code && lastCode.employee_code.startsWith('DAL-')) {
        const parsed = parseInt(lastCode.employee_code.replace('DAL-', ''), 10)
        if (!isNaN(parsed)) nextNum = parsed + 1
      }
      const employeeCode = trabajador.codigoFotocheck || `DAL-${nextNum}`

      const insertRes = asisDb
        .prepare(`
          INSERT INTO employees (
            employee_code, document_type, document_number, first_name, last_name,
            branch_id, department_id, position_id, shift_id, blood_type, emergency_contact_phone,
            status, hire_date
          ) VALUES (?, 'DNI', ?, ?, ?, 1, 1, 1, 1, ?, ?, ?, date('now'))
        `)
        .run(
          employeeCode,
          dni,
          trabajador.nombres,
          trabajador.apellidos,
          trabajador.grupoSanguineo || 'O+',
          trabajador.contactoEmergencia || '+51 911111111',
          statusAsistencia
        )

      const newEmpId = (insertRes as any).lastInsertRowid

      // Crear badge / credencial
      asisDb
        .prepare(`
          INSERT INTO badges (
            employee_id, badge_code, qr_token_hash, barcode_value, issue_date, status, template_theme
          ) VALUES (?, ?, ?, ?, date('now'), ?, 'CORPORATE_BLUE')
        `)
        .run(
          newEmpId,
          `BADGE-${employeeCode}`,
          `AGY_SEC_QR_${employeeCode}_${dni}`,
          dni,
          statusAsistencia === 'ACTIVE' ? 'ACTIVE' : 'REVOKED'
        )
    }
  } catch (err) {
    console.warn('Advertencia al sincronizar hacia asistencia.db:', err)
  }
}

