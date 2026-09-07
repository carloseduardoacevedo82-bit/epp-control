import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sincronizarTrabajadorHaciaAsistencia } from '@/lib/syncAsistencia'
import { registrarCorreccionPermanente, renombrarCarpetaYActualizarRutasConstancias } from '@/lib/persistenceService'
import { normalizarNombreCarpeta } from '@/lib/structuredStorageService'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: Number(id) },
      include: {
        entregas: {
          include: { detalles: { include: { articulo: true } } },
          orderBy: { fechaEntrega: 'desc' },
        },
      },
    })
    if (!trabajador) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(trabajador)
  } catch {
    return NextResponse.json({ error: 'Error al obtener trabajador' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const workerId = Number(id)
    if (isNaN(workerId)) {
      return NextResponse.json({ error: 'ID de trabajador inválido' }, { status: 400 })
    }

    const existente = await prisma.trabajador.findUnique({
      where: { id: workerId },
    })
    if (!existente) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
    }

    const body = await req.json()

    // Sanitizar y mapear únicamente campos válidos del modelo Trabajador
    const updateData: Record<string, any> = {}

    if (body.dni !== undefined) updateData.dni = String(body.dni).trim()
    if (body.codigoFotocheck !== undefined) {
      updateData.codigoFotocheck = body.codigoFotocheck ? String(body.codigoFotocheck).trim().toUpperCase() : null
    }
    if (body.nombres !== undefined) updateData.nombres = String(body.nombres).replace(/\s+/g, ' ').trim()
    if (body.apellidos !== undefined) updateData.apellidos = String(body.apellidos).replace(/\s+/g, ' ').trim()
    if (body.cargo !== undefined) updateData.cargo = String(body.cargo).trim()
    if (body.area !== undefined) updateData.area = String(body.area).trim()
    if (body.grupoSanguineo !== undefined) {
      updateData.grupoSanguineo = body.grupoSanguineo ? String(body.grupoSanguineo).trim() : null
    }
    if (body.contactoEmergencia !== undefined) {
      updateData.contactoEmergencia = body.contactoEmergencia ? String(body.contactoEmergencia).trim() : null
    }
    if (body.plantaPrincipal !== undefined) {
      updateData.plantaPrincipal = body.plantaPrincipal ? String(body.plantaPrincipal).trim() : null
    }
    if (body.fechaIngreso !== undefined) {
      updateData.fechaIngreso = body.fechaIngreso ? new Date(body.fechaIngreso) : new Date()
    }
    if (body.tallaPantalon !== undefined) {
      updateData.tallaPantalon = body.tallaPantalon ? String(body.tallaPantalon).trim() : null
    }
    if (body.tallaCamisa !== undefined) {
      updateData.tallaCamisa = body.tallaCamisa ? String(body.tallaCamisa).trim() : null
    }
    if (body.tallaCalzado !== undefined) {
      updateData.tallaCalzado = body.tallaCalzado ? String(body.tallaCalzado).trim() : null
    }
    if (body.estado !== undefined) {
      updateData.estado = body.estado === 'inactivo' ? 'inactivo' : 'activo'
    }

    const trabajador = await prisma.trabajador.update({
      where: { id: workerId },
      data: updateData,
    })

    // Registrar corrección permanente para que no se revierta ante ningún reinicio, despliegue o sincronización
    registrarCorreccionPermanente({
      dni: trabajador.dni,
      nombres: trabajador.nombres,
      apellidos: trabajador.apellidos,
      cargo: trabajador.cargo,
      area: trabajador.area,
    })

    // Si cambiaron los apellidos o el DNI, actualizar carpetas de constancias y rutas en base de datos
    if (existente.apellidos !== trabajador.apellidos || existente.dni !== trabajador.dni) {
      renombrarCarpetaYActualizarRutasConstancias(
        existente.dni,
        existente.apellidos,
        trabajador.apellidos
      )

      const oldCarpeta = normalizarNombreCarpeta(existente.dni, existente.apellidos)
      const newCarpeta = normalizarNombreCarpeta(trabajador.dni, trabajador.apellidos)

      const entregas = await prisma.entrega.findMany({ where: { trabajadorId: workerId } })
      for (const e of entregas) {
        if (e.rutaPdf && e.rutaPdf.includes(oldCarpeta)) {
          await prisma.entrega.update({
            where: { id: e.id },
            data: { rutaPdf: e.rutaPdf.replace(oldCarpeta, newCarpeta) },
          })
        }
      }

      const constancias = await prisma.constanciaArchivo.findMany({ where: { trabajadorId: workerId } })
      for (const c of constancias) {
        if (c.rutaRelativa && c.rutaRelativa.includes(oldCarpeta)) {
          await prisma.constanciaArchivo.update({
            where: { id: c.id },
            data: { rutaRelativa: c.rutaRelativa.replace(oldCarpeta, newCarpeta) },
          })
        }
      }
    }

    // Sincronizar en tiempo real con sistema de asistencia y fotochecks
    sincronizarTrabajadorHaciaAsistencia(trabajador)
    return NextResponse.json(trabajador)
  } catch (error: any) {
    console.error('Error al actualizar trabajador:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'El DNI o Código de Fotocheck ya está registrado en otro trabajador' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message || 'Error al actualizar trabajador' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Baja lógica
    const trabajador = await prisma.trabajador.update({
      where: { id: Number(id) },
      data: { estado: 'inactivo' },
    })
    // Sincronizar baja con sistema de asistencia
    sincronizarTrabajadorHaciaAsistencia(trabajador)
    return NextResponse.json(trabajador)
  } catch {
    return NextResponse.json({ error: 'Error al dar de baja' }, { status: 500 })
  }
}

