import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const trabajador = await prisma.trabajador.create({ data: body })
    return NextResponse.json(trabajador, { status: 201 })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'El DNI ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear trabajador' }, { status: 500 })
  }
}
