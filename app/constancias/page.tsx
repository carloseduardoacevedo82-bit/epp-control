'use client'

import React, { useEffect, useState } from 'react'
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
  Printer,
  Loader2,
} from 'lucide-react'
import type { CarpetaTrabajadorConstancias, ConstanciaArchivoItem, Entrega } from '@/lib/types'
import { generarActaEntregaPDF, obtenerActaPDFBlobUrl } from '@/lib/generatePDF'
import { format } from 'date-fns'

export default function ConstanciasPage() {
  const [carpetas, setCarpetas] = useState<CarpetaTrabajadorConstancias[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [carpetaExpandida, setCarpetaExpandida] = useState<string | null>(null)
  const [descargandoZip, setDescargandoZip] = useState(false)
  const [descargandoZipMensual, setDescargandoZipMensual] = useState(false)
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'))
  const [soloMesActual, setSoloMesActual] = useState(false)
  const [pdfModalUrl, setPdfModalUrl] = useState<string | null>(null)
  const [pdfModalTitulo, setPdfModalTitulo] = useState<string>('')
  const [cargandoPdfId, setCargandoPdfId] = useState<number | null>(null)

  const cargarCarpetas = async (mesFiltro?: string) => {
    setLoading(true)
    try {
      const url = mesFiltro ? `/api/constancias?mes=${mesFiltro}` : '/api/constancias'
      const res = await fetch(url)
      const data = await res.json()
      if (data.ok) {
        setCarpetas(data.carpetas)
        if (data.carpetas.length > 0 && !carpetaExpandida) {
          setCarpetaExpandida(data.carpetas[0].rutaCarpeta)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCarpetas(soloMesActual ? mesSeleccionado : undefined)
  }, [soloMesActual, mesSeleccionado])

  const carpetasFiltradas = carpetas.filter(c => {
    const q = search.toLowerCase()
    return (
      c.apellidosNombres.toLowerCase().includes(q) ||
      c.dni.includes(q) ||
      c.area.toLowerCase().includes(q) ||
      c.cargo.toLowerCase().includes(q)
    )
  })

  const totalActas = carpetas.reduce((acc, c) => acc + c.totalConstancias, 0)

  const handleDescargarZipMensual = (mes: string) => {
    setDescargandoZipMensual(true)
    window.location.href = `/api/constancias?zip=true&mes=${mes}`
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
              Archivo Digital Estructurado de Constancias
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              Expedientes de entrega con firma digital archivados por mes y trabajador
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => cargarCarpetas(soloMesActual ? mesSeleccionado : undefined)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
            title="Refrescar carpetas"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={handleDescargarZipGeneral}
            disabled={totalActas === 0 || descargandoZip}
            className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 shadow-sm transition active:scale-95 disabled:opacity-40"
            title="Descarga todas las actas históricas"
          >
            <Archive size={15} /> {descargandoZip ? 'Comprimiendo...' : 'Descargar Todo el Histórico (ZIP)'}
          </button>
        </div>
      </div>

      {/* ── PANEL DE DESCARGA MASIVA MENSUAL PARA CONTROL Y AUDITORÍA ────── */}
      <div className="card p-5 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-900 border-blue-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                <FileCheck size={16} />
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                Descarga Masiva de Archivos PDF (Sin Carpetas)
              </h2>
              <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                PDFs Directos
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl font-medium">
              Descarga directamente en un solo archivo comprimido (.ZIP) todos los documentos PDF del mes seleccionado, con nombres identificativos claros <span className="font-mono text-blue-700 dark:text-cyan-300 font-bold">YYYY-MM-DD_ENT-XXXXX_DNI_Apellidos_Nombres.pdf</span> listos para usar sin subcarpetas.
            </p>
          </div>

          {/* Selector de Mes y Botón de Descarga Masiva */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs">
              <Calendar size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <label htmlFor="mes-control" className="text-[11px] font-bold text-slate-500 uppercase">Mes:</label>
              <input
                id="mes-control"
                type="month"
                value={mesSeleccionado}
                onChange={e => setMesSeleccionado(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleDescargarZipMensual(mesSeleccionado)}
              disabled={descargandoZipMensual}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download size={15} />
              {descargandoZipMensual ? 'Generando PDFs...' : `Descargar PDFs de ${mesSeleccionado} (ZIP)`}
            </button>
          </div>
        </div>

        {/* Barra de Filtro Rápido */}
        <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={soloMesActual}
                onChange={e => setSoloMesActual(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span>Filtrar carpetas mostradas solo para el mes de {mesSeleccionado}</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
            <span>Formato de descarga:</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Constancias_{mesSeleccionado.replace('-', '_')}.zip
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Estadísticas */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            className="input-field input-with-icon text-xs py-2.5"
            placeholder="Buscar por DNI, colaborador o departamento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-400">
          <span>
            Carpetas: <strong className="text-slate-950 dark:text-white font-black">{carpetas.length}</strong>
          </span>
          <span>•</span>
          <span>
            Total Actas PDF: <strong className="text-blue-700 dark:text-cyan-400 font-black font-mono">{totalActas}</strong>
          </span>
        </div>
      </div>

      {/* Árbol de Carpetas por Trabajador */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-8 text-center text-slate-400 text-xs">
            Cargando estructura de carpetas...
          </div>
        ) : carpetasFiltradas.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 text-xs">
            No se encontraron carpetas o constancias registradas.
          </div>
        ) : (
          carpetasFiltradas.map(c => {
            const carpetaKey = c.rutaCarpeta.split('/').pop() || c.dni
            const estaExpandida = carpetaExpandida === c.rutaCarpeta

            return (
              <div
                key={c.dni}
                className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800/40 overflow-hidden transition shadow-sm"
              >
                {/* Cabecera de la Carpeta */}
                <div
                  onClick={() => setCarpetaExpandida(estaExpandida ? null : c.rutaCarpeta)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
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
                        className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white transition border border-slate-300 dark:border-slate-600"
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
            <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
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
