'use client'

import React, { useState } from 'react'
import { QrCode, Scan, X, Check, Search, Sparkles, User, Package } from 'lucide-react'

interface ScannerSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string) => void
  mode: 'trabajador' | 'articulo'
  title?: string
  presets?: { code: string; label: string; desc?: string }[]
}

export default function ScannerSimulatorModal({
  isOpen,
  onClose,
  onScan,
  mode,
  title,
  presets = [],
}: ScannerSimulatorModalProps) {
  const [manualCode, setManualCode] = useState('')

  if (!isOpen) return null

  const handleSelectPreset = (code: string) => {
    onScan(code)
    onClose()
  }

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    onScan(manualCode.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              {mode === 'trabajador' ? <User size={18} /> : <Package size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {title || (mode === 'trabajador' ? 'Escaneo de DNI / Fotocheck' : 'Escaneo de Código SKU / EPP')}
              </h3>
              <p className="text-[11px] text-slate-400">Lector óptico de campo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visor de Escáner Animado */}
        <div className="relative p-6 bg-slate-950 flex flex-col items-center justify-center border-b border-slate-800">
          <div className="relative w-48 h-36 border-2 border-dashed border-cyan-500/70 rounded-xl overflow-hidden flex items-center justify-center bg-cyan-950/20">
            {/* Línea láser de escaneo animada */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-bounce" />
            <Scan className="w-16 h-16 text-cyan-400/40" />
            <span className="absolute bottom-2 text-[10px] font-mono text-cyan-300 bg-slate-900/80 px-2 py-0.5 rounded">
              ENFOCANDO CÓDIGO
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Alinee el código de barras o fotocheck frente a la cámara o seleccione de la lista rápida
          </p>
        </div>

        {/* Presets de prueba rápida de campo */}
        {presets.length > 0 && (
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400" /> Coincidencias Rápidas en Almacén:
            </p>
            <div className="space-y-1.5">
              {presets.map(p => (
                <button
                  key={p.code}
                  onClick={() => handleSelectPreset(p.code)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-between text-left transition group"
                >
                  <div>
                    <span className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                      {p.code}
                    </span>
                    <span className="text-xs text-slate-300 ml-2">{p.label}</span>
                    {p.desc && <p className="text-[10px] text-slate-500">{p.desc}</p>}
                  </div>
                  <Check size={14} className="text-slate-500 group-hover:text-cyan-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Manual de Respaldo */}
        <form onSubmit={handleSubmitManual} className="p-4 bg-slate-800/50 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder={mode === 'trabajador' ? 'Ingresar DNI manualmente...' : 'Ingresar SKU manualmente...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition"
          >
            Listo
          </button>
        </form>
      </div>
    </div>
  )
}
