import { NextResponse } from 'next/server'
import path from 'path'
import { exec } from 'child_process'
import { asegurarCarpetaReportes } from '@/lib/monthlyReportService'

export async function POST() {
  try {
    const carpeta = asegurarCarpetaReportes()
    
    // Abrir en el explorador de Windows
    exec(`start "" "${carpeta}"`)

    return NextResponse.json({
      ok: true,
      mensaje: 'Carpeta abierta en el Explorador de Windows',
      ruta: carpeta,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
