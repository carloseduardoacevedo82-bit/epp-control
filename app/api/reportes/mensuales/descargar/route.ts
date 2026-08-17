import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mes = searchParams.get('mes') // '2026-08'

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: 'Parámetro mes inválido (formato: YYYY-MM)' }, { status: 400 })
  }

  const rutaArchivo = path.join(process.cwd(), 'reportes_mensuales', mes, `Cierre_Mensual_DALUPEZMAR_${mes}.xlsx`)

  if (!fs.existsSync(rutaArchivo)) {
    return NextResponse.json({ error: 'El reporte de cierre para este mes aún no ha sido generado' }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(rutaArchivo)
  const filename = `Cierre_Mensual_DALUPEZMAR_${mes}.xlsx`

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  })
}
