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
} from 'lucide-react'
import type { ArticuloEPP } from '@/lib/types'
import { useRole } from '@/components/auth/RoleContext'
import BulkImportModal from '@/components/inventory/BulkImportModal'
import { descargarPlantillaInventario } from '@/lib/excelTemplate'

const CATEGORIAS = [
  'Protección Cabeza',
  'Protección Visual',
  'Protección Auditiva',
  'Protección Manos',
  'Calzado',
  'Protección Respiratoria',
  'Protección Alturas',
  'Protección Climática',
  'Uniforme',
  'Herramientas / Accesorios',
]

const emptyForm = {
  codigo: '',
  nombre: '',
  categoria: CATEGORIAS[0],
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

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroCategoria) params.set('categoria', filtroCategoria)
    const res = await fetch(`/api/articulos?${params}`)
    const data = await res.json()
    const filtrados = search
      ? data.filter(
          (a: ArticuloEPP) =>
            a.nombre.toLowerCase().includes(search.toLowerCase()) ||
            a.codigo.toLowerCase().includes(search.toLowerCase()) ||
            (a.marcaFabricante && a.marcaFabricante.toLowerCase().includes(search.toLowerCase()))
        )
      : data
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

  const guardar = async () => {
    if (!form.codigo || !form.nombre || !form.costoUnitario) {
      setError('Complete los campos obligatorios (*)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        codigo: form.codigo,
        nombre: form.nombre,
        categoria: form.categoria,
        talla: form.talla || null,
        costoUnitario: parseFloat(form.costoUnitario),
        vidaUtilDias: parseInt(form.vidaUtilDias),
        stockActual: parseInt(form.stockActual),
        stockMinimo: parseInt(form.stockMinimo),
        marcaFabricante: form.marcaFabricante || 'Estándar',
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
        setError(d.error || 'Error')
        return
      }
      setShowModal(false)
      cargar()
    } finally {
      setSaving(false)
    }
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
          <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Catálogo de Artículos e Inventario EPP</h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              {articulos.length} artículos registrados en el almacén DALUPEZMAR S.A.C.
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
            placeholder="Buscar por código, descripción o marca..."
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
            {CATEGORIAS.map(c => (
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
        {articulosMostrados.map(art => {
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
                    {esCritico ? <AlertTriangle size={11} className="text-red-700 shrink-0" /> : <CheckCircle2 size={11} className="text-emerald-700 shrink-0" />}
                    Stock: {art.stockActual} <span className="opacity-75">(Mín: {art.stockMinimo})</span>
                  </span>
                </div>

                <p className="text-sm font-black text-slate-950 dark:text-white mt-2 leading-snug">
                  {art.nombre}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                  {art.categoria} • Marca: <strong className="text-slate-800 dark:text-slate-300">{art.marcaFabricante || 'Estándar'}</strong>
                </p>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Talla: </span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{art.talla || 'Única'}</span>
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

              <div className="mt-3.5 pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => abrirEditar(art)}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                >
                  <Pencil size={12} className="text-white" /> Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Nuevo / Editar Artículo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editando ? 'Editar Artículo EPP' : 'Nuevo Artículo EPP'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-400 font-semibold mb-1">Código SKU *</label>
                <input
                  className="input-field"
                  placeholder="Ej. EPP-CAS-01"
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-slate-400 font-semibold mb-1">Marca / Proveedor</label>
                <input
                  className="input-field"
                  placeholder="Ej. 3M / MSA / Delta Plus"
                  value={form.marcaFabricante}
                  onChange={e => setForm({ ...form, marcaFabricante: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">
                  Descripción Completa del EPP *
                </label>
                <input
                  className="input-field"
                  placeholder="Ej. Casco Dieléctrico Tipo 1 Blanco"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Categoría</label>
                <select
                  className="input-field"
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                >
                  {CATEGORIAS.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Talla</label>
                <input
                  className="input-field"
                  placeholder="Ej. L / 42 / Estándar"
                  value={form.talla}
                  onChange={e => setForm({ ...form, talla: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Costo Unitario (S/) *
                </label>
                <input
                  type="number"
                  step="0.10"
                  className="input-field"
                  value={form.costoUnitario}
                  onChange={e => setForm({ ...form, costoUnitario: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Vida Útil (Días)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.vidaUtilDias}
                  onChange={e => setForm({ ...form, vidaUtilDias: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stock Actual</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.stockActual}
                  onChange={e => setForm({ ...form, stockActual: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.stockMinimo}
                  onChange={e => setForm({ ...form, stockMinimo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar Artículo'}
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
