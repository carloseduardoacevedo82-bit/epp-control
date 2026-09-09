'use client'

import React, { useEffect, useState, Suspense } from 'react'
import {
  PackagePlus,
  Package,
  PenLine,
  ChevronRight,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  FolderArchive,
  ArrowLeft,
  Plus,
  Minus,
  ShieldCheck,
  Search,
  X,
  Edit3,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import type { ArticuloEPP, Entrega } from '@/lib/types'
import { SUPERVISORES_OFICIALES } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import SignaturePadModal from '@/components/ui/SignaturePadModal'
import { generarActaEntregaPDF } from '@/lib/generatePDF'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

type Step = 1 | 2 | 3

interface ItemSeleccionado {
  articulo: ArticuloEPP
  cantidad: number
}

function EditarEntregaContent() {
  const params = useParams()
  const router = useRouter()
  const entregaId = Number(params.id)

  const [step, setStep] = useState<Step>(1)
  const [entregaOriginal, setEntregaOriginal] = useState<Entrega | null>(null)
  const [articulos, setArticulos] = useState<ArticuloEPP[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Step 1: Artículos
  const [items, setItems] = useState<ItemSeleccionado[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busquedaArticulo, setBusquedaArticulo] = useState('')

  // Step 2: Firma y datos
  const [fechaEntregaForm, setFechaEntregaForm] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Firma del trabajador
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [mantenerFirmaTrabajador, setMantenerFirmaTrabajador] = useState(true)

  // Firma del supervisor
  const [supervisorSeleccionadoId, setSupervisorSeleccionadoId] = useState<string>('daiam_rustasehenko')
  const [supervisorNombrePersonalizado, setSupervisorNombrePersonalizado] = useState('')
  const [supervisorCargoPersonalizado, setSupervisorCargoPersonalizado] = useState('')
  const [firmaSupervisorBase64, setFirmaSupervisorBase64] = useState<string | null>(null)
  const [showSignatureModalSupervisor, setShowSignatureModalSupervisor] = useState(false)
  const [mantenerFirmaSupervisor, setMantenerFirmaSupervisor] = useState(true)
  const [recordarFirmaSupervisor, setRecordarFirmaSupervisor] = useState(true)

  // Step 3: Resultado
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [entregaActualizada, setEntregaActualizada] = useState<Entrega | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    if (!entregaId || isNaN(entregaId)) {
      setLoadError('ID de entrega inválido')
      setLoadingInitial(false)
      return
    }

    Promise.all([
      fetch(`/api/entregas/${entregaId}`).then(r => {
        if (!r.ok) throw new Error('Entrega no encontrada')
        return r.json()
      }),
      fetch('/api/articulos?activos=true').then(r => r.json()),
    ])
      .then(([entrega, arts]: [Entrega, ArticuloEPP[]]) => {
        setEntregaOriginal(entrega)
        setArticulos(arts)

        // Pre-cargar artículos actuales
        // Para cada detalle de la entrega, buscamos el artículo completo y ajustamos el stock
        // (lo que se tenía en entrega no cuenta como "disponible" extra, lo tomamos tal cual)
        const itemsPreCargados: ItemSeleccionado[] = entrega.detalles.map(det => {
          // Buscar el artículo en la lista actual (puede tener stock diferente por otros movimientos)
          const artActual = arts.find(a => a.id === det.articuloId)
          if (artActual) {
            // El stock visible en el catálogo NO incluye lo que ya tiene esta entrega
            // Para que el usuario no vea "0 stock" cuando el artículo vuelve al pool,
            // ajustamos el stock visualmente sumando la cantidad actual
            return {
              articulo: { ...artActual, stockActual: artActual.stockActual + det.cantidad },
              cantidad: det.cantidad,
            }
          }
          // Fallback: usar datos del detalle
          return {
            articulo: {
              id: det.articuloId,
              codigo: det.articulo?.codigo ?? `ART-${det.articuloId}`,
              nombre: det.articulo?.nombre ?? `Artículo #${det.articuloId}`,
              categoria: det.articulo?.categoria ?? 'Sin categoría',
              costoUnitario: det.costoUnitarioMomento,
              vidaUtilDias: 180,
              stockActual: det.cantidad,
              stockMinimo: 1,
              activo: true,
              createdAt: '',
              updatedAt: '',
            },
            cantidad: det.cantidad,
          }
        })

        setItems(itemsPreCargados)
        setFechaEntregaForm(
          entrega.fechaEntrega ? entrega.fechaEntrega.split('T')[0] : new Date().toISOString().split('T')[0]
        )
        setObservaciones(entrega.observaciones ?? '')

        // Pre-cargar firmas existentes
        if (entrega.firmaDigitalUrl) {
          setFirmaBase64(entrega.firmaDigitalUrl)
          setMantenerFirmaTrabajador(true)
        }
        if (entrega.firmaSupervisorUrl) {
          setFirmaSupervisorBase64(entrega.firmaSupervisorUrl)
          setMantenerFirmaSupervisor(true)
          // Intentar detectar el supervisor
          const supEncontrado = SUPERVISORES_OFICIALES.find(
            s => s.nombre === entrega.supervisorNombre
          )
          if (supEncontrado) {
            setSupervisorSeleccionadoId(supEncontrado.id)
          } else if (entrega.supervisorNombre) {
            setSupervisorSeleccionadoId('otro')
            setSupervisorNombrePersonalizado(entrega.supervisorNombre)
            setSupervisorCargoPersonalizado(entrega.supervisorCargo ?? '')
          }
        }
      })
      .catch(err => {
        setLoadError(err.message || 'Error al cargar la entrega')
      })
      .finally(() => setLoadingInitial(false))
  }, [entregaId])

  // Cargar firma guardada del supervisor al cambiar selección
  useEffect(() => {
    if (typeof window !== 'undefined' && !mantenerFirmaSupervisor) {
      const savedSig = localStorage.getItem(`epp_firma_sup_${supervisorSeleccionadoId}`)
      if (savedSig) setFirmaSupervisorBase64(savedSig)
      else setFirmaSupervisorBase64(null)
    }
  }, [supervisorSeleccionadoId, mantenerFirmaSupervisor])

  const getSupervisorActual = (): { nombre: string; cargo: string } => {
    if (supervisorSeleccionadoId === 'otro') {
      return {
        nombre: supervisorNombrePersonalizado.trim() || 'Supervisor Autorizado',
        cargo: supervisorCargoPersonalizado.trim() || 'Supervisor de Operaciones',
      }
    }
    const sup = SUPERVISORES_OFICIALES.find(s => s.id === supervisorSeleccionadoId)
    return sup
      ? { nombre: sup.nombre, cargo: sup.cargo }
      : { nombre: 'Daiam Lisette Rustasehenko Calero', cargo: 'Supervisora General' }
  }

  // Ajustar stock visible en catálogo (devolviendo lo de items actuales)
  const articulosConStockAjustado = articulos.map(a => {
    const itemActual = items.find(i => i.articulo.id === a.id)
    return itemActual
      ? { ...a, stockActual: a.stockActual + itemActual.cantidad }
      : a
  })

  const articulosFiltrados = articulosConStockAjustado.filter(a => {
    const coincideCat = filtroCategoria ? a.categoria === filtroCategoria : true
    const coincideQuery = busquedaArticulo
      ? a.nombre.toLowerCase().includes(busquedaArticulo.toLowerCase()) ||
        a.codigo.toLowerCase().includes(busquedaArticulo.toLowerCase())
      : true
    return coincideCat && coincideQuery
  })

  const agregarArticulo = (art: ArticuloEPP) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.articulo.id === art.id)
      if (idx >= 0) {
        const actual = prev[idx]
        const nuevaCant = Math.min(actual.cantidad + 1, art.stockActual)
        const copia = [...prev]
        copia[idx] = { ...actual, cantidad: nuevaCant }
        return copia
      }
      return [...prev, { articulo: art, cantidad: 1 }]
    })
  }

  const cambiarCantidad = (articuloId: number, delta: number) => {
    setItems(prev =>
      prev
        .map(i => {
          if (i.articulo.id === articuloId) {
            const nueva = i.cantidad + delta
            if (nueva <= 0) return null
            if (nueva > i.articulo.stockActual) return i
            return { ...i, cantidad: nueva }
          }
          return i
        })
        .filter(Boolean) as ItemSeleccionado[]
    )
  }

  const eliminarItem = (articuloId: number) => {
    setItems(prev => prev.filter(i => i.articulo.id !== articuloId))
  }

  const totalCosto = items.reduce((s, i) => s + i.articulo.costoUnitario * i.cantidad, 0)
  const totalCantidad = items.reduce((s, i) => s + i.cantidad, 0)

  const handleGuardarCambios = async () => {
    if (items.length === 0) {
      setError('Debe incluir al menos un artículo en la entrega')
      return
    }
    if (!firmaBase64) {
      setError('La firma del colaborador es requerida para guardar los cambios')
      return
    }

    setGuardando(true)
    setError('')

    try {
      const supActual = getSupervisorActual()

      // Construir el body de forma conservadora:
      // Si el usuario mantuvo la firma existente → enviamos la URL original (el backend la acepta como nueva)
      // Si no hay firma en absoluto → no enviamos el campo (el backend preserva el existente)
      const firmaColaboradorEnviar = firmaBase64 // ya validado arriba que no es null
      const firmaSupervisorEnviar = firmaSupervisorBase64 // puede ser null si no hay firma de supervisor

      const body: Record<string, unknown> = {
        detalles: items.map(i => ({ articuloId: i.articulo.id, cantidad: i.cantidad })),
        // Firma del colaborador: siempre enviamos porque el botón de guardar exige que exista
        firmaDigitalUrl: firmaColaboradorEnviar,
        // Firma del supervisor: solo enviamos si hay firma real;
        // si es null y el usuario NO la borró explícitamente → no la enviamos (el backend la preserva)
        ...(firmaSupervisorEnviar
          ? {
              firmaSupervisorUrl: firmaSupervisorEnviar,
              supervisorNombre: supActual.nombre,
              supervisorCargo: supActual.cargo,
            }
          : mantenerFirmaSupervisor
          ? {} // checkbox "mantener" activo y sin nueva firma → no enviar campo (backend preserva)
          : { clearFirmaSupervisor: true }), // usuario desmarcó "mantener" y no tiene nueva firma → borrar
        observaciones: observaciones || null,
        fechaEntrega: fechaEntregaForm
          ? new Date(`${fechaEntregaForm}T12:00:00`).toISOString()
          : undefined,
      }

      const res = await fetch(`/api/entregas/${entregaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar los cambios')
      }

      const entregaActual: Entrega = await res.json()
      setEntregaActualizada(entregaActual)
      setStep(3)

      // Descargar PDF actualizado automáticamente
      try {
        generarActaEntregaPDF(entregaActual)
      } catch (pdfErr) {
        console.warn('PDF warning:', pdfErr)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la edición')
    } finally {
      setGuardando(false)
    }
  }

  // === ESTADOS DE CARGA Y ERROR ===
  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-slate-400 text-sm">Cargando entrega #{entregaId}...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-300 font-bold">{loadError}</p>
        <Link
          href="/"
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm hover:bg-slate-700 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Volver al Dashboard
        </Link>
      </div>
    )
  }

  const trabajador = entregaOriginal?.trabajador

  // === RENDER ===
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft size={13} /> Dashboard
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-amber-400" />
            Editar Entrega de EPP
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Modificando acta{' '}
            <span className="font-mono font-bold text-amber-300">
              ENT-{String(entregaId).padStart(5, '0')}
            </span>{' '}
            —{' '}
            {trabajador
              ? `${trabajador.apellidos}, ${trabajador.nombres}`
              : ''}
          </p>
        </div>

        {/* Steps */}
        {step < 3 && (
          <div className="flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setStep(1)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                step === 1 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Artículos ({items.length})
            </button>
            <ChevronRight size={12} className="text-slate-600 shrink-0" />
            <button
              onClick={() => items.length > 0 && setStep(2)}
              disabled={items.length === 0}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap disabled:opacity-40 ${
                step === 2 ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Firmas
            </button>
          </div>
        )}
      </div>

      {/* Banner informativo */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-950/50 border border-amber-700/60 text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="text-xs">
          <span className="font-bold">Modo edición activo.</span> Los cambios en artículos
          ajustarán el stock automáticamente. La constancia PDF se regenerará al guardar.
          {entregaOriginal?.fechaEntrega && (
            <span className="ml-1 text-amber-300 font-mono">
              (Fecha original:{' '}
              {format(new Date(entregaOriginal.fechaEntrega), "dd/MM/yyyy", { locale: es })})
            </span>
          )}
        </div>
      </div>

      {/* Tarjeta del trabajador (siempre visible) */}
      {trabajador && (
        <div className="card p-4 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {trabajador.nombres.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-950 dark:text-white">
              {trabajador.apellidos}, {trabajador.nombres}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              DNI: {trabajador.dni} • {trabajador.area} ({trabajador.cargo})
            </p>
          </div>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-700/50 px-2 py-0.5 rounded-full shrink-0">
            Editando
          </span>
        </div>
      )}

      {/* Error global */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── PASO 1: ARTÍCULOS ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Catálogo */}
          <div className="lg:col-span-2 card p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" /> Catálogo de EPPs
              </h2>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar EPP por código o nombre..."
                  value={busquedaArticulo}
                  onChange={e => setBusquedaArticulo(e.target.value)}
                  className="input-field input-with-icon text-xs py-2"
                />
              </div>
              <select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                className="input-field w-auto text-xs py-2 font-bold"
              >
                <option value="">Todas las categorías</option>
                {[...new Set(articulos.map(a => a.categoria))].map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid de artículos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {articulosFiltrados.map(art => {
                const yaEnCarrito = items.find(i => i.articulo.id === art.id)
                const sinStock = art.stockActual <= 0

                return (
                  <div
                    key={art.id}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                      yaEnCarrito
                        ? 'bg-amber-950/40 border-amber-600/50'
                        : sinStock
                        ? 'bg-slate-900/50 border-slate-800 opacity-60'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-cyan-400">{art.codigo}</span>
                        <span className={`font-semibold ${sinStock ? 'text-red-400' : 'text-emerald-400'}`}>
                          Stock: {art.stockActual}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white mt-1 leading-snug">{art.nombre}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {art.categoria} • Talla: {art.talla || 'Estándar'}
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        S/ {art.costoUnitario.toFixed(2)}
                      </span>
                      <button
                        onClick={() => agregarArticulo(art)}
                        disabled={sinStock}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Plus size={13} /> {yaEnCarrito ? 'Añadir +' : 'Agregar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Canasta */}
          <div className="card p-5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>EPPs a Entregar</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-300">
                  {items.length} ítems
                </span>
              </h3>

              {items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Package className="w-8 h-8 opacity-30" />
                  <span>Seleccione artículos del catálogo</span>
                </div>
              ) : (
                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div
                      key={item.articulo.id}
                      className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.articulo.nombre}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.articulo.codigo} • S/ {item.articulo.costoUnitario.toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-700">
                        <button
                          onClick={() => cambiarCantidad(item.articulo.id, -1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold text-cyan-300 min-w-[18px] text-center">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(item.articulo.id, 1)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => eliminarItem(item.articulo.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Unidades:</span>
                <span className="font-bold text-white">{totalCantidad}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white">
                <span>Inversión Total:</span>
                <span className="text-emerald-400 font-mono">S/ {totalCosto.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={items.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95"
              >
                Continuar a Firmas <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 2: FIRMAS ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <PenLine className="w-5 h-5 text-amber-400" />
                Paso 2: Firmas Digitales
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Actualize las firmas del colaborador y/o supervisor para la nueva constancia
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Volver a Artículos
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Datos del acta */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Datos del Acta Actualizada
                </p>
                <div className="text-xs space-y-1.5 text-slate-300">
                  <p>
                    <strong>Colaborador:</strong> {trabajador?.apellidos}, {trabajador?.nombres}
                  </p>
                  <p>
                    <strong>DNI:</strong> {trabajador?.dni}
                  </p>
                  <p>
                    <strong>Total Prendas:</strong> {totalCantidad} unidades ({items.length} tipos)
                  </p>
                  <p>
                    <strong>Valorización:</strong>{' '}
                    <span className="font-mono text-emerald-400 font-bold">S/ {totalCosto.toFixed(2)}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-700/50 space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Fecha Oficial de Entrega:
                    </label>
                    <input
                      type="date"
                      value={fechaEntregaForm}
                      onChange={e => setFechaEntregaForm(e.target.value)}
                      className="input-field text-xs font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Observaciones (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Renovación periódica / Corrección de registro..."
                      value={observaciones}
                      onChange={e => setObservaciones(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Firma del trabajador */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5 text-blue-400" />
                    1. Firma del Colaborador *
                  </label>
                  {firmaBase64 && (
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-md font-semibold">
                      ✓ Firmado
                    </span>
                  )}
                </div>

                {/* Opción: mantener firma anterior */}
                {entregaOriginal?.firmaDigitalUrl && (
                  <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mantenerFirmaTrabajador}
                      onChange={e => {
                        setMantenerFirmaTrabajador(e.target.checked)
                        if (e.target.checked) {
                          setFirmaBase64(entregaOriginal.firmaDigitalUrl ?? null)
                        } else {
                          setFirmaBase64(null)
                        }
                      }}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Mantener firma anterior del colaborador</span>
                  </label>
                )}

                {firmaBase64 ? (
                  <div className="relative border-2 border-emerald-500/60 rounded-xl p-3 bg-white flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={firmaBase64} alt="Firma Colaborador" className="max-h-24 object-contain" />
                    <span className="text-[10px] font-semibold text-slate-700 mt-1">
                      {trabajador?.apellidos}, {trabajador?.nombres} (DNI: {trabajador?.dni})
                    </span>
                    <button
                      onClick={() => {
                        setFirmaBase64(null)
                        setMantenerFirmaTrabajador(false)
                      }}
                      className="absolute top-2 right-2 text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(true)}
                    className="w-full py-6 border-2 border-dashed border-blue-500/50 hover:border-blue-400 rounded-xl bg-blue-950/20 flex flex-col items-center justify-center gap-1.5 text-blue-300 hover:text-white transition group"
                  >
                    <PenLine className="w-7 h-7 group-hover:scale-110 transition text-blue-400" />
                    <span className="text-xs font-bold">Abrir Pad de Firma del Colaborador</span>
                    <span className="text-[10px] text-slate-400">Firma con dedo o stylus en pantalla</span>
                  </button>
                )}
              </div>
            </div>

            {/* Columna derecha: Supervisor + Botón guardar */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    2. Firma del Supervisor / Responsable
                  </label>
                  {firmaSupervisorBase64 && (
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-md font-semibold">
                      ✓ Firmado
                    </span>
                  )}
                </div>

                {/* Opción: mantener firma anterior del supervisor */}
                {entregaOriginal?.firmaSupervisorUrl && (
                  <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mantenerFirmaSupervisor}
                      onChange={e => {
                        setMantenerFirmaSupervisor(e.target.checked)
                        if (e.target.checked) {
                          setFirmaSupervisorBase64(entregaOriginal.firmaSupervisorUrl ?? null)
                        } else {
                          setFirmaSupervisorBase64(null)
                        }
                      }}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>
                      Mantener firma anterior del supervisor ({entregaOriginal.supervisorNombre || 'Supervisor'})
                    </span>
                  </label>
                )}

                {/* Selector de supervisor */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Seleccionar Supervisor:
                  </label>
                  <select
                    value={supervisorSeleccionadoId}
                    onChange={e => {
                      setSupervisorSeleccionadoId(e.target.value)
                      setMantenerFirmaSupervisor(false)
                    }}
                    className="input-field text-xs font-medium bg-slate-900 border-slate-700 text-white cursor-pointer"
                  >
                    {SUPERVISORES_OFICIALES.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} — {s.cargo}
                      </option>
                    ))}
                    <option value="otro">Otro Supervisor / Cargo Personalizado...</option>
                  </select>
                </div>

                {supervisorSeleccionadoId === 'otro' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Nombre:</label>
                      <input
                        type="text"
                        placeholder="Ej. Ing. Juan Pérez"
                        value={supervisorNombrePersonalizado}
                        onChange={e => setSupervisorNombrePersonalizado(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Cargo:</label>
                      <input
                        type="text"
                        placeholder="Ej. Supervisor de Planta"
                        value={supervisorCargoPersonalizado}
                        onChange={e => setSupervisorCargoPersonalizado(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>
                  </div>
                )}

                {firmaSupervisorBase64 ? (
                  <div className="relative border-2 border-emerald-500/60 rounded-xl p-3 bg-white flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={firmaSupervisorBase64} alt="Firma Supervisor" className="max-h-24 object-contain" />
                    <span className="text-[10px] font-semibold text-slate-800 mt-1">
                      {getSupervisorActual().nombre} • {getSupervisorActual().cargo}
                    </span>
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        onClick={() => setShowSignatureModalSupervisor(true)}
                        className="text-[10px] text-blue-700 font-bold hover:underline"
                      >
                        Cambiar
                      </button>
                      <button
                        onClick={() => {
                          setFirmaSupervisorBase64(null)
                          setMantenerFirmaSupervisor(false)
                        }}
                        className="text-[10px] text-red-600 font-bold hover:underline"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowSignatureModalSupervisor(true)}
                      className="w-full py-5 border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 rounded-xl bg-cyan-950/20 flex flex-col items-center justify-center gap-1.5 text-cyan-300 hover:text-white transition group"
                    >
                      <PenLine className="w-6 h-6 group-hover:scale-110 transition text-cyan-400" />
                      <span className="text-xs font-bold">
                        ✍️ Firmar como {getSupervisorActual().nombre}
                      </span>
                      <span className="text-[10px] text-slate-400">{getSupervisorActual().cargo}</span>
                    </button>
                    <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={recordarFirmaSupervisor}
                        onChange={e => setRecordarFirmaSupervisor(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Recordar firma del supervisor en este dispositivo</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Resumen y botón */}
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Firma Colaborador:</span>
                    <span className={firmaBase64 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}>
                      {firmaBase64 ? '✓ Listo' : '⚠ Requerida'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Firma Supervisor:</span>
                    <span className={firmaSupervisorBase64 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {firmaSupervisorBase64 ? `✓ ${getSupervisorActual().nombre.split(' ')[0]}` : 'Opcional'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGuardarCambios}
                  disabled={guardando || !firmaBase64}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95"
                >
                  {guardando ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Guardando cambios y regenerando PDF...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Guardar Cambios y Emitir Nueva Constancia
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 3: ÉXITO ─────────────────────────────────────────────────── */}
      {step === 3 && entregaActualizada && (
        <div className="card p-6 sm:p-8 text-center space-y-6 border-amber-500/40 bg-gradient-to-b from-slate-900 via-amber-950/10 to-slate-900">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20 ring-4 ring-amber-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">¡Entrega Actualizada Exitosamente!</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              La constancia ha sido regenerada con los nuevos artículos y firmas. El stock del
              almacén fue ajustado automáticamente.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 max-w-lg mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <span className="font-bold text-white">Folio del Acta:</span>
              <span className="font-mono font-bold text-amber-400">
                ENT-{String(entregaActualizada.id).padStart(5, '0')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Colaborador:</span>
              <span className="font-semibold text-slate-200">
                {entregaActualizada.trabajador.apellidos}, {entregaActualizada.trabajador.nombres}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DNI:</span>
              <span className="text-slate-300">{entregaActualizada.trabajador.dni}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Artículos:</span>
              <span className="text-slate-300">{entregaActualizada.detalles?.length} tipos / {totalCantidad} unidades</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Firma colaborador:</span>
              <span className={entregaActualizada.firmaDigitalUrl ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {entregaActualizada.firmaDigitalUrl ? '✓ Con firma' : 'Sin firma'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Firma supervisor:</span>
              <span className={entregaActualizada.firmaSupervisorUrl ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {entregaActualizada.firmaSupervisorUrl
                  ? `✓ ${entregaActualizada.supervisorNombre || 'Firmado'}`
                  : 'Sin firma'}
              </span>
            </div>
            {entregaActualizada.rutaPdf && (
              <div className="pt-2 border-t border-slate-700 flex items-start gap-2 text-slate-300">
                <FolderArchive size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="font-mono text-[10px] text-slate-400 break-all">{entregaActualizada.rutaPdf}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => generarActaEntregaPDF(entregaActualizada)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Download size={15} /> Descargar PDF Actualizado
            </button>

            <Link
              href="/constancias"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <FolderArchive size={15} /> Ver Constancias
            </Link>

            <button
              onClick={() => {
                setStep(1)
                setEntregaActualizada(null)
                setError('')
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <RotateCcw size={15} /> Editar Nuevamente
            </button>

            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition"
            >
              <ArrowLeft size={15} /> Volver al Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Modales de firma */}
      <SignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={sig => {
          setFirmaBase64(sig)
          setMantenerFirmaTrabajador(false)
        }}
        title="Firma Táctil de Conformidad del Colaborador"
        workerName={trabajador ? `${trabajador.apellidos}, ${trabajador.nombres}` : ''}
        workerDni={trabajador?.dni || ''}
      />

      <SignaturePadModal
        isOpen={showSignatureModalSupervisor}
        onClose={() => setShowSignatureModalSupervisor(false)}
        onConfirm={sig => {
          setFirmaSupervisorBase64(sig)
          setMantenerFirmaSupervisor(false)
          if (recordarFirmaSupervisor && typeof window !== 'undefined') {
            localStorage.setItem(`epp_firma_sup_${supervisorSeleccionadoId}`, sig)
          }
        }}
        title="Firma del Supervisor / Responsable de Entrega"
        workerName={getSupervisorActual().nombre}
        signerRole={`${getSupervisorActual().cargo} • DALUPEZMAR S.A.C.`}
      />
    </div>
  )
}

export default function EditarEntregaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      }
    >
      <EditarEntregaContent />
    </Suspense>
  )
}
