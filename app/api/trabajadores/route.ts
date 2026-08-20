import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sincronizarTrabajadorHaciaAsistencia } from '@/lib/syncAsistencia'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const estado = searchParams.get('estado')
    const area = searchParams.get('area')
    const search = searchParams.get('search')

    const trabajadores = await prisma.trabajador.findMany({
      where: {
        ...(estado ? { estado } : {}),
        ...(area ? { area } : {}),
        ...(search
          ? {
              OR: [
                { nombres: { contains: search } },
                { apellidos: { contains: search } },
                { dni: { contains: search } },
                { codigoFotocheck: { contains: search } },
                { cargo: { contains: search } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { entregas: true } } },
      orderBy: { apellidos: 'asc' },
    })
    return NextResponse.json(trabajadores)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener trabajadores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.dni || !body.nombres || !body.apellidos || !body.cargo) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (DNI, nombres, apellidos, cargo)' }, { status: 400 })
    }

    const dataToCreate = {
      dni: String(body.dni).trim(),
      codigoFotocheck: body.codigoFotocheck ? String(body.codigoFotocheck).trim().toUpperCase() : null,
      nombres: String(body.nombres).trim(),
      apellidos: String(body.apellidos).trim(),
      cargo: String(body.cargo).trim(),
      area: String(body.area || 'Producción').trim(),
      grupoSanguineo: body.grupoSanguineo ? String(body.grupoSanguineo).trim() : null,
      contactoEmergencia: body.contactoEmergencia ? String(body.contactoEmergencia).trim() : null,
      plantaPrincipal: body.plantaPrincipal ? String(body.plantaPrincipal).trim() : null,
      fechaIngreso: body.fechaIngreso ? new Date(body.fechaIngreso) : new Date(),
      tallaPantalon: body.tallaPantalon ? String(body.tallaPantalon).trim() : null,
      tallaCamisa: body.tallaCamisa ? String(body.tallaCamisa).trim() : null,
      tallaCalzado: body.tallaCalzado ? String(body.tallaCalzado).trim() : null,
      estado: body.estado === 'inactivo' ? 'inactivo' : 'activo',
    }

    const trabajador = await prisma.trabajador.create({ data: dataToCreate })
    // Sincronizar en tiempo real con sistema de asistencia y fotochecks
    sincronizarTrabajadorHaciaAsistencia(trabajador)
    return NextResponse.json(trabajador, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear trabajador:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'El DNI o Código de Fotocheck ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message || 'Error al crear trabajador' }, { status: 500 })
  }
}

