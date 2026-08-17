import { NextResponse } from 'next/server'
import { listarCierresMensuales, generarCierreMensual, asegurarCarpetaReportes } from '@/lib/monthlyReportService'
import { subMonths, parseISO, startOfMonth } from 'date-fns'

export async function GET() {
  try {
    asegurarCarpetaReportes()

    // Comprobar si existen entregas en la BD para generar automáticamente si está vacío
    let cierres = await listarCierresMensuales()

    // Si aún no hay cierres guardados, generamos automáticamente para el mes actual y meses con entregas
    if (cierres.length === 0) {
      await generarCierreMensual(new Date())
      await generarCierreMensual(subMonths(new Date(), 1))
      cierres = await listarCierresMensuales()
    }

    return NextResponse.json({
      ok: true,
      carpetaBase: 'reportes_mensuales',
      cierres,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    let fecha = new Date()

    if (body.mes && typeof body.mes === 'string') {
      const [yearStr, monthStr] = body.mes.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1
      if (!isNaN(year) && !isNaN(month)) {
        fecha = new Date(year, month, 15) // Mid-month local date
      }
    }

    const resultado = await generarCierreMensual(fecha)
    return NextResponse.json({
      ok: true,
      mensaje: `Reporte de cierre mensual para ${resultado.nombreMes} generado y guardado en ${resultado.rutaRelativa}`,
      cierre: resultado,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
