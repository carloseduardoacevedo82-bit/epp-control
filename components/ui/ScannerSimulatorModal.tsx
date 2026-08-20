'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  QrCode,
  Scan,
  X,
  Check,
  Search,
  Sparkles,
  User,
  Package,
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  AlertCircle,
  CheckCircle2,
  HardHat,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface ScannerSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (code: string, rawData?: any) => void
  mode: 'trabajador' | 'articulo'
  title?: string
  presets?: { code: string; label: string; desc?: string }[]
  workersList?: Array<{
    id: number
    dni: string
    codigoFotocheck?: string | null
    nombres: string
    apellidos: string
    cargo: string
    area: string
  }>
}

// Reproductor de sonido de confirmación nativo (Web Audio API)
function reproducirBeepExito() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // Nota La5 (880Hz)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // Subida rápida a 1760Hz

    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch (e) {
    // Ignorar si el navegador bloquea audio sin interacción
  }
}

// Limpiador y extractor inteligente de códigos
export function parseScannedCode(rawText: string): string {
  if (!rawText) return ''
  const trimmed = rawText.trim()

  // Caso 1: Si es un JSON serializado
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed.dni) return String(parsed.dni).trim()
      if (parsed.codigo) return String(parsed.codigo).trim()
      if (parsed.code) return String(parsed.code).trim()
      if (parsed.badge_code) return String(parsed.badge_code).trim()
    } catch {
      // Continuar con otros parsers
    }
  }

  // Caso 2: Tokens seguros tipo AGY_SEC_QR_DAL-1012_63401773 o AGY_SEC_QR_63401773_...
  if (trimmed.includes('AGY_SEC_QR_')) {
    const parts = trimmed.split('_')
    // Buscar si alguna parte es un DNI (8 dígitos) o código DAL-XXXX
    for (const part of parts) {
      if (/^DAL-\d+$/i.test(part)) return part.toUpperCase()
      if (/^\d{8}$/.test(part)) return part
    }
    // Si no, tomar el último segmento relevante
    const matchDni = trimmed.match(/\b\d{8}\b/)
    if (matchDni) return matchDni[0]
    const matchDal = trimmed.match(/DAL-\d+/i)
    if (matchDal) return matchDal[0].toUpperCase()
  }

  // Caso 3: Formato BADGE-DAL-1012
  if (trimmed.startsWith('BADGE-')) {
    return trimmed.replace('BADGE-', '').trim()
  }

  // Caso 4: Si es una URL con parámetros ej: https://...?dni=63401773 o ?code=DAL-1012
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed)
      const dniParam = url.searchParams.get('dni') || url.searchParams.get('doc')
      if (dniParam) return dniParam.trim()
      const codeParam = url.searchParams.get('code') || url.searchParams.get('badge')
      if (codeParam) return codeParam.trim()
    } catch {
      // Ignorar error de URL
    }
  }

  return trimmed
}

export default function OpticalScannerModal({
  isOpen,
  onClose,
  onScan,
  mode,
  title,
  presets = [],
  workersList = [],
}: ScannerSimulatorModalProps) {
  const [manualCode, setManualCode] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [hasTorch, setHasTorch] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [scannedResult, setScannedResult] = useState<{
    code: string
    worker?: any
    isInactive?: boolean
    timestamp: number
  } | null>(null)

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)
  const readerElementId = 'html5-optical-reader'

  // Detener cámara de forma segura
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
      } catch (err) {
        console.warn('Error al detener escáner:', err)
      }
      isScanningRef.current = false
      setCameraActive(false)
      setTorchOn(false)
    }
  }, [])

  // Iniciar lector óptico
  const startCamera = useCallback(async () => {
    setCameraError(null)
    setScannedResult(null)

    // Esperar a que el elemento DOM exista
    await new Promise(r => setTimeout(r, 150))
    const element = document.getElementById(readerElementId)
    if (!element) return

    try {
      if (html5QrCodeRef.current && isScanningRef.current) {
        await stopCamera()
      }

      const scanner = new Html5Qrcode(readerElementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      })
      html5QrCodeRef.current = scanner

      const config = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
          return {
            width: Math.floor(minEdge * 0.85),
            height: Math.floor(minEdge * 0.75),
          }
        },
        aspectRatio: 1.0,
      }

      await scanner.start(
        { facingMode: { exact: facingMode } },
        config,
        (decodedText: string) => {
          handleSuccessScan(decodedText)
        },
        () => {
          // Frame sin código detectado
        }
      )

      isScanningRef.current = true
      setCameraActive(true)

      // Verificar linterna (torch)
      try {
        const capabilities = scanner.getRunningTrackCameraCapabilities()
        if (capabilities && (capabilities as any).torchFeature) {
          setHasTorch(true)
        }
      } catch {
        setHasTorch(false)
      }
    } catch (err: any) {
      console.warn('No se pudo abrir cámara con exact facingMode, reintentando modo general:', err)
      // Fallback a cualquier cámara disponible
      try {
        if (!html5QrCodeRef.current) return
        await html5QrCodeRef.current.start(
          { facingMode: facingMode },
          {
            fps: 20,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            handleSuccessScan(decodedText)
          },
          () => {}
        )
        isScanningRef.current = true
        setCameraActive(true)
      } catch (fallbackErr: any) {
        console.error('Error al inicializar cámara:', fallbackErr)
        setCameraActive(false)
        setCameraError(
          fallbackErr.message ||
            'No se pudo acceder a la cámara. Asegúrese de dar permisos de cámara en el navegador o use la búsqueda manual.'
        )
      }
    }
  }, [facingMode, stopCamera])

  // Manejador de éxito al detectar código
  const handleSuccessScan = (rawText: string) => {
    const cleanedCode = parseScannedCode(rawText)
    if (!cleanedCode) return

    if (soundEnabled) {
      reproducirBeepExito()
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // Buscar si coincide con algún trabajador real
    let matchedWorker: any = null
    if (mode === 'trabajador' && workersList.length > 0) {
      matchedWorker = workersList.find(
        w =>
          w.dni === cleanedCode ||
          (w.codigoFotocheck && w.codigoFotocheck.toUpperCase() === cleanedCode.toUpperCase())
      )
    }

    const isInactive = matchedWorker && (matchedWorker.estado === 'inactivo' || matchedWorker.estado === 'BAJA' || matchedWorker.estado === 'INACTIVE')

    setScannedResult({
      code: cleanedCode,
      worker: matchedWorker,
      isInactive: !!isInactive,
      timestamp: Date.now(),
    })

    if (isInactive) {
      stopCamera()
      return
    }

    // Retardo breve para feedback visual y ejecutar onScan
    setTimeout(() => {
      onScan(cleanedCode, { raw: rawText, worker: matchedWorker })
      stopCamera()
      onClose()
    }, 700)
  }

  // Alternar linterna
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanningRef.current) return
    try {
      const nextState = !torchOn
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      })
      setTorchOn(nextState)
    } catch (e) {
      console.warn('Error al activar linterna:', e)
    }
  }

  // Alternar cámara frontal / trasera
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))
  }

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      setScannedResult(null)
      setCameraError(null)
      setManualCode('')
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  if (!isOpen) return null

  const handleSelectPreset = (code: string) => {
    if (soundEnabled) reproducirBeepExito()
    onScan(code)
    stopCamera()
    onClose()
  }

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    const code = parseScannedCode(manualCode)
    if (soundEnabled) reproducirBeepExito()
    onScan(code)
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
              {mode === 'trabajador' ? <HardHat size={20} /> : <Package size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">
                {title || (mode === 'trabajador' ? 'Lector Óptico de Fotochecks' : 'Escáner Óptico de SKU / EPP')}
              </h3>
              <p className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Cámara en vivo • DALUPEZMAR S.A.C.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/70 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visor de Cámara Real */}
        <div className="relative bg-black flex flex-col items-center justify-center overflow-hidden min-h-[290px] border-b border-slate-800">
          {/* Contenedor del video HTML5 QRCode */}
          <div
            id={readerElementId}
            className="w-full h-full min-h-[280px] max-h-[340px] flex items-center justify-center [&_video]:rounded-none [&_video]:object-cover"
          />

          {/* Superposición de Guía Láser y Cuadro de Enfoque */}
          {cameraActive && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              <div className="relative w-64 h-52 border-2 border-cyan-400/90 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.3)] bg-cyan-950/10 backdrop-contrast-125">
                {/* Esquinas destacadas */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-cyan-300 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-cyan-300 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-cyan-300 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-cyan-300 rounded-br-lg" />

                {/* Láser de barrido animado */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse top-1/2 -translate-y-1/2" />

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-3 py-0.5 rounded-full border border-cyan-500/40">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
                    QR (FRENTE) O BARRAS (REVERSO)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Feedback de Coincidencia Exitosa o Rechazo por Inactividad */}
          {scannedResult && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              {scannedResult.isInactive ? (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-red-500/20 border-2 border-red-500 text-red-400 flex items-center justify-center shadow-lg shadow-red-500/40 mb-3 animate-bounce">
                    <AlertCircle size={36} />
                  </div>
                  <h4 className="text-base font-black text-red-400">⛔ TRABAJADOR INACTIVO / DADO DE BAJA</h4>
                  <p className="text-xs font-bold text-red-300 font-mono mt-0.5">
                    {scannedResult.code}
                  </p>
                  {scannedResult.worker && (
                    <div className="mt-2.5 p-3.5 rounded-2xl bg-red-950/50 border border-red-800 text-left w-full max-w-xs space-y-1">
                      <p className="text-xs font-black text-white">
                        {scannedResult.worker.apellidos}, {scannedResult.worker.nombres}
                      </p>
                      <p className="text-[11px] text-red-300 font-medium">
                        Puesto: {scannedResult.worker.cargo || 'Operario'}
                      </p>
                      <p className="text-[10px] text-slate-300 font-bold">
                        Estado: <span className="text-red-400 font-extrabold uppercase">INACTIVO / CESADO</span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs font-black text-red-400 mt-2 bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-700">
                    ❌ ASIGNACIÓN DENEGADA: No se puede entregar EPP
                  </p>
                  <button
                    onClick={() => {
                      setScannedResult(null)
                      startCamera()
                    }}
                    className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-600"
                  >
                    Escanear Otro Colaborador
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-base font-black text-white">¡Fotocheck Identificado!</h4>
                  <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    {scannedResult.code}
                  </p>
                  {scannedResult.worker ? (
                    <div className="mt-2.5 p-3 rounded-2xl bg-slate-800 border border-slate-700 text-left w-full max-w-xs space-y-1">
                      <p className="text-xs font-black text-white">
                        {scannedResult.worker.apellidos}, {scannedResult.worker.nombres}
                      </p>
                      <p className="text-[11px] text-cyan-300 font-medium">
                        {scannedResult.worker.cargo || 'Operario de Producción'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Área: <span className="text-slate-300 font-semibold">{scannedResult.worker.area}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2">Cargando datos del colaborador...</p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Mensaje de Error si la Cámara no Inicia */}
          {cameraError && (
            <div className="p-6 text-center space-y-3 bg-slate-950/90">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">No se pudo activar la cámara</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{cameraError}</p>
              </div>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw size={14} /> Reintentar Conexión
              </button>
            </div>
          )}

          {/* Barra Flotante de Control de Cámara */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
            {hasTorch && (
              <button
                onClick={toggleTorch}
                title="Activar / Desactivar Linterna"
                className={`p-2 rounded-xl text-xs font-bold transition ${
                  torchOn ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {torchOn ? <Zap size={15} /> : <ZapOff size={15} />}
              </button>
            )}
            <button
              onClick={toggleFacingMode}
              title="Cambiar Cámara Frontal / Trasera"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title="Sonido de escaneo"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          </div>
        </div>

        {/* Coincidencias Rápidas / Presets de Trabajadores Oficiales */}
        {presets.length > 0 && (
          <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 max-h-40 overflow-y-auto">
            <p className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={12} className="text-cyan-400" /> Coincidencias Rápidas DALUPEZMAR:
            </p>
            <div className="space-y-1">
              {presets.map(p => (
                <button
                  key={p.code}
                  onClick={() => handleSelectPreset(p.code)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/60 flex items-center justify-between text-left transition group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-cyan-400 group-hover:text-cyan-300">
                      {p.code}
                    </span>
                    <span className="text-xs text-slate-200 font-medium truncate max-w-[200px]">
                      {p.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-300">
                    {p.desc || 'Producción'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Manual de Emergencia */}
        <form onSubmit={handleSubmitManual} className="p-3.5 bg-slate-800/60 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder={
                mode === 'trabajador'
                  ? 'Ingresar DNI o Código DAL-XXXX...'
                  : 'Ingresar código SKU...'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/90 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-md shadow-cyan-600/20 active:scale-95"
          >
            Buscar
          </button>
        </form>
      </div>
    </div>
  )
}
