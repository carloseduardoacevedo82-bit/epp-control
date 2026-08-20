'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  FileBarChart2,
  Download,
  Filter,
  Search,
  X,
  FolderArchive,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Building2,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  History,
} from 'lucide-react'
import type { FilaReporte, Trabajador, LogImportacionRegistro } from '@/lib/types'
import { AREAS, CATEGORIAS_EPP as CATEGORIAS } from '@/lib/types'
import { format } from 'date-fns'
import { useRole } from '@/components/auth/RoleContext'

interface CierreMensual {
  mesClave: string
  nombreMes: string
  archivoExcel: string
  rutaRelativa: string
  totalEntregas: number
  totalItems: number
  totalGasto: number
  totalTrabajadores: number
  fechaGenerado: string
  existeEnDisco: boolean
}

export default function ReportesPage() {
  const { isAdmin } = useRole()
  const [tabActiva, setTabActiva] = useState<'consolidado' | 'busqueda' | 'auditoria'>('consolidado')
  const [filas, setFilas] = useState<FilaReporte[]>([])
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Cierres mensuales y Consolidado Multi-Hoja
  const [cierres, setCierres] = useState<CierreMensual[]>([])
  const [loadingCierres, setLoadingCierres] = useState(true)
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'))
  const [generandoConsolidado, setGenerandoConsolidado] = useState(false)
  const [datosPreview, setDatosPreview] = useState<any | null>(null)
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')

  // Logs de importación
  const [logs, setLogs] = useState<LogImportacionRegistro[]>([])

  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    trabajadorId: '',
    area: '',
    categoria: '',
    estadoRenovacion: '',
  })

  const cargarCierres = async () => {
    setLoadingCierres(true)
    try {
      const res = await fetch('/api/reportes/mensuales')
      const data = await res.json()
      if (data.ok) {
        setCierres(data.cierres)
      }
    } finally {
      setLoadingCierres(false)
    }
  }

  const cargarPreviewConsolidado = async (mes: string) => {
    try {
      const res = await fetch(`/api/reportes/consolidado?mes=${mes}`)
      const data = await res.json()
      setDatosPreview(data)
    } catch {
      // preview error
    }
  }

  useEffect(() => {
    fetch('/api/trabajadores').then(r => r.json()).then(setTrabajadores)
    cargarCierres()
    cargarBusqueda()
    cargarPreviewConsolidado(mesSeleccionado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarBusqueda = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    const res = await fetch(`/api/reportes?${params}`)
    const data = await res.json()
    setFilas(data)
    setLoading(false)
  }, [filtros])

  const handleDescargarConsolidadoExcel = async (mes: string) => {
    setGenerandoConsolidado(true)
    setMensajeExito('')
    setMensajeError('')
    try {
      window.location.href = `/api/reportes/consolidado?mes=${mes}&descarga=true`
      setMensajeExito(`Generando libro Excel consolidado de 4 pestañas para ${mes}...`)
    } catch (err: any) {
      setMensajeError('Error al descargar el consolidado mensual.')
    } finally {
      setTimeout(() => setGenerandoConsolidado(false), 2000)
    }
  }

  const exportarExcelFiltros = async () => {
    if (!filas.length) return
    setExporting(true)
    try {
      const { exportarExcel } = await import('@/lib/generateExcel')
      exportarExcel(filas, 'Reporte_Personalizado_DALUPEZMAR')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <FileBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Reportes Ejecutivos y Cierre Consolidado Mensual
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Generación de informes multi-hoja en Excel y trazabilidad legal de actas
            </p>
          </div>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setTabActiva('consolidado')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              tabActiva === 'consolidado' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={14} /> Consolidado Mensual
          </button>
          <button
            onClick={() => setTabActiva('busqueda')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              tabActiva === 'busqueda' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Filter size={14} /> Búsqueda y Filtros
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* ── PESTAÑA 1: CONSOLIDADO MENSUAL MULTI-HOJA EN EXCEL ──────────────── */}
      {tabActiva === 'consolidado' && (
        <div className="space-y-6">
          {/* Tarjeta Generador de Cierre */}
          <div className="card p-6 bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900 border-blue-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  REPORTE OFICIAL PARA AUDITORÍA Y GERENCIA
                </span>
                <h2 className="text-lg font-black text-white mt-1.5">
                  Reporte Consolidado Mensual en Excel (4 Pestañas)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Genera el libro Excel oficial con:{' '}
                  <strong>1. Detalle Entregas</strong>,{' '}
                  <strong>2. Consumo por Área</strong>,{' '}
                  <strong>3. Control Vida Útil</strong> y{' '}
                  <strong>4. Inventario Valorizado</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-auto">
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Seleccionar Mes de Cierre:
                  </label>
                  <input
                    type="month"
                    value={mesSeleccionado}
                    onChange={e => {
                      setMesSeleccionado(e.target.value)
                      cargarPreviewConsolidado(e.target.value)
                    }}
                    className="input-field text-xs py-2.5 font-bold w-full"
                  />
                </div>

                <button
                  onClick={() => handleDescargarConsolidadoExcel(mesSeleccionado)}
                  disabled={generandoConsolidado}
                  className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0"
                >
                  {generandoConsolidado ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Procesando...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Descargar Consolidado .XLSX
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Previsualización de Métricas del Mes */}
            {datosPreview && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-transparent">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Total Actas Emitidas</p>
                  <p className="text-base font-black text-slate-950 dark:text-white mt-0.5">
                    {datosPreview.totalEntregas} actas
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-transparent">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Prendas / EPPs Entregados</p>
                  <p className="text-base font-black text-blue-700 dark:text-cyan-300 mt-0.5">
                    {datosPreview.totalItems} unidades
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Inversión Total del Mes</p>
                  <p className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                    S/ {datosPreview.totalGasto?.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-transparent">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Personal Atendido</p>
                  <p className="text-base font-black text-purple-700 dark:text-violet-300 mt-0.5">
                    {datosPreview.totalTrabajadoresAtendidos} colaboradores
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Histórico de Cierres Mensuales Guardados en Disco */}
          <div className="card p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              Histórico de Cierres Mensuales en Servidor
            </h3>

            {loadingCierres ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Cargando histórico de cierres...
              </div>
            ) : cierres.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No hay cierres generados en disco. Seleccione un mes arriba para emitir el consolidado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cierres.map(c => (
                  <div
                    key={c.mesClave}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-950 dark:text-white">{c.nombreMes}</span>
                        <span className="font-mono text-blue-700 dark:text-cyan-400 font-bold">{c.mesClave}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono text-[10px] truncate">
                        {c.archivoExcel}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-black">
                        S/ {c.totalGasto.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDescargarConsolidadoExcel(c.mesClave)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Download size={13} /> Descargar .XLSX
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PESTAÑA 2: BÚSQUEDA Y FILTROS PERSONALIZADOS ─────────────────────── */}
      {tabActiva === 'busqueda' && (
        <div className="space-y-4">
          {/* Formulario de Filtros */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              Filtros Avanzados para Exportación Personalizada
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Fecha Desde:</label>
                <input
                  type="date"
                  className="input-field text-xs py-2"
                  value={filtros.fechaInicio}
                  onChange={e => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Fecha Hasta:</label>
                <input
                  type="date"
                  className="input-field text-xs py-2"
                  value={filtros.fechaFin}
                  onChange={e => setFiltros({ ...filtros, fechaFin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Colaborador:</label>
                <select
                  className="input-field text-xs py-2"
                  value={filtros.trabajadorId}
                  onChange={e => setFiltros({ ...filtros, trabajadorId: e.target.value })}
                >
                  <option value="">Todos los trabajadores</option>
                  {trabajadores.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.apellidos}, {t.nombres} ({t.dni})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Área / Puesto:</label>
                <select
                  className="input-field text-xs py-2"
                  value={filtros.area}
                  onChange={e => setFiltros({ ...filtros, area: e.target.value })}
                >
                  <option value="">Todas las áreas</option>
                  {AREAS.map(a => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Categoría EPP:</label>
                <select
                  className="input-field text-xs py-2"
                  value={filtros.categoria}
                  onChange={e => setFiltros({ ...filtros, categoria: e.target.value })}
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Condición Vida Útil:</label>
                <select
                  className="input-field text-xs py-2"
                  value={filtros.estadoRenovacion}
                  onChange={e => setFiltros({ ...filtros, estadoRenovacion: e.target.value })}
                >
                  <option value="">Todos los estados</option>
                  <option value="Vigente">Vigente</option>
                  <option value="Por Vencer">Por Vencer (&lt; 15 días)</option>
                  <option value="Vencido">Vencido</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                {filas.length} registros encontrados
              </span>
              <button
                onClick={exportarExcelFiltros}
                disabled={exporting || filas.length === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download size={14} /> Exportar Selección en Excel
              </button>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 font-semibold">
                  <tr>
                    <th className="p-3">DNI</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Área</th>
                    <th className="p-3">Artículo EPP</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Total (S/)</th>
                    <th className="p-3 text-center">F. Entrega</th>
                    <th className="p-3 text-center">F. Renovación</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/90 text-slate-300">
                  {filas.slice(0, 50).map((f, i) => (
                    <tr key={i} className="hover:bg-slate-800/60 transition">
                      <td className="p-3 font-mono text-cyan-400 font-bold">{f.dni}</td>
                      <td className="p-3 font-medium text-white">{f.trabajador}</td>
                      <td className="p-3 text-slate-400">{f.area}</td>
                      <td className="p-3">{f.articulo}</td>
                      <td className="p-3 text-center font-bold">{f.cantidad}</td>
                      <td className="p-3 text-right font-mono text-emerald-400">
                        S/ {f.costoTotal.toFixed(2)}
                      </td>
                      <td className="p-3 text-center text-slate-400">{f.fechaEntrega}</td>
                      <td className="p-3 text-center text-slate-400">{f.fechaRenovacion}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.estado === 'Vencido'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : f.estado === 'Por Vencer'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {f.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
