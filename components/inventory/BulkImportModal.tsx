'use client'

import React, { useState, useRef } from 'react'
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Loader2,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { descargarPlantillaInventario } from '@/lib/excelTemplate'
import { validarArchivoExcel } from '@/lib/importExcelService'
import type { ResumenImportacionExcel, FilaValidadaImportacion } from '@/lib/types'

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [resumen, setResumen] = useState<ResumenImportacionExcel | null>(null)
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [filtroVista, setFiltroVista] = useState<'todas' | 'validas' | 'errores'>('todas')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const procesarArchivo = async (f: File) => {
    setErrorGlobal(null)
    setFile(f)
    setValidating(true)
    try {
      const resultado = await validarArchivoExcel(f, f.name)
      setResumen(resultado)
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al procesar el archivo Excel.')
      setResumen(null)
    } finally {
      setValidating(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivo(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivo(e.target.files[0])
    }
  }

  const handleGuardarImportacion = async () => {
    if (!resumen || resumen.filasValidas === 0) return
    setGuardando(true)
    setErrorGlobal(null)

    try {
      const res = await fetch('/api/articulos/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: resumen.items,
          nombreArchivo: resumen.nombreArchivo,
          usuarioResponsable: 'Admin SST / Gerencia',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la importación en el servidor')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al guardar los artículos importados')
    } finally {
      setGuardando(false)
    }
  }

  const itemsFiltrados = resumen
    ? resumen.items.filter(item => {
        if (filtroVista === 'validas') return item.esValida
        if (filtroVista === 'errores') return !item.esValida
        return true
      })
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Carga Masiva de Inventario EPP (Excel)
              </h2>
              <p className="text-xs text-slate-400">
                Importación y validación automática de stock con SheetJS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => descargarPlantillaInventario()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download size={14} /> Descargar Plantilla Oficial (.xlsx)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Zona de Arrastre y Carga */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/20 scale-[0.99]'
                : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
              <UploadCloud size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {file ? file.name : 'Arrastra tu archivo Excel aquí o haz clic para seleccionarlo'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Formatos compatibles: <span className="text-emerald-400 font-medium">.xlsx</span>, .xls, .csv
              </p>
            </div>
          </div>

          {/* Spinner de validación */}
          {validating && (
            <div className="p-6 text-center text-slate-300 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span className="text-xs">Validando cabeceras, SKUs duplicados y reglas de negocio...</span>
            </div>
          )}

          {/* Error Global */}
          {errorGlobal && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error en la validación:</p>
                <p className="mt-0.5 text-red-300">{errorGlobal}</p>
              </div>
            </div>
          )}

          {/* Resumen de Validación y Tabla de Previsualización */}
          {resumen && !validating && (
            <div className="space-y-4">
              {/* Tarjetas de Estadísticas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                  <p className="text-[11px] text-slate-400 font-medium">Total de Filas</p>
                  <p className="text-lg font-bold text-white mt-0.5">{resumen.totalFilas}</p>
                </div>
                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/40">
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Filas Válidas
                  </p>
                  <p className="text-lg font-bold text-emerald-300 mt-0.5">{resumen.filasValidas}</p>
                </div>
                <div className="p-3 bg-red-950/40 rounded-xl border border-red-800/40">
                  <p className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> Con Observaciones
                  </p>
                  <p className="text-lg font-bold text-red-300 mt-0.5">{resumen.filasConError}</p>
                </div>
                <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40">
                  <p className="text-[11px] text-blue-400 font-medium">Estado de Carga</p>
                  <p className="text-xs font-bold text-blue-300 mt-1">
                    {resumen.filasValidas > 0 ? 'Listo p/ Importar' : 'Requiere Corrección'}
                  </p>
                </div>
              </div>

              {/* Filtros de Tabla */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFiltroVista('todas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filtroVista === 'todas'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todas ({resumen.totalFilas})
                  </button>
                  <button
                    onClick={() => setFiltroVista('validas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filtroVista === 'validas'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Válidas ({resumen.filasValidas})
                  </button>
                  <button
                    onClick={() => setFiltroVista('errores')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filtroVista === 'errores'
                        ? 'bg-red-900/60 text-red-300 border border-red-700/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Con Errores ({resumen.filasConError})
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  Previsualización previa a la base de datos
                </span>
              </div>

              {/* Tabla de Datos */}
              <div className="border border-slate-700/70 rounded-xl overflow-hidden shadow-inner max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-300 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 text-center">Fila</th>
                      <th className="p-2.5">Código SKU</th>
                      <th className="p-2.5">Descripción del EPP</th>
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5 text-center">Talla</th>
                      <th className="p-2.5 text-center">Stock</th>
                      <th className="p-2.5 text-right">Costo (S/)</th>
                      <th className="p-2.5 text-center">Vida Útil</th>
                      <th className="p-2.5">Estado / Diagnóstico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/90 text-slate-300">
                    {itemsFiltrados.map(item => (
                      <tr
                        key={item.numeroFila}
                        className={`transition ${
                          item.esValida
                            ? 'hover:bg-slate-800/60'
                            : 'bg-red-950/20 hover:bg-red-950/30'
                        }`}
                      >
                        <td className="p-2.5 text-center font-mono text-slate-400">
                          #{item.numeroFila}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-white">
                          {item.codigo}
                        </td>
                        <td className="p-2.5 font-medium max-w-[200px] truncate" title={item.nombre}>
                          {item.nombre}
                        </td>
                        <td className="p-2.5 text-slate-400">{item.categoria}</td>
                        <td className="p-2.5 text-center text-slate-400">{item.talla}</td>
                        <td className="p-2.5 text-center font-semibold text-slate-200">
                          {item.stockActual}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-400">
                          S/ {item.costoUnitario.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center text-slate-400">
                          {item.vidaUtilDias} d
                        </td>
                        <td className="p-2.5">
                          {item.esValida ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
                              <CheckCircle2 size={11} /> Correcto
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              {item.errores.map((err, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] text-red-300 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800/60 block"
                                >
                                  <AlertTriangle size={10} className="text-red-400 shrink-0" /> {err}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleGuardarImportacion}
            disabled={!resumen || resumen.filasValidas === 0 || guardando}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
          >
            {guardando ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando en Inventario...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Confirmar e Importar {resumen?.filasValidas || 0} Artículos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
