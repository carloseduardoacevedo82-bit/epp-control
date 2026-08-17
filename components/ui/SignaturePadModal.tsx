'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  PenTool,
  RotateCcw,
  Check,
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

interface SignaturePadModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (signatureBase64: string) => void
  workerName: string
  workerDni: string
}

export default function SignaturePadModal({
  isOpen,
  onClose,
  onConfirm,
  workerName,
  workerDni,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#0f172a') // dark navy
  const [strokeWidth, setStrokeWidth] = useState(3)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  // Redimensionar canvas manteniendo alta resolución
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
    }
  }, [strokeColor, strokeWidth])

  useEffect(() => {
    if (isOpen) {
      // Pequeño timeout para permitir que el modal se monte y tenga dimensiones
      const timer = setTimeout(() => {
        setupCanvas()
        setHasDrawn(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, setupCanvas, isFullScreen])

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true)
    const coords = getCoordinates(e)
    lastPoint.current = coords
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.arc(coords.x, coords.y, strokeWidth / 2, 0, Math.PI * 2)
      ctx.fillStyle = strokeColor
      ctx.fill()
    }
  }

  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !lastPoint.current) return
    const coords = getCoordinates(e)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = strokeWidth
      ctx.stroke()
      lastPoint.current = coords
      setHasDrawn(true)
    }
  }

  const handleEnd = () => {
    setIsDrawing(false)
    lastPoint.current = null
  }

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, rect.width, rect.height)
      setHasDrawn(false)
    }
  }

  const handleConfirmSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return
    const dataUrl = canvas.toDataURL('image/png')
    onConfirm(dataUrl)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-all">
      <div
        className={`w-full bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullScreen ? 'h-[98vh] max-w-[98vw]' : 'max-w-2xl max-h-[92vh]'
        }`}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Firma Táctil de Conformidad
              </h3>
              <p className="text-xs text-slate-400">
                Colaborador: <span className="text-blue-300 font-semibold">{workerName}</span> (DNI: {workerDni})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title={isFullScreen ? 'Modo Normal' : 'Modo Pantalla Completa'}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Declaración Legal Resumida */}
        <div className="px-5 py-2.5 bg-blue-950/40 border-b border-blue-800/30 flex items-center gap-2 text-xs text-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            El trazo digital estampa la constancia oficial de entrega según <strong>Ley N° 29783 SSOMA</strong>.
          </span>
        </div>

        {/* Área del Canvas */}
        <div className="relative flex-1 bg-slate-950 p-4 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[320px]">
          <div className="relative w-full h-full border-2 border-dashed border-slate-700 rounded-xl overflow-hidden shadow-inner bg-white cursor-crosshair">
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />

            {/* Línea guía de firma */}
            <div className="absolute bottom-8 left-8 right-8 border-b-2 border-slate-300/80 pointer-events-none flex justify-between items-center text-[10px] text-slate-400 px-2">
              <span>Firma del titular</span>
              <span>DNI: {workerDni}</span>
            </div>

            {!hasDrawn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-sm gap-2">
                <PenTool className="w-8 h-8 opacity-40 animate-pulse text-blue-500" />
                <span className="font-medium text-slate-500">
                  Dibuje su firma con el dedo o stylus sobre la pantalla
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Opciones de trazo y Controles */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
            >
              <RotateCcw size={15} /> Limpiar Trazo
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/50">
              <button
                onClick={() => { setStrokeColor('#0f172a'); setupCanvas() }}
                className={`w-6 h-6 rounded-full bg-slate-900 border-2 ${
                  strokeColor === '#0f172a' ? 'border-blue-400 scale-110' : 'border-transparent'
                }`}
                title="Tinta Azul Marino"
              />
              <button
                onClick={() => { setStrokeColor('#1e40af'); setupCanvas() }}
                className={`w-6 h-6 rounded-full bg-blue-800 border-2 ${
                  strokeColor === '#1e40af' ? 'border-blue-400 scale-110' : 'border-transparent'
                }`}
                title="Tinta Azul"
              />
              <button
                onClick={() => { setStrokeColor('#000000'); setupCanvas() }}
                className={`w-6 h-6 rounded-full bg-black border-2 ${
                  strokeColor === '#000000' ? 'border-blue-400 scale-110' : 'border-transparent'
                }`}
                title="Tinta Negra"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSignature}
              disabled={!hasDrawn}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition transform active:scale-95"
            >
              <Check size={16} /> Confirmar y Estampar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
