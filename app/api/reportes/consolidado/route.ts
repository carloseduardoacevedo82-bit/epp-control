import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { construirLibroConsolidadoMensual } from '@/lib/generateConsolidatedExcel'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mesParam = searchParams.get('mes') || format(new Date(), 'yyyy-MM')
    const formatoDescarga = searchParams.get('descarga') === 'true'

    const fechaBase = parseISO(`${mesParam}-01`)
    const fechaInicio = startOfMonth(fechaBase)
    const fechaFin = endOfMonth(fechaBase)

    const nombreMes = format(fechaBase, "MMMM 'de' yyyy", { locale: es })
    const nombreMesCap = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)

    // 1. Consultar entregas del mes
    const entregas = await prisma.entrega.findMany({
      where: {
        fechaEntrega: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        trabajador: true,
        detalles: {
          include: {
            articulo: true,
          },
        },
      },
      orderBy: { fechaEntrega: 'asc' },
    })

    // 2. Aplanar detalles de entregas
    const filasEntregas: any[] = []
    for (const e of entregas) {
      for (const d of e.detalles) {
        filasEntregas.push({
          idEntrega: `ENT-${String(e.id).padStart(5, '0')}`,
          dni: e.trabajador.dni,
          trabajador: `${e.trabajador.apellidos}, ${e.trabajador.nombres}`,
          cargo: e.trabajador.cargo,
          area: e.trabajador.area,
          codigo: d.articulo.codigo,
          articulo: d.articulo.nombre,
          categoria: d.articulo.categoria,
          talla: d.articulo.talla || 'Estándar',
          marcaFabricante: d.articulo.marcaFabricante || 'Estándar',
          cantidad: d.cantidad,
          costoUnitario: d.costoUnitarioMomento,
          costoTotal: d.costoTotal,
          fechaEntrega: format(new Date(e.fechaEntrega), 'dd/MM/yyyy'),
          fechaRenovacion: format(new Date(d.fechaRenovacionCalc), 'dd/MM/yyyy'),
          estado: d.estadoRenovacion,
          rutaPdf: e.rutaPdf || `/constancias/${e.trabajador.dni}_${e.trabajador.apellidos.replace(/\s+/g, '_')}/${format(new Date(e.fechaEntrega), 'yyyy-MM-dd')}_Acta_ENT-${String(e.id).padStart(5, '0')}.pdf`,
        })
      }
    }

    // 3. Resumen por Área
    const areas = [...new Set(filasEntregas.map(f => f.area))]
    const resumenAreas = areas.map(area => {
      const areaFilas = filasEntregas.filter(f => f.area === area)
      const gastoTotal = areaFilas.reduce((s, f) => s + f.costoTotal, 0)
      const cantItems = areaFilas.reduce((s, f) => s + f.cantidad, 0)
      const cantTrabajadores = new Set(areaFilas.map(f => f.dni)).size
      return {
        'Área / Departamento': area,
        'Colaboradores Atendidos': cantTrabajadores,
        'Total Prendas / EPP': cantItems,
        'Inversión Total (S/)': Number(gastoTotal.toFixed(2)),
        'Costo Promedio p/ Persona': Number((gastoTotal / (cantTrabajadores || 1)).toFixed(2)),
      }
    })

    // 4. Resumen por Categoría
    const categorias = [...new Set(filasEntregas.map(f => f.categoria))]
    const resumenCategorias = categorias.map(cat => {
      const catFilas = filasEntregas.filter(f => f.categoria === cat)
      return {
        'Categoría EPP': cat,
        'Prendas Entregadas': catFilas.reduce((s, f) => s + f.cantidad, 0),
        'Gasto Total (S/)': Number(catFilas.reduce((s, f) => s + f.costoTotal, 0).toFixed(2)),
      }
    })

    // 5. Control de Vida Útil
    const resumenVidaUtil = filasEntregas.map(f => ({
      Folio: f.idEntrega,
      Colaborador: f.trabajador,
      Área: f.area,
      Artículo: f.articulo,
      'F. Asignación': f.fechaEntrega,
      'F. Vencimiento': f.fechaRenovacion,
      'Condición Actual': f.estado,
    }))

    // 6. Inventario Valorizado Completo
    const todosArticulos = await prisma.articuloEPP.findMany({
      where: { activo: true },
      orderBy: { categoria: 'asc' },
    })

    const inventarioValorizado = todosArticulos.map(a => ({
      'Código SKU': a.codigo,
      'Descripción': a.nombre,
      'Categoría': a.categoria,
      'Talla': a.talla || 'Estándar',
      'Stock Actual': a.stockActual,
      'Stock Mínimo': a.stockMinimo,
      'Costo Unitario (S/)': a.costoUnitario,
      'Valorización Total (S/)': Number((a.stockActual * a.costoUnitario).toFixed(2)),
      'Alerta Stock': a.stockActual <= a.stockMinimo ? 'CRÍTICO / REPONER' : 'NORMAL',
    }))

    const payload = {
      mesClave: mesParam,
      nombreMes: nombreMesCap,
      totalEntregas: entregas.length,
      totalItems: filasEntregas.reduce((s, f) => s + f.cantidad, 0),
      totalGasto: Number(filasEntregas.reduce((s, f) => s + f.costoTotal, 0).toFixed(2)),
      totalTrabajadoresAtendidos: new Set(filasEntregas.map(f => f.dni)).size,
      filasEntregas,
      resumenAreas,
      resumenCategorias,
      resumenVidaUtil,
      inventarioValorizado,
    }

    if (formatoDescarga) {
      const wb = construirLibroConsolidadoMensual(payload)
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      const nombreArchivo = `Consolidado_Mensual_DALUPEZMAR_${mesParam}.xlsx`

      return new NextResponse(excelBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        },
      })
    }

    return NextResponse.json(payload)
  } catch (error: any) {
    console.error('Error al generar consolidado mensual:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar el consolidado mensual' },
      { status: 500 }
    )
  }
}
