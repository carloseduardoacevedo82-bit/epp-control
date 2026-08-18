import { NextRequest, NextResponse } from 'next/server'
import { sincronizarTrabajadoresDesdeAsistencia } from '@/lib/syncAsistencia'

export async function GET() {
  try {
    const resultado = await sincronizarTrabajadoresDesdeAsistencia()
    return NextResponse.json({
      success: true,
      mensaje: 'Sincronización con Sistema de Asistencia y Fotochecks completada con éxito',
      ...resultado,
    })
  } catch (error: any) {
    console.error('Error en sync asistencia:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al sincronizar con el sistema de asistencia',
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const resultado = await sincronizarTrabajadoresDesdeAsistencia()
    return NextResponse.json({
      success: true,
      mensaje: 'Sincronización con Sistema de Asistencia y Fotochecks completada con éxito',
      ...resultado,
    })
  } catch (error: any) {
    console.error('Error en sync asistencia:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al sincronizar con el sistema de asistencia',
      },
      { status: 500 }
    )
  }
}
