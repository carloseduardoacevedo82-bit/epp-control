'use client'

import React, { useEffect, useState, useRef } from 'react'
import {
  FolderArchive,
  FolderOpen,
  FileText,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PackageCheck,
  Archive,
  RefreshCw,
  Sparkles,
  Layers,
  FileCheck,
  Eye,
  X,
  Plus,
  Coins,
  ShieldCheck,
  History,
  Clock,
  ArrowLeft,
  Users,
} from 'lucide-react'
import type { CarpetaTrabajadorConstancias, ConstanciaArchivoItem, Entrega } from '@/lib/types'
import { generarActaEntregaPDF, obtenerActaPDFBlobUrl } from '@/lib/generatePDF'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface MesDisponible {
  mes: string
  label: string
  totalActas: number
  totalPrendas: number
  totalCosto: number
}

interface ResumenPeriodo {
  totalActas: number
  totalCarpetas: number
  totalPrendas: number
  inversionTotal: number
}

export default function ConstanciasPage() {
  const [carpetas, setCarpetas] = useState<CarpetaTrabajadorConstancias[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [carpetaExpandida, setCarpetaExpandida] = useState<string | null>(null)
  const [descargandoZip, setDescargandoZip] = useState(false)
  const [descargandoZipMensual, setDescargandoZipMensual] = useState(false)

  // Mes actual del sistema (ej: '2026-09')
  const mesActualStr = format(new Date(), 'yyyy-MM')
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>(mesActualStr)
  
  const [mesesDisponibles, setMesesDisponibles] = useState<MesDisponible[]>([])
  const [resumenPeriodo, setResumenPeriodo] = useState<ResumenPeriodo>({
    totalActas: 0,
    totalCarpetas: 0,
    totalPrendas: 0,
    inversionTotal: 0,
  })

  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null)
  const [pdfModalTitulo, setPdfModalTitulo] = useState<string>('')
  const [cargandoPdfId, setCargandoPdfId] = useState<number | null>(null)

  const esMesActual = periodoSeleccionado === mesActualStr
  const esHistoricoCompleto = periodoSeleccionado === 'todos'

  // Cargar carpetas y datos
  const cargarConstancias = async (periodo: string, silente: boolean = false) => {
    if (!silente) setLoading(true)
    setIsRefreshing(true)
    try {
      const url = periodo === 'todos' ? '/api/constancias?mes=todos' : `/api/constancias?mes=${periodo}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setCarpetas(data.carpetas)
        if (data.mesesDisponibles) {
          setMesesDisponibles(data.mesesDisponibles)
        }
        if (data.resumenPeriodo) {
          setResumenPeriodo(data.resumenPeriodo)
        }
        if (data.carpetas.length > 0 && !carpetaExpandida) {
          setCarpetaExpandida(data.carpetas[0].rutaCarpeta)
        }
        setUltimaSincronizacion(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      }
    } catch (err) {
      console.error('Error al cargar constancias:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Cargar al cambiar el período
  useEffect(() => {
    cargarConstancias(periodoSeleccionado)
  }, [periodoSeleccionado])

  // Polling automático cada 30 segundos solo si está visualizando el mes actual
  useEffect(() => {
    if (!esMesActual) return
    const interval = setInterval(() => {
      cargarConstancias(mesActualStr, true)
    }, 30000)
    return () => clearInterval(interval)
  }, [esMesActual, mesActualStr])

  // Obtener etiqueta amigable del período seleccionado
  const obtenerLabelPeriodo = () => {
    if (esHistoricoCompleto) return 'Histórico Consolidado (Todos los Meses)'
    const mesObj = mesesDisponibles.find(m => m.mes === periodoSeleccionado)
    if (mesObj) return mesObj.label
    try {
      const [y, m] = periodoSeleccionado.split('-')
      const d = new Date(parseInt(y), parseInt(m) - 1, 1)
      const formatted = format(d, 'MMMM yyyy', { locale: es })
      return formatted.charAt(0).toUpperCase() + formatted.slice(1)
    } catch {
      return periodoSeleccionado
    }
  }

  const carpetasFiltradas = carpetas.filter(c => {
    const q = search.toLowerCase()
    return (
      c.apellidosNombres.toLowerCase().includes(q) ||
      c.dni.includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.cargo.toLowerCase().includes(q)
    )
  })

  const handleDescargarZipPeriodo = () => {
    setDescargandoZipMensual(true)
    if (esHistoricoCompleto) {
      window.location.href = '/api/constancias?zip=true'
    } else {
      window.location.href = `/api/constancias?zip=true&mes=${periodoSeleccionado}`
    }
    setTimeout(() => setDescargandoZipMensual(false), 2500)
  }

  const handleDescargarZipGeneral = () => {
    setDescargandoZip(true)
    window.location.href = '/api/constancias?zip=true'
    setTimeout(() => setDescargandoZip(false), 2500)
  }

  const handleDescargarZipCarpeta = (nombreCarpeta: string) => {
    window.location.href = `/api/constancias?zip=true&carpeta=${encodeURIComponent(nombreCarpeta)}`
  }

  const handleVerPDF = async (archivo: ConstanciaArchivoItem) => {
    setCargandoPdfId(archivo.id)
    try {
      const res = await fetch(`/api/entregas?trabajadorId=${archivo.trabajadorId}`)
      const entregas: Entrega[] = await res.json()
      const entrega = entregas.find(e => e.id === archivo.entregaId)
      if (entrega) {
        const url = obtenerActaPDFBlobUrl(entrega)
        const idPad = String(entrega.id).padStart(5, '0')
        setPdfModalTitulo(`Constancia Oficial ENT-${idPad} • ${entrega.trabajador.apellidos}, ${entrega.trabajador.nombres}`)
        setPdfModalUrl(url)
      } else {
        window.open(archivo.rutaRelativa, '_blank')
      }
    } catch {
      window.open(archivo.rutaRelativa, '_blank')
    } finally {
      setCargandoPdfId(null)
    }
  }

  const handleDescargarPDFIndividual = async (archivo: ConstanciaArchivoItem) => {
    try {
      const res = await fetch(`/api/entregas?trabajadorId=${archivo.trabajadorId}`)
      const entregas: Entrega[] = await res.json()
      const entrega = entregas.find(e => e.id === archivo.entregaId)
      if (entrega) {
        generarActaEntregaPDF(entrega)
      } else {
        window.open(archivo.rutaRelativa, '_blank')
      }
    } catch {
      window.open(archivo.rutaRelativa, '_blank')
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── ENCABEZADO Y ESTADO DE SINCRONIZACIÓN ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                Archivo Digital de Actas y Constancias
              </h1>
              {esMesActual ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  MES ACTUAL (En Vivo)
                </span>
              ) : esHistoricoCompleto ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  <History size={12} /> HISTÓRICO GENERAL
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Calendar size={12} /> HISTÓRICO ({obtenerLabelPeriodo()})
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              Expedientes oficiales con firma digital organizados por mes calendario y colaborador
            </p>
          </div>
        </div>

        {/* Acciones Rápidas del Header */}
        <div className="flex flex-wrap items-center gap-2">
          {ultimaSincronizacion && (
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
              <Clock size={12} className="text-slate-400" />
              <span>Sincronizado: {ultimaSincronizacion}</span>
            </span>
          )}

          <button
            onClick={() => cargarConstancias(periodoSeleccionado)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Refrescar datos ahora"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>

          {!esMesActual && (
            <button
              onClick={() => setPeriodoSeleccionado(mesActualStr)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={13} /> Volver a Mes Actual
            </button>
          )}

          <Link
            href="/entregas/nueva"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus size={14} /> Nueva Entrega
          </Link>
        </div>
      </div>

      {/* ── BARRA DE NAVEGACIÓN Y SELECTOR DE MESES (HISTÓRICO) ──────────── */}
      <div className="card p-4 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600/10 text-blue-700 dark:text-blue-400 rounded-lg font-black text-xs">
              <Calendar size={15} />
            </span>
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Consulta de Meses e Historial
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Seleccione un mes del histórico o consulte el consolidado general
              </p>
            </div>
          </div>

          {/* Selector de Mes Libre */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs self-start md:self-auto">
            <Calendar size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <label htmlFor="mes-selector" className="text-[11px] font-bold text-slate-500 uppercase">
              Otro Mes:
            </label>
            <input
              id="mes-selector"
              type="month"
              value={esHistoricoCompleto ? mesActualStr : periodoSeleccionado}
              onChange={e => {
                if (e.target.value) setPeriodoSeleccionado(e.target.value)
              }}
              className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Píldoras de Acceso Rápido por Mes */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          {/* Botón Mes Actual */}
          <button
            onClick={() => setPeriodoSeleccionado(mesActualStr)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-xs ${
              esMesActual
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${esMesActual ? 'bg-emerald-300 animate-ping' : 'bg-emerald-500'}`}></span>
            <span>Mes Actual ({obtenerLabelPeriodo().split(' ')[0]})</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
              esMesActual ? 'bg-blue-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {mesesDisponibles.find(m => m.mes === mesActualStr)?.totalActas ?? 0}
            </span>
          </button>

          {/* Meses Históricos Disponibles con Actas */}
          {mesesDisponibles
            .filter(m => m.mes !== mesActualStr && m.totalActas > 0)
            .map(m => {
              const activo = periodoSeleccionado === m.mes
              return (
                <button
                  key={m.mes}
                  onClick={() => setPeriodoSeleccionado(m.mes)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-xs ${
                    activo
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                      : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <FolderArchive size={13} className={activo ? 'text-white' : 'text-blue-500'} />
                  <span>{m.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                    activo ? 'bg-blue-800 text-white' : 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300'
                  }`}>
                    {m.totalActas} {m.totalActas === 1 ? 'acta' : 'actas'}
                  </span>
                </button>
              )
            })}

          {/* Botón Todo el Histórico */}
          <button
            onClick={() => setPeriodoSeleccionado('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-xs ${
              esHistoricoCompleto
                ? 'bg-purple-700 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/40'
                : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers size={13} className={esHistoricoCompleto ? 'text-white' : 'text-purple-500'} />
            <span>Todo el Histórico</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
              esHistoricoCompleto ? 'bg-purple-900 text-white' : 'bg-purple-50 dark:bg-slate-700 text-purple-700 dark:text-purple-300'
            }`}>
              {mesesDisponibles.reduce((acc, m) => acc + m.totalActas, 0)}
            </span>
          </button>
        </div>
      </div>

      {/* ── TARJETAS KPI DE RESUMEN DEL PERÍODO ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/40">
            <FileCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actas Emitidas</p>
            <p className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono">
              {resumenPeriodo.totalActas}
            </p>
          </div>
        </div>

        <div className="card p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Colaboradores</p>
            <p className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono">
              {resumenPeriodo.totalCarpetas}
            </p>
          </div>
        </div>

        <div className="card p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-700/40">
            <PackageCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prendas / EPPs</p>
            <p className="text-lg sm:text-xl font-black text-slate-950 dark:text-white font-mono">
              {resumenPeriodo.totalPrendas}
            </p>
          </div>
        </div>

        <div className="card p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/40">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inversión Dotación</p>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
              S/ {resumenPeriodo.inversionTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ── PANEL DE DESCARGA MASIVA DIRECTA (PDFs Planos) ──────────────── */}
      <div className="card p-4 sm:p-5 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-900 border-blue-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                <FileCheck size={16} />
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                Descarga Masiva de Actas PDF para Auditoría SST
              </h2>
              <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                {obtenerLabelPeriodo()}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
              Descargue en un solo archivo comprimido (.ZIP) todos los documentos PDF con firmas digitales, nombrados según norma <span className="font-mono text-blue-700 dark:text-cyan-300 font-bold">YYYY-MM-DD_ENT-XXXXX_DNI_Apellidos_Nombres.pdf</span> listos para inspecciones laborales de SUNAFIL o auditorías internas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleDescargarZipPeriodo}
              disabled={descargandoZipMensual || resumenPeriodo.totalActas === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download size={15} />
              {descargandoZipMensual
                ? 'Comprimiendo Actas...'
                : esHistoricoCompleto
                ? 'Descargar Todo el Histórico (ZIP)'
                : `Descargar Actas de ${obtenerLabelPeriodo()} (ZIP)`}
            </button>

            {!esHistoricoCompleto && (
              <button
                onClick={handleDescargarZipGeneral}
                disabled={descargandoZip}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Descargar histórico general consolidado de todos los tiempos"
              >
                <Archive size={14} /> Todo el Histórico
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y TOTALES EN PANTALLA ───────────────────────── */}
      <div className="card p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            className="input-field input-with-icon text-xs py-2.5"
            placeholder={`Buscar por DNI, colaborador o departamento en ${obtenerLabelPeriodo()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-400">
          <span>
            Mostrando Carpetas: <strong className="text-slate-950 dark:text-white font-black">{carpetasFiltradas.length}</strong>
          </span>
          <span>•</span>
          <span>
            Actas en Vista: <strong className="text-blue-700 dark:text-cyan-400 font-black font-mono">
              {carpetasFiltradas.reduce((acc, c) => acc + c.totalConstancias, 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* ── ÁRBOL DE EXPEDIENTES / CARPETAS POR TRABAJADOR ────────────────── */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-xs space-y-2">
            <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto" />
            <p className="font-bold">Cargando constancias de {obtenerLabelPeriodo()}...</p>
          </div>
        ) : carpetasFiltradas.length === 0 ? (
          /* Estado Vacío Inteligente */
          <div className="card p-10 text-center space-y-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FolderArchive size={28} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {search
                  ? `No se encontraron resultados para "${search}"`
                  : `No se registran entregas en ${obtenerLabelPeriodo()}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {search
                  ? 'Intente con otro término o verifique el DNI del trabajador.'
                  : 'Puede registrar una nueva entrega para este mes o revisar las actas registradas en los meses anteriores.'}
              </p>
            </div>

            {!search && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Link
                  href="/entregas/nueva"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95"
                >
                  <Plus size={14} /> Registrar Nueva Entrega
                </Link>

                {mesesDisponibles.find(m => m.mes !== periodoSeleccionado && m.totalActas > 0) && (
                  <button
                    onClick={() => {
                      const primerMesConActas = mesesDisponibles.find(m => m.totalActas > 0)
                      if (primerMesConActas) setPeriodoSeleccionado(primerMesConActas.mes)
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition"
                  >
                    Ver Mes con Actas Anteriores
                  </button>
                )}

                <button
                  onClick={() => setPeriodoSeleccionado('todos')}
                  className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 transition"
                >
                  Ver Todo el Histórico
                </button>
              </div>
            )}
          </div>
        ) : (
          carpetasFiltradas.map(c => {
            const carpetaKey = c.rutaCarpeta.split('/').pop() || c.dni
            const estaExpandida = carpetaExpandida === c.rutaCarpeta

            return (
              <div
                key={c.dni}
                className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800/40 overflow-hidden transition shadow-xs"
              >
                {/* Cabecera de la Carpeta */}
                <div
                  onClick={() => setCarpetaExpandida(estaExpandida ? null : c.rutaCarpeta)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition select-none"
                >
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-500/30 mt-0.5">
                        {estaExpandida ? <FolderOpen size={20} /> : <FolderArchive size={20} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-black text-slate-950 dark:text-white leading-snug">
                            {c.apellidosNombres}
                          </p>
                          <span className="font-mono text-[11px] text-blue-700 dark:text-cyan-300 font-bold bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-slate-700 shrink-0">
                            DNI: {c.dni}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 truncate">
                          {c.area} • {c.cargo}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                          {c.rutaCarpeta}/
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 self-center">
                      <span className="text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800/50 whitespace-nowrap">
                        {c.totalConstancias} {c.totalConstancias === 1 ? 'Acta' : 'Actas'}
                      </span>

                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDescargarZipCarpeta(carpetaKey)
                        }}
                        className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white transition border border-slate-300 dark:border-slate-600 cursor-pointer"
                        title="Descargar carpeta del trabajador en ZIP"
                      >
                        <Download size={14} />
                      </button>

                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform duration-200 ${
                          estaExpandida ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de Archivos PDF dentro de la Carpeta */}
                {estaExpandida && (
                  <div className="px-4 pb-4 pt-2 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700/50 space-y-2">
                    {c.archivos.map(archivo => (
                      <div
                        key={archivo.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800/40">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-mono font-bold text-slate-950 dark:text-white">
                              {archivo.nombreArchivo}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                              Emisión:{' '}
                              {new Date(archivo.fechaEntrega).toLocaleDateString('es-PE')} •{' '}
                              {archivo.totalItems} EPPs entregados • S/{' '}
                              {archivo.costoTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800/40">
                            <CheckCircle2 size={11} className="text-emerald-700" /> Firma Legal
                          </span>

                          <a
                            href={`/api/entregas/${archivo.entregaId}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-blue-500/20 cursor-pointer"
                            title="Abrir acta directamente en el visor de su celular, tablet o PC"
                          >
                            <Eye size={13} /> Ver PDF
                          </a>

                          <button
                            onClick={() => handleDescargarPDFIndividual(archivo)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-600 transition active:scale-95 shadow-2xs cursor-pointer"
                            title="Descargar archivo PDF"
                          >
                            <Download size={13} /> Descargar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── MODAL VISOR DE PDF PROFESIONAL ─────────────────────────────────── */}
      {pdfModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Barra Superior del Visor */}
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-white truncate">
                    {pdfModalTitulo}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                    Documento con firma digital y valor probatorio según Ley N° 29783
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={pdfModalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink size={13} /> <span className="hidden sm:inline">Pestaña Nueva</span>
                </a>

                <a
                  href={pdfModalUrl}
                  download="Constancia_Oficial_EPP.pdf"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  title="Descargar archivo PDF"
                >
                  <Download size={13} /> <span className="hidden sm:inline">Descargar</span>
                </a>

                <button
                  onClick={() => setPdfModalUrl(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition"
                  title="Cerrar visor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Contenedor del PDF (iFrame / Embed) */}
            <div className="flex-1 w-full bg-slate-950 relative">
              <iframe
                src={pdfModalUrl}
                className="w-full h-full border-0 rounded-b-2xl"
                title="Visor de Constancia PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
