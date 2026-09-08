import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { obtenerCorreccionesPermanentes } from '@/lib/persistenceService'
import { normalizarNombreCarpeta } from '@/lib/structuredStorageService'
import path from 'path'
import fs from 'fs'

const API_KEY_MAESTRA = process.env.API_INTEGRATION_KEY || 'ag_erp_live_key_982347102938471209384'

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey || apiKey !== API_KEY_MAESTRA) {
      return NextResponse.json({ error: 'No autorizado: API Key inválida' }, { status: 401 })
    }

    const body = await req.json()
    const { action, employee, dni } = body

    const targetDni = String(dni || employee?.dni || employee?.document_number || '').trim()
    if (!targetDni) {
      return NextResponse.json({ error: 'DNI de trabajador no proporcionado' }, { status: 400 })
    }

    if (action === 'DELETE') {
      const trabajador = await prisma.trabajador.findUnique({
        where: { dni: targetDni },
      })

      if (trabajador) {
        const workerId = trabajador.id
        const entregas = await prisma.entrega.findMany({
          where: { trabajadorId: workerId },
          select: { id: true },
        })
        const entregaIds = entregas.map((e) => e.id)

        if (entregaIds.length > 0) {
          await prisma.detalleEntrega.deleteMany({
            where: { entregaId: { in: entregaIds } },
          })
        }

        await prisma.constanciaArchivo.deleteMany({
          where: { trabajadorId: workerId },
        })

        await prisma.entrega.deleteMany({
          where: { trabajadorId: workerId },
        })

        await prisma.trabajador.delete({
          where: { id: workerId },
        })

        // Eliminar carpeta de constancias en disco
        const carpetaBase = process.env.STORAGE_PATH || path.join(process.cwd(), 'public', 'constancias')
        const carpetaPath = path.join(carpetaBase, normalizarNombreCarpeta(trabajador.dni, trabajador.apellidos))
        if (fs.existsSync(carpetaPath)) {
          fs.rmSync(carpetaPath, { recursive: true, force: true })
        }

        return NextResponse.json({
          success: true,
          action: 'DELETE',
          message: `Trabajador ${trabajador.apellidos}, ${trabajador.nombres} (DNI ${targetDni}) eliminado permanentemente por webhook de Asistencia.`,
        })
      }

      return NextResponse.json({
        success: true,
        action: 'DELETE',
        message: `Trabajador con DNI ${targetDni} no existía en EPP Control.`,
      })
    }

    if (action === 'UPSERT' || action === 'STATUS' || !action) {
      const correcciones = obtenerCorreccionesPermanentes()
      const corr = correcciones[targetDni]

      const nombres = corr?.nombres || String(employee?.nombres || employee?.first_name || '').trim()
      const apellidos = corr?.apellidos || String(employee?.apellidos || employee?.last_name || '').trim()
      const estado =
        employee?.estado === 'inactivo' || employee?.status === 'INACTIVE' ? 'inactivo' : 'activo'

      const cargo =
        corr?.bloqueadoManual && corr?.cargo
          ? corr.cargo
          : String(employee?.cargo || employee?.position_name || 'Operario de Producción').trim()

      const area =
        corr?.bloqueadoManual && corr?.area
          ? corr.area
          : String(employee?.area || employee?.department_name || 'Producción').trim()

      const trabajador = await prisma.trabajador.upsert({
        where: { dni: targetDni },
        create: {
          dni: targetDni,
          codigoFotocheck: employee?.codigoFotocheck || employee?.employee_code || null,
          nombres: nombres || 'Colaborador',
          apellidos: apellidos || 'Sin Apellido',
          cargo: cargo || 'Operario de Producción',
          area: area || 'Producción',
          estado,
          grupoSanguineo: employee?.grupoSanguineo || employee?.blood_type || 'O+',
          contactoEmergencia:
            employee?.contactoEmergencia || employee?.emergency_contact_phone || '+51 911111111',
          plantaPrincipal: employee?.plantaPrincipal || 'DALUPEZMAR Planta Principal',
        },
        update: {
          codigoFotocheck: employee?.codigoFotocheck || employee?.employee_code || undefined,
          estado,
          cargo: (corr?.bloqueadoManual && corr?.cargo) ? undefined : cargo,
          area: (corr?.bloqueadoManual && corr?.area) ? undefined : area,
          grupoSanguineo: employee?.grupoSanguineo || employee?.blood_type || undefined,
          contactoEmergencia:
            employee?.contactoEmergencia || employee?.emergency_contact_phone || undefined,
        },
      })

      return NextResponse.json({
        success: true,
        action: 'UPSERT',
        trabajador,
        message: `Trabajador DNI ${targetDni} sincronizado correctamente desde Asistencia.`,
      })
    }

    return NextResponse.json({ error: `Acción '${action}' no reconocida` }, { status: 400 })
  } catch (error: any) {
    console.error('[Webhook Asistencia] Error procesando evento:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno procesando webhook de Asistencia' },
      { status: 500 }
    )
  }
}
