import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    const [totalActivos, gastoTotal, entregasMes, alertasCriticas, consumoPorArea, consumoPorCategoria] =
      await Promise.all([
        prisma.trabajador.count({ where: { estado: 'activo' } }),

        prisma.detalleEntrega.aggregate({ _sum: { costoTotal: true } }),

        prisma.entrega.count({
          where: { fechaEntrega: { gte: inicioMes } },
        }),

        prisma.detalleEntrega.count({
          where: { estadoRenovacion: { in: ['Vencido', 'Por Vencer'] } },
        }),

        // Consumo por área
        prisma.$queryRaw<{ area: string; gasto: number; entregas: bigint }[]>`
          SELECT t.area, 
                 COALESCE(SUM(d.costoTotal), 0) as gasto,
                 COUNT(DISTINCT e.id) as entregas
          FROM Trabajador t
          LEFT JOIN Entrega e ON e.trabajadorId = t.id
          LEFT JOIN DetalleEntrega d ON d.entregaId = e.id
          GROUP BY t.area
          ORDER BY gasto DESC
        `,

        // Consumo por categoría
        prisma.$queryRaw<{ categoria: string; gasto: number; cantidad: bigint }[]>`
          SELECT a.categoria,
                 COALESCE(SUM(d.costoTotal), 0) as gasto,
                 COALESCE(SUM(d.cantidad), 0) as cantidad
          FROM ArticuloEPP a
          LEFT JOIN DetalleEntrega d ON d.articuloId = a.id
          GROUP BY a.categoria
          ORDER BY gasto DESC
        `,
      ])

    return NextResponse.json({
      kpis: {
        totalTrabajadoresActivos: totalActivos,
        gastoTotalAcumulado: gastoTotal._sum.costoTotal ?? 0,
        entregasDelMes: entregasMes,
        alertasCriticas,
      },
      consumoPorArea: consumoPorArea.map((r) => ({
        area: r.area,
        gasto: Number(r.gasto),
        entregas: Number(r.entregas),
      })),
      consumoPorCategoria: consumoPorCategoria.map((r) => ({
        categoria: r.categoria,
        gasto: Number(r.gasto),
        cantidad: Number(r.cantidad),
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener datos del dashboard' }, { status: 500 })
  }
}
