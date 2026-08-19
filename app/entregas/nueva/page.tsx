'use client'

import React, { useEffect, useRef, useState, useTransition, Suspense } from 'react'
import {
  PackagePlus,
  User,
  Package,
  PenLine,
  ChevronRight,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw,
  Scan,
  Sparkles,
  Download,
  FolderArchive,
  ArrowLeft,
  Plus,
  Minus,
  ShieldCheck,
  Check,
  Search,
  Users,
  X,
  Save,
} from 'lucide-react'
import type { Trabajador, ArticuloEPP, Entrega } from '@/lib/types'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import SignaturePadModal from '@/components/ui/SignaturePadModal'
import ScannerSimulatorModal from '@/components/ui/ScannerSimulatorModal'
import { generarActaEntregaPDF } from '@/lib/generatePDF'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const AREAS = [
  'Producción',
  'Operaciones',
  'SSOMA',
  'Mantenimiento',
  'Logística',
  'Electricidad',
  'Administración',
  'RRHH',
]
const TALLAS_ROPA = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40']
const TALLAS_CALZADO = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']

type Step = 1 | 2 | 3 | 4

interface ItemSeleccionado {
  articulo: ArticuloEPP
  cantidad: number
}

function NuevaEntregaContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [step, setStep] = useState<Step>(1)
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [articulos, setArticulos] = useState<ArticuloEPP[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Step 1: Worker
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState<Trabajador | null>(null)
  const [busquedaTrabajador, setBusquedaTrabajador] = useState(initialSearch)
  const [showScannerTrabajador, setShowScannerTrabajador] = useState(false)
  const [showNuevoTrabajadorModal, setShowNuevoTrabajadorModal] = useState(false)
  const [guardandoTrabajador, setGuardandoTrabajador] = useState(false)
  const [errorNuevoTrabajador, setErrorNuevoTrabajador] = useState('')
  const [nuevoTrabajadorForm, setNuevoTrabajadorForm] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    area: 'Producción',
    fechaIngreso: new Date().toISOString().split('T')[0],
    tallaPantalon: '',
    tallaCamisa: '',
    tallaCalzado: '',
  })

  const guardarNuevoTrabajador = async () => {
    if (
      !nuevoTrabajadorForm.dni ||
      !nuevoTrabajadorForm.nombres ||
      !nuevoTrabajadorForm.apellidos ||
      !nuevoTrabajadorForm.cargo
    ) {
      setErrorNuevoTrabajador('Complete los campos obligatorios (*)')
      return
    }
    setGuardandoTrabajador(true)
    setErrorNuevoTrabajador('')
    try {
      const res = await fetch('/api/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoTrabajadorForm,
          fechaIngreso: new Date(nuevoTrabajadorForm.fechaIngreso).toISOString(),
          tallaPantalon: nuevoTrabajadorForm.tallaPantalon || null,
          tallaCamisa: nuevoTrabajadorForm.tallaCamisa || null,
          tallaCalzado: nuevoTrabajadorForm.tallaCalzado || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setErrorNuevoTrabajador(d.error || 'Error al registrar colaborador')
        return
      }
      const nuevo: Trabajador = await res.json()
      setTrabajadores(prev => [nuevo, ...prev])
      setTrabajadorSeleccionado(nuevo)
      setShowNuevoTrabajadorModal(false)
      setStep(2)
    } catch (e: any) {
      setErrorNuevoTrabajador(e.message || 'Error de conexión')
    } finally {
      setGuardandoTrabajador(false)
    }
  }

  // Step 2: Items
  const [items, setItems] = useState<ItemSeleccionado[]>([])
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busquedaArticulo, setBusquedaArticulo] = useState('')
  const [showScannerArticulo, setShowScannerArticulo] = useState(false)

  // Step 3: Signature & Details
  const [observaciones, setObservaciones] = useState('')
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Step 4: Completed
  const [entregaCompletada, setEntregaCompletada] = useState<Entrega | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/trabajadores?estado=activo').then(r => r.json()),
      fetch('/api/articulos?activos=true').then(r => r.json()),
    ])
      .then(([t, a]) => {
        setTrabajadores(t)
        setArticulos(a)
        if (initialSearch && Array.isArray(t)) {
          const match = t.find(
            (w: Trabajador) =>
              w.dni.includes(initialSearch) ||
              (w.codigoFotocheck && w.codigoFotocheck.toLowerCase() === initialSearch.toLowerCase()) ||
              `${w.apellidos} ${w.nombres}`.toLowerCase().includes(initialSearch.toLowerCase())
          )
          if (match) {
            setTrabajadorSeleccionado(match)
            setStep(2)
          }
        }
      })
      .finally(() => setLoadingInitial(false))
  }, [initialSearch])

  // Cargar pack semestral oficial DALUPEZMAR
  const cargarPackSemestral = () => {
    const itemsConfig = [
      { codigo: 'EPP-014', cantidad: 1 },
      { codigo: 'UNI-003', cantidad: 3 },
      { codigo: 'UNI-002', cantidad: 3 },
      { codigo: 'UNI-004', cantidad: 3 },
      { codigo: 'EPP-002', cantidad: 3 },
    ]

    const itemsPack: ItemSeleccionado[] = []
    for (const conf of itemsConfig) {
      const art = articulos.find(a => a.codigo === conf.codigo)
      if (art) {
        itemsPack.push({ articulo: art, cantidad: conf.cantidad })
      }
    }

    if (itemsPack.length > 0) {
      setItems(itemsPack)
    }
  }

  const agregarArticulo = (art: ArticuloEPP) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.articulo.id === art.id)
      if (idx >= 0) {
        const actual = prev[idx]
        const nuevaCant = Math.min(actual.cantidad + 1, art.stockActual)
        const copia = [...prev]
        copia[idx] = { ...actual, cantidad: nuevaCant }
        return copia
      } else {
        return [...prev, { articulo: art, cantidad: 1 }]
      }
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

  const handleFinalizarEntrega = async () => {
    if (!trabajadorSeleccionado) {
      setError('Seleccione un trabajador')
      return
    }
    if (items.length === 0) {
      setError('Agregue al menos un artículo a la entrega')
      return
    }

    setGuardando(true)
    setError('')

    try {
      const body = {
        trabajadorId: trabajadorSeleccionado.id,
        firmaDigitalUrl: firmaBase64,
        observaciones: observaciones || null,
        detalles: items.map(i => ({
          articuloId: i.articulo.id,
          cantidad: i.cantidad,
        })),
      }

      const res = await fetch('/api/entregas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al registrar la entrega')
      }

      const nuevaEntrega: Entrega = await res.json()
      setEntregaCompletada(nuevaEntrega)
      setStep(4)

      // Descargar automáticamente el PDF oficial
      try {
        generarActaEntregaPDF(nuevaEntrega)
      } catch (pdfErr) {
        console.warn('PDF auto-download warning:', pdfErr)
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la entrega.')
    } finally {
      setGuardando(false)
    }
  }

  const reiniciarFormulario = () => {
    setStep(1)
    setTrabajadorSeleccionado(null)
    setItems([])
    setFirmaBase64(null)
    setObservaciones('')
    setEntregaCompletada(null)
    setError('')
  }

  const trabajadoresFiltrados = trabajadores.filter(t => {
    const query = busquedaTrabajador.toLowerCase()
    return (
      t.dni.includes(query) ||
      (t.codigoFotocheck && t.codigoFotocheck.toLowerCase().includes(query)) ||
      t.nombres.toLowerCase().includes(query) ||
      t.apellidos.toLowerCase().includes(query) ||
      t.area.toLowerCase().includes(query)
    )
  })

  const articulosFiltrados = articulos.filter(a => {
    const coincideCat = filtroCategoria ? a.categoria === filtroCategoria : true
    const coincideQuery = busquedaArticulo
      ? a.nombre.toLowerCase().includes(busquedaArticulo.toLowerCase()) ||
        a.codigo.toLowerCase().includes(busquedaArticulo.toLowerCase())
      : true
    return coincideCat && coincideQuery
  })

  const totalCosto = items.reduce((s, i) => s + i.articulo.costoUnitario * i.cantidad, 0)
  const totalCantidad = items.reduce((s, i) => s + i.cantidad, 0)

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header y Pasos de Progreso */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <PackagePlus className="w-6 h-6 text-blue-400" />
            Registro de Entrega de EPP y Uniformes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Flujo táctil optimizado para emisión inmediata y constancia legal (Ley N° 29783)
          </p>
        </div>

        {step < 4 && (
          <div className="flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setStep(1)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                step === 1 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Colaborador
            </button>
            <ChevronRight size={12} className="text-slate-600 shrink-0" />
            <button
              onClick={() => trabajadorSeleccionado && setStep(2)}
              disabled={!trabajadorSeleccionado}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap disabled:opacity-40 ${
                step === 2 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Artículos ({items.length})
            </button>
            <ChevronRight size={12} className="text-slate-600 shrink-0" />
            <button
              onClick={() => items.length > 0 && setStep(3)}
              disabled={items.length === 0}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap disabled:opacity-40 ${
                step === 3 ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Firma Táctil
            </button>
          </div>
        )}
      </div>

      {/* Errores Globales */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── PASO 1: SELECCIÓN DE TRABAJADOR ──────────────────────────────────── */}
      {step === 1 && (
        <div className="card p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Paso 1: Seleccionar Colaborador
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setNuevoTrabajadorForm({
                    dni: /^\d+$/.test(busquedaTrabajador) ? busquedaTrabajador : '',
                    nombres: '',
                    apellidos: '',
                    cargo: '',
                    area: 'Producción',
                    fechaIngreso: new Date().toISOString().split('T')[0],
                    tallaPantalon: '',
                    tallaCamisa: '',
                    tallaCalzado: '',
                  })
                  setErrorNuevoTrabajador('')
                  setShowNuevoTrabajadorModal(true)
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Plus size={14} className="text-white" /> Registrar Nuevo Colaborador
              </button>
              <button
                onClick={() => setShowScannerTrabajador(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Scan size={14} className="text-white" /> Escanear DNI
              </button>
            </div>
          </div>

          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por DNI, apellido, nombre o área..."
              value={busquedaTrabajador}
              onChange={e => setBusquedaTrabajador(e.target.value)}
              className="input-field input-with-icon text-sm"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {trabajadoresFiltrados.length === 0 ? (
              <div className="col-span-full p-6 text-center bg-blue-50/50 dark:bg-slate-800/40 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-3">
                <Users className="w-10 h-10 text-blue-600 dark:text-blue-400 mx-auto" />
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white">
                    {busquedaTrabajador ? `No se encontró "${busquedaTrabajador}"` : 'No hay colaboradores registrados'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Puedes registrarlo en el sistema inmediatamente para continuar con la entrega.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNuevoTrabajadorForm({
                      dni: /^\d+$/.test(busquedaTrabajador) ? busquedaTrabajador : '',
                      nombres: '',
                      apellidos: '',
                      cargo: '',
                      area: 'Producción',
                      fechaIngreso: new Date().toISOString().split('T')[0],
                      tallaPantalon: '',
                      tallaCamisa: '',
                      tallaCalzado: '',
                    })
                    setErrorNuevoTrabajador('')
                    setShowNuevoTrabajadorModal(true)
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  <Plus size={15} /> Registrar Nuevo Colaborador Ahora
                </button>
              </div>
            ) : (
              trabajadoresFiltrados.map(t => {
                const isSelected = trabajadorSeleccionado?.id === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (t.estado === 'inactivo') {
                        alert(`⛔ TRABAJADOR INACTIVO / DADO DE BAJA (${t.apellidos}, ${t.nombres} - DNI: ${t.dni}).\n\nNo se puede registrar entregas de EPP a colaboradores cesados o inactivos.`)
                        return
                      }
                      setTrabajadorSeleccionado(t)
                      setStep(2)
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-black text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {t.dni}
                          </span>
                          {t.codigoFotocheck && (
                            <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              📷 {t.codigoFotocheck}
                            </span>
                          )}
                        </div>
                        <span className="badge-area text-[10px]">{t.area}</span>
                      </div>
                      <p className="font-black text-sm text-slate-950 dark:text-white mt-2">
                        {t.apellidos}, {t.nombres}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{t.cargo}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                        Tallas: {t.tallaPantalon || '-'} / {t.tallaCamisa || '-'} /{' '}
                        {t.tallaCalzado || '-'}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
                        Seleccionar <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── PASO 2: SELECCIÓN DE ARTÍCULOS ──────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Tarjeta de Trabajador Seleccionado */}
          <div className="card p-4 bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                {trabajadorSeleccionado?.nombres.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">
                  {trabajadorSeleccionado?.apellidos}, {trabajadorSeleccionado?.nombres}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  DNI: {trabajadorSeleccionado?.dni} • {trabajadorSeleccionado?.area} (
                  {trabajadorSeleccionado?.cargo})
                </p>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-blue-700 dark:text-cyan-400 hover:underline font-bold"
            >
              Cambiar Colaborador
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Columna Izquierda: Catálogo con Filtros y Carga Rápida */}
            <div className="lg:col-span-2 card p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Catálogo de EPPs Disponibles
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cargarPackSemestral}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    title="Carga automática de 1 par de botas, 3 pantalones, 3 suéteres, 3 medias y 3 tocas"
                  >
                    <Sparkles size={13} className="text-white" /> Pack Semestral DALUPEZMAR
                  </button>
                  <button
                    onClick={() => setShowScannerArticulo(true)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm"
                    title="Escanear SKU"
                  >
                    <Scan size={15} />
                  </button>
                </div>
              </div>

              {/* Filtro y Búsqueda */}
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

              {/* Grid de Artículos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {articulosFiltrados.map(art => {
                  const yaEnCarrito = items.find(i => i.articulo.id === art.id)
                  const sinStock = art.stockActual <= 0

                  return (
                    <div
                      key={art.id}
                      className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                        yaEnCarrito
                          ? 'bg-blue-950/40 border-blue-600/50'
                          : sinStock
                          ? 'bg-slate-900/50 border-slate-800 opacity-60'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-cyan-400">{art.codigo}</span>
                          <span
                            className={`font-semibold ${
                              sinStock ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
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
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Plus size={13} /> {yaEnCarrito ? 'Añadir +' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Columna Derecha: Canasta de Entrega */}
            <div className="card p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Prendas a Entregar</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300">
                    {items.length} ítems
                  </span>
                </h3>

                {items.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <Package className="w-8 h-8 opacity-30" />
                    <span>Seleccione prendas del catálogo o cargue el Pack Semestral</span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                    {items.map(item => (
                      <div
                        key={item.articulo.id}
                        className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {item.articulo.nombre}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {item.articulo.codigo} • S/ {item.articulo.costoUnitario.toFixed(2)} c/u
                          </p>
                        </div>

                        {/* Stepper + / - */}
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

              {/* Totales y Continuar */}
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
                  onClick={() => setStep(3)}
                  disabled={items.length === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition transform active:scale-95"
                >
                  Continuar a Firma Táctil <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 3: FIRMA TÁCTIL Y CONFIRMACIÓN ───────────────────────────────── */}
      {step === 3 && (
        <div className="card p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PenLine className="w-5 h-5 text-blue-400" />
              Paso 3: Captura de Firma Digital del Colaborador
            </h2>
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft size={13} /> Volver a Artículos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumen de la entrega */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Datos del Acta
              </p>
              <div className="text-xs space-y-1.5 text-slate-300">
                <p>
                  <strong>Colaborador:</strong> {trabajadorSeleccionado?.apellidos},{' '}
                  {trabajadorSeleccionado?.nombres}
                </p>
                <p>
                  <strong>DNI:</strong> {trabajadorSeleccionado?.dni}
                </p>
                <p>
                  <strong>Área / Puesto:</strong> {trabajadorSeleccionado?.area} (
                  {trabajadorSeleccionado?.cargo})
                </p>
                <p>
                  <strong>Total Prendas:</strong> {totalCantidad} unidades ({items.length} tipos)
                </p>
                <p>
                  <strong>Valorización:</strong> S/ {totalCosto.toFixed(2)}
                </p>
              </div>

              {/* Observaciones */}
              <div className="pt-2 border-t border-slate-700/50">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Observaciones de Campo (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Entrega periódica por desgaste..."
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>

            {/* Panel de Firma */}
            <div className="flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Firma de Conformidad (Ley N° 29783 SSOMA)
                </label>

                {firmaBase64 ? (
                  <div className="relative border-2 border-emerald-500/60 rounded-xl p-3 bg-white flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={firmaBase64} alt="Firma" className="max-h-28 object-contain" />
                    <span className="text-[10px] font-semibold text-emerald-800 mt-1">
                      ✓ Firma estampada y validada
                    </span>
                    <button
                      onClick={() => setFirmaBase64(null)}
                      className="absolute top-2 right-2 text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Borrar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(true)}
                    className="w-full py-8 border-2 border-dashed border-blue-500/50 hover:border-blue-400 rounded-xl bg-blue-950/20 flex flex-col items-center justify-center gap-2 text-blue-300 hover:text-white transition group"
                  >
                    <PenLine className="w-8 h-8 group-hover:scale-110 transition text-blue-400" />
                    <span className="text-xs font-bold">Abrir Pad de Firma Táctil Full-Screen</span>
                    <span className="text-[10px] text-slate-400">
                      Toque para firmar con el dedo o stylus
                    </span>
                  </button>
                )}
              </div>

              {/* Botón de Emisión Final */}
              <button
                onClick={handleFinalizarEntrega}
                disabled={guardando || !firmaBase64}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition transform active:scale-95"
              >
                {guardando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Generando Constancia Legal y
                    Archivando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} /> Emitir Acta Oficial y Generar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 4: ENTREGA COMPLETADA Y VISOR DE ACTA ───────────────────────── */}
      {step === 4 && entregaCompletada && (
        <div className="card p-6 sm:p-8 text-center space-y-6 border-emerald-500/50 bg-gradient-to-b from-slate-900 via-emerald-950/10 to-slate-900">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              ¡Entrega Registrada Exitosamente!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Se ha emitido la constancia oficial de entrega con firma digital y se ha descontado el
              stock del almacén central.
            </p>
          </div>

          {/* Caja de Información Estructurada del Archivo */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 max-w-lg mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <span className="font-bold text-white">Folio del Acta:</span>
              <span className="font-mono font-bold text-cyan-400">
                ENT-{String(entregaCompletada.id).padStart(5, '0')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Colaborador:</span>
              <span className="font-semibold text-slate-200">
                {entregaCompletada.trabajador.apellidos}, {entregaCompletada.trabajador.nombres}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">DNI:</span>
              <span className="text-slate-300">{entregaCompletada.trabajador.dni}</span>
            </div>
            <div className="pt-2 border-t border-slate-700 flex items-start gap-2 text-slate-300">
              <FolderArchive size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px] text-emerald-300">
                  Ruta de Almacenamiento Estructurado:
                </p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5 break-all">
                  {entregaCompletada.rutaPdf ||
                    `/constancias/${entregaCompletada.trabajador.dni}_${entregaCompletada.trabajador.apellidos.replace(
                      /\s/g,
                      '_'
                    )}/${format(new Date(entregaCompletada.fechaEntrega), 'yyyy-MM-dd')}_Acta_ENT-${String(
                      entregaCompletada.id
                    ).padStart(5, '0')}.pdf`}
                </p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => generarActaEntregaPDF(entregaCompletada)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <Download size={15} /> Descargar PDF Nuevamente
            </button>

            <Link
              href="/constancias"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <FolderArchive size={15} /> Explorar Árbol de Constancias
            </Link>

            <button
              onClick={reiniciarFormulario}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition"
            >
              <Plus size={15} /> Registrar Otra Entrega
            </button>
          </div>
        </div>
      )}

      {/* Modales de Firma y Escáner */}
      <SignaturePadModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={sig => setFirmaBase64(sig)}
        workerName={
          trabajadorSeleccionado
            ? `${trabajadorSeleccionado.apellidos}, ${trabajadorSeleccionado.nombres}`
            : ''
        }
        workerDni={trabajadorSeleccionado?.dni || ''}
      />

      <ScannerSimulatorModal
        isOpen={showScannerTrabajador}
        onClose={() => setShowScannerTrabajador(false)}
        onScan={code => {
          setBusquedaTrabajador(code)
          const normalizedCode = code.trim().toUpperCase()
          const match = trabajadores.find(
            t =>
              t.dni === code ||
              (t.codigoFotocheck && t.codigoFotocheck.toUpperCase() === normalizedCode) ||
              `${t.apellidos} ${t.nombres}`.toLowerCase().includes(code.toLowerCase())
          )
          if (match) {
            if (match.estado === 'inactivo') {
              alert(`⛔ TRABAJADOR INACTIVO / DADO DE BAJA (${match.apellidos}, ${match.nombres} - DNI: ${match.dni}).\n\nNo se puede asignar ni entregar EPP a un colaborador cesado o inactivo.`)
              return
            }
            setTrabajadorSeleccionado(match)
            setStep(2)
          }
        }}
        mode="trabajador"
        workersList={trabajadores}
        presets={[
          { code: 'DAL-1012', label: 'Cahuaza Muena, Dempster', desc: 'DNI: 63401773 • Troquelado' },
          { code: '63401773', label: 'DNI Dempster Cahuaza (Barras)', desc: 'Troquelado de Anillas' },
          { code: 'DAL-1001', label: 'Acevedo Mendoza, Carlos Eduardo', desc: 'DNI: 005704276 • Supervisor' },
          { code: 'DAL-1002', label: 'Agüero Paredes, Lucia Juana', desc: 'DNI: 20569691 • Producción' },
        ]}
      />

      <ScannerSimulatorModal
        isOpen={showScannerArticulo}
        onClose={() => setShowScannerArticulo(false)}
        onScan={code => {
          setBusquedaArticulo(code)
          const match = articulos.find(
            a => a.codigo.toUpperCase() === code.toUpperCase() || a.nombre.toLowerCase().includes(code.toLowerCase())
          )
          if (match) {
            agregarArticulo(match)
          }
        }}
        mode="articulo"
        presets={[
          { code: 'EPP-001', label: 'Casco de Seguridad Dielectrico', desc: 'Cabeza' },
          { code: 'EPP-002', label: 'Lentes de Seguridad Anti-empañante', desc: 'Ocular' },
          { code: 'EPP-014', label: 'Zapato de Seguridad Punta Acero', desc: 'Calzado' },
          { code: 'UNI-002', label: 'Polo Manga Larga Algodón', desc: 'Uniforme' },
        ]}
      />

      {/* Modal de Registro Rápido de Nuevo Colaborador */}
      {showNuevoTrabajadorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
          onClick={e => {
            if (e.target === e.currentTarget) setShowNuevoTrabajadorModal(false)
          }}
        >
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Registrar Nuevo Colaborador para Entrega
              </h2>
              <button
                onClick={() => setShowNuevoTrabajadorModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {errorNuevoTrabajador && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold">
                {errorNuevoTrabajador}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="label">DNI / Documento *</label>
                <input
                  className="input-field"
                  value={nuevoTrabajadorForm.dni}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, dni: e.target.value }))}
                  maxLength={12}
                  placeholder="Ej. 61376102"
                />
              </div>
              <div>
                <label className="label">Área de Trabajo *</label>
                <select
                  className="input-field"
                  value={nuevoTrabajadorForm.area}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, area: e.target.value }))}
                >
                  {AREAS.map(a => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Nombres Completos *</label>
                <input
                  className="input-field"
                  value={nuevoTrabajadorForm.nombres}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, nombres: e.target.value }))}
                  placeholder="Ej. Lourdes Rosa"
                />
              </div>
              <div>
                <label className="label">Apellidos Completos *</label>
                <input
                  className="input-field"
                  value={nuevoTrabajadorForm.apellidos}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, apellidos: e.target.value }))}
                  placeholder="Ej. Manrique Romani"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Cargo / Puesto Operativo *</label>
                <input
                  className="input-field"
                  value={nuevoTrabajadorForm.cargo}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ej. Operario de Producción"
                />
              </div>

              <div>
                <label className="label">Talla Pantalón</label>
                <select
                  className="input-field"
                  value={nuevoTrabajadorForm.tallaPantalon}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, tallaPantalon: e.target.value }))}
                >
                  <option value="">Seleccione talla...</option>
                  {TALLAS_ROPA.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Talla Camisa / Polo</label>
                <select
                  className="input-field"
                  value={nuevoTrabajadorForm.tallaCamisa}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, tallaCamisa: e.target.value }))}
                >
                  <option value="">Seleccione talla...</option>
                  {TALLAS_ROPA.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Talla Calzado (Botas)</label>
                <select
                  className="input-field"
                  value={nuevoTrabajadorForm.tallaCalzado}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, tallaCalzado: e.target.value }))}
                >
                  <option value="">Seleccione talla...</option>
                  {TALLAS_CALZADO.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Fecha de Ingreso</label>
                <input
                  type="date"
                  className="input-field"
                  value={nuevoTrabajadorForm.fechaIngreso}
                  onChange={e => setNuevoTrabajadorForm(f => ({ ...f, fechaIngreso: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowNuevoTrabajadorModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={guardarNuevoTrabajador}
                disabled={guardandoTrabajador}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
              >
                <Save size={14} /> {guardandoTrabajador ? 'Guardando...' : 'Guardar y Continuar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NuevaEntregaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span>Cargando módulo de entrega rápida...</span>
        </div>
      }
    >
      <NuevaEntregaContent />
    </Suspense>
  )
}

