'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Filter,
  Layers,
  TrendingUp,
  Minus,
  RotateCcw,
} from 'lucide-react'
import type { ArticuloEPP } from '@/lib/types'
import { CATEGORIAS_EPP, TALLAS_CALZADO, TALLAS_ROPA, TALLAS_PANTALON } from '@/lib/types'
import { useRole } from '@/components/auth/RoleContext'
import BulkImportModal from '@/components/inventory/BulkImportModal'
import { descargarPlantillaInventario } from '@/lib/excelTemplate'

const emptyForm = {
  codigo: '',
  nombre: '',
  categoria: CATEGORIAS_EPP[0] as string,
  talla: '',
  costoUnitario: '',
  vidaUtilDias: '365',
  stockActual: '0',
  stockMinimo: '5',
  marcaFabricante: '3M / Estándar',
  activo: true,
}

export default function CatalogoPage() {
  const { isAdmin } = useRole()
  const [articulos, setArticulos] = useState<ArticuloEPP[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState<'todos' | 'critico' | 'ok'>('todos')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editando, setEditando] = useState<ArticuloEPP | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Modal de Ajuste / Carga de Stock Físico Real
  const [showStockModal, setShowStockModal] = useState(false)
  const [articuloStockAjuste, setArticuloStockAjuste] = useState<ArticuloEPP | null>(null)
  const [cantidadAjuste, setCantidadAjuste] = useState<string>('0')
  const [modoAjuste, setModoAjuste] = useState<'sumar' | 'fijar'>('sumar')
  const [guardandoStock, setGuardandoStock] = useState(false)
  const [errorStock, setErrorStock] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroCategoria) params.set('categoria', filtroCategoria)
    const res = await fetch(`/api/articulos?${params}`)
    const data = await res.json()
    const filtrados = Array.isArray(data)
      ? search
        ? data.filter(
            (a: ArticuloEPP) =>
              a.nombre.toLowerCase().includes(search.toLowerCase()) ||
              a.codigo.toLowerCase().includes(search.toLowerCase()) ||
              (a.talla && a.talla.toLowerCase().includes(search.toLowerCase())) ||
              (a.marcaFabricante && a.marcaFabricante.toLowerCase().includes(search.toLowerCase()))
          )
        : data
      : []
    setArticulos(filtrados)
    setLoading(false)
  }, [search, filtroCategoria])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const abrirEditar = (a: ArticuloEPP) => {
    setEditando(a)
    setForm({
      codigo: a.codigo,
      nombre: a.nombre,
      categoria: a.categoria,
      talla: a.talla ?? '',
      costoUnitario: String(a.costoUnitario),
      vidaUtilDias: String(a.vidaUtilDias),
      stockActual: String(a.stockActual),
      stockMinimo: String(a.stockMinimo),
      marcaFabricante: a.marcaFabricante || 'Estándar',
      activo: a.activo,
    })
    setError('')
    setShowModal(true)
  }

  const abrirAjusteStock = (a: ArticuloEPP) => {
    setArticuloStockAjuste(a)
    setCantidadAjuste('0')
    setModoAjuste('sumar')
    setErrorStock('')
    setShowStockModal(true)
  }

  const guardarAjusteStock = async () => {
    if (!articuloStockAjuste) return
    const cantNum = parseInt(cantidadAjuste, 10)
    if (isNaN(cantNum)) {
      setErrorStock('Ingrese una cantidad numérica válida')
      return
    }

    let nuevoStock = articuloStockAjuste.stockActual
    if (modoAjuste === 'sumar') {
      nuevoStock += cantNum
    } else {
      nuevoStock = cantNum
    }

    if (nuevoStock < 0) {
      setErrorStock('El stock final no puede ser negativo')
      return
    }

    setGuardandoStock(true)
    setErrorStock('')
    try {
      const res = await fetch(`/api/articulos/${articuloStockAjuste.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockActual: nuevoStock,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setErrorStock(d.error || 'Error al actualizar inventario')
        return
      }

      setShowStockModal(false)
      cargar()
    } catch (err: any) {
      setErrorStock(err.message || 'Error de conexión')
    } finally {
      setGuardandoStock(false)
    }
  }

  const guardar = async () => {
    if (!form.codigo || !form.nombre || !form.costoUnitario) {
      setError('Complete los campos obligatorios (*)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        talla: form.talla?.trim() || null,
        costoUnitario: parseFloat(form.costoUnitario) || 0,
        vidaUtilDias: parseInt(form.vidaUtilDias, 10) || 365,
        stockActual: parseInt(form.stockActual, 10) || 0,
        stockMinimo: parseInt(form.stockMinimo, 10) || 5,
        marcaFabricante: form.marcaFabricante?.trim() || 'Estándar',
        activo: form.activo,
      }
      const url = editando ? `/api/articulos/${editando.id}` : '/api/articulos'
      const method = editando ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Error al guardar')
        return
      }
      setShowModal(false)
      cargar()
    } finally {
      setSaving(false)
    }
  }

  // Opciones de tallas parametrizadas según la categoría
  const getOpcionesTallas = (cat: string) => {
    if (cat === 'Calzado') {
      return [...TALLAS_CALZADO]
    }
    if (cat === 'Uniforme') {
      return [...TALLAS_ROPA, '28', '30', '32', '34', '36', '38', '40', '42', '44', 'Talla Única']
    }
    return ['Talla Única', 'S', 'M', 'L', 'XL', 'Estándar']
  }

  const articulosMostrados = articulos.filter(a => {
    if (filtroStock === 'critico') return a.stockActual <= a.stockMinimo
    if (filtroStock === 'ok') return a.stockActual > a.stockMinimo
    return true
  })

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-violet-600/20 rounded-2xl flex items-center justify-center text-violet-400 shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              Catálogo de Artículos e Inventario EPP
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-semibold">
              {articulos.length} artículos e implementos registrados en almacén DALUPEZMAR S.A.C.
            </p>
          </div>
        </div>

        {/* Acciones para Administrador SST y Supervisor */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <FileSpreadsheet size={15} /> Cargar Excel Masivo
              </button>
              <button
                onClick={() => descargarPlantillaInventario()}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Download size={14} className="text-blue-600 dark:text-slate-300" /> Plantilla Base
              </button>
            </>
          )}
          <button onClick={abrirNuevo} className="btn-primary text-xs shadow-md shadow-blue-500/20">
            <Plus size={15} /> Nuevo Artículo
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            className="input-field input-with-icon text-xs py-2.5"
            placeholder="Buscar por código SKU, descripción, marca o talla..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="input-field w-auto text-xs py-2.5 font-bold"
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS_EPP.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setFiltroStock('todos')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroStock === 'todos'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({articulos.length})
            </button>
            <button
              onClick={() => setFiltroStock('critico')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroStock === 'critico'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-400 hover:text-red-600'
              }`}
            >
              ⚠️ Crítico / Reponer
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Artículos (Mobile & Tablet Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          ))
        ) : articulosMostrados.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            No se encontraron artículos en el inventario con los filtros seleccionados.
          </div>
        ) : (
          articulosMostrados.map(art => {
            const esCritico = art.stockActual <= art.stockMinimo

            return (
              <div
                key={art.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  esCritico
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800/50 ring-1 ring-red-400/30'
                    : 'bg-white dark:bg-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-mono font-black text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px]">
                      {art.codigo}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs ${
                        esCritico
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {esCritico ? (
                        <AlertTriangle size={11} className="text-red-700 shrink-0" />
                      ) : (
                        <CheckCircle2 size={11} className="text-emerald-700 shrink-0" />
                      )}
                      Stock: {art.stockActual} <span className="opacity-75">(Mín: {art.stockMinimo})</span>
                    </span>
                  </div>

                  <p className="text-sm font-black text-slate-950 dark:text-white mt-2 leading-snug">
                    {art.nombre}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                    {art.categoria} • Marca:{' '}
                    <strong className="text-slate-800 dark:text-slate-300">
                      {art.marcaFabricante || 'Estándar'}
                    </strong>
                  </p>

                  <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Talla: </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        {art.talla || 'Talla Única'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Vida Útil: </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">{art.vidaUtilDias}d</span>
                    </div>
                    <div>
                      <span className="font-mono font-black text-blue-700 dark:text-emerald-400 text-sm">
                        S/ {art.costoUnitario.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones: Ajuste Rápido de Stock + Editar Ficha */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => abrirAjusteStock(art)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition shadow-2xs border border-slate-300 dark:border-slate-600 active:scale-95"
                    title="Cargar entradas, salidas o ajustar balance de stock físico"
                  >
                    <Layers size={13} className="text-blue-600 dark:text-cyan-400" /> Stock
                  </button>

                  <button
                    onClick={() => abrirEditar(art)}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  >
                    <Pencil size={12} className="text-white" /> Editar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── MODAL NUEVO / EDITAR ARTÍCULO ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {editando ? 'Editar Artículo e Implemento EPP' : 'Nuevo Artículo EPP'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Código SKU *</label>
                <input
                  className="input-field font-mono font-bold"
                  placeholder="Ej. CAL-BOT-42"
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Marca / Proveedor</label>
                <input
                  className="input-field"
                  placeholder="Ej. 3M / MSA / Nazca / Delta Plus"
                  value={form.marcaFabricante}
                  onChange={e => setForm({ ...form, marcaFabricante: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Descripción Completa del EPP *</label>
                <input
                  className="input-field"
                  placeholder="Ej. Botas de Seguridad Punta de Acero Caña Alta"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Categoría *</label>
                <select
                  className="input-field font-bold"
                  value={form.categoria}
                  onChange={e => {
                    const nuevaCat = e.target.value
                    const opciones = getOpcionesTallas(nuevaCat)
                    setForm(f => ({
                      ...f,
                      categoria: nuevaCat,
                      talla: opciones[0] || 'Talla Única',
                    }))
                  }}
                >
                  {CATEGORIAS_EPP.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Tallas Inteligente */}
              <div>
                <label className="label">
                  Talla / Medida {form.categoria === 'Calzado' ? '(35-47)' : form.categoria === 'Uniforme' ? '(S-XXXXL)' : ''}
                </label>
                <div className="space-y-1.5">
                  <select
                    className="input-field font-bold"
                    value={form.talla}
                    onChange={e => setForm({ ...form, talla: e.target.value })}
                  >
                    <option value="">Seleccione talla...</option>
                    {getOpcionesTallas(form.categoria).map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="OTRA">Otra / Escribir personalizada...</option>
                  </select>

                  {/* Campo de texto libre si escribe talla personalizada */}
                  {(!getOpcionesTallas(form.categoria).includes(form.talla) && form.talla !== '') || form.talla === 'OTRA' ? (
                    <input
                      className="input-field text-xs font-mono"
                      placeholder="Ingrese talla personalizada..."
                      value={form.talla === 'OTRA' ? '' : form.talla}
                      onChange={e => setForm({ ...form, talla: e.target.value })}
                      autoFocus
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <label className="label">Costo Unitario (S/) *</label>
                <input
                  type="number"
                  step="0.10"
                  className="input-field font-mono font-bold"
                  value={form.costoUnitario}
                  onChange={e => setForm({ ...form, costoUnitario: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">Vida Útil (Días)</label>
                <input
                  type="number"
                  className="input-field font-mono"
                  value={form.vidaUtilDias}
                  onChange={e => setForm({ ...form, vidaUtilDias: e.target.value })}
                  placeholder="365"
                />
              </div>

              <div>
                <label className="label">Stock Actual Físico</label>
                <input
                  type="number"
                  className="input-field font-mono font-bold text-blue-700 dark:text-cyan-400"
                  value={form.stockActual}
                  onChange={e => setForm({ ...form, stockActual: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  className="input-field font-mono"
                  value={form.stockMinimo}
                  onChange={e => setForm({ ...form, stockMinimo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
              >
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar Artículo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE AJUSTE / CARGA RÁPIDA DE STOCK FÍSICO REAL ───────────── */}
      {showStockModal && articuloStockAjuste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                    Ajuste de Stock Físico Real
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {articuloStockAjuste.codigo} • {articuloStockAjuste.talla || 'Talla Única'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <p className="text-xs font-black text-slate-950 dark:text-white leading-snug">
                {articuloStockAjuste.nombre}
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700/60 font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Stock Actual Registrado:</span>
                <span className="font-mono font-black text-blue-700 dark:text-cyan-400 text-sm">
                  {articuloStockAjuste.stockActual} unidades
                </span>
              </div>
            </div>

            {errorStock && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} /> {errorStock}
              </div>
            )}

            {/* Opciones de Operación */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 font-bold">
                <button
                  type="button"
                  onClick={() => setModoAjuste('sumar')}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    modoAjuste === 'sumar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Plus size={14} /> Registrar Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoAjuste('fijar')
                    setCantidadAjuste(String(articuloStockAjuste.stockActual))
                  }}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    modoAjuste === 'fijar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <RotateCcw size={13} /> Fijar Balance Total
                </button>
              </div>

              <div>
                <label className="label">
                  {modoAjuste === 'sumar' ? 'Cantidad a Ingresar / Sumar al Stock (+):' : 'Nuevo Balance de Stock Físico Total:'}
                </label>
                <input
                  type="number"
                  className="input-field font-mono text-base font-bold text-center py-2.5"
                  value={cantidadAjuste}
                  onChange={e => setCantidadAjuste(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Nuevo Stock Calculado:</span>
                <span className="font-mono text-base text-emerald-700 dark:text-emerald-400 font-black">
                  {modoAjuste === 'sumar'
                    ? articuloStockAjuste.stockActual + (parseInt(cantidadAjuste, 10) || 0)
                    : parseInt(cantidadAjuste, 10) || 0}{' '}
                  unidades
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarAjusteStock}
                disabled={guardandoStock}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <Save size={14} /> {guardandoStock ? 'Actualizando...' : 'Guardar y Reflejar Inventario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación Masiva Excel */}
      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={cargar}
      />
    </div>
  )
}
