import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sincronizarTrabajadorHaciaAsistencia, eliminarTrabajadorHaciaAsistencia } from '@/lib/syncAsistencia'
import { registrarCorreccionPermanente, renombrarCarpetaYActualizarRutasConstancias } from '@/lib/persistenceService'
import { normalizarNombreCarpeta } from '@/lib/structuredStorageService'
import path from 'path'
import fs from 'fs'

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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const workerId = Number(id)
    if (isNaN(workerId)) {
      return NextResponse.json({ error: 'ID de trabajador inválido' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    let permanente = searchParams.get('permanente') === 'true'

    try {
      const body = await req.json()
      if (body?.permanente === true) permanente = true
    } catch {}

    const trabajador = await prisma.trabajador.findUnique({
      where: { id: workerId },
    })

    if (!trabajador) {
      return NextResponse.json({ error: 'Trabajador no encontrado' }, { status: 404 })
    }

    if (permanente) {
      // 1. Eliminar en cascada entregas y detalles
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

      // 2. Eliminar constancias y entregas
      await prisma.constanciaArchivo.deleteMany({
        where: { trabajadorId: workerId },
      })

      await prisma.entrega.deleteMany({
        where: { trabajadorId: workerId },
      })

      // 3. Eliminar trabajador de la base de datos
      await prisma.trabajador.delete({
        where: { id: workerId },
      })

      // 4. Eliminar carpeta física de constancias en disco
      const carpetaBase = process.env.STORAGE_PATH || path.join(process.cwd(), 'public', 'constancias')
      const nombreCarpeta = normalizarNombreCarpeta(trabajador.dni, trabajador.apellidos)
      const carpetaPath = path.join(carpetaBase, nombreCarpeta)
      if (fs.existsSync(carpetaPath)) {
        try {
          fs.rmSync(carpetaPath, { recursive: true, force: true })
        } catch (fErr) {
          console.warn('Nota al eliminar carpeta física:', fErr)
        }
      }

      // 5. Eliminar de correcciones permanentes si estaba registrado
      try {
        const rutaJson = path.join(process.cwd(), 'data', 'correcciones_permanentes.json')
        if (fs.existsSync(rutaJson)) {
          const dict = JSON.parse(fs.readFileSync(rutaJson, 'utf-8'))
          if (dict[trabajador.dni]) {
            delete dict[trabajador.dni]
            fs.writeFileSync(rutaJson, JSON.stringify(dict, null, 2), 'utf-8')
          }
        }
      } catch (jErr) {
        console.warn('Nota al actualizar correcciones_permanentes:', jErr)
      }

      // 6. Eliminar en el sistema de Asistencia y Fotochecks (Nube y Local)
      await eliminarTrabajadorHaciaAsistencia(trabajador.dni)

      return NextResponse.json({
        success: true,
        permanente: true,
        message: `Trabajador ${trabajador.apellidos}, ${trabajador.nombres} eliminado permanentemente de todo el sistema.`,
      })
    } else {
      // Baja lógica
      const actualizado = await prisma.trabajador.update({
        where: { id: workerId },
        data: { estado: 'inactivo' },
      })

      // Sincronizar baja con sistema de asistencia
      await sincronizarTrabajadorHaciaAsistencia(actualizado)

      return NextResponse.json({
        success: true,
        permanente: false,
        trabajador: actualizado,
        message: `Trabajador ${actualizado.apellidos}, ${actualizado.nombres} dado de baja.`,
      })
    }
  } catch (error: any) {
    console.error('Error al procesar eliminación o baja:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

