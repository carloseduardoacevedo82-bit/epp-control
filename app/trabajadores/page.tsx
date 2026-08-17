'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
  X,
  Save,
  Package,
  Calendar,
  Building2,
  Phone,
  ShieldCheck,
  Tag,
  ChevronRight,
  Filter,
} from 'lucide-react'
import type { Trabajador } from '@/lib/types'

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

const emptyForm = {
  dni: '',
  nombres: '',
  apellidos: '',
  cargo: '',
  area: AREAS[0],
  fechaIngreso: new Date().toISOString().split('T')[0],
  tallaPantalon: '',
  tallaCamisa: '',
  tallaCalzado: '',
  estado: 'activo',
}

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Trabajador | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroArea) params.set('area', filtroArea)
    const res = await fetch(`/api/trabajadores?${params}`)
    const data = await res.json()
    setTrabajadores(data)
    setLoading(false)
  }, [search, filtroEstado, filtroArea])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const abrirEditar = (t: Trabajador) => {
    setEditando(t)
    setForm({
      dni: t.dni,
      nombres: t.nombres,
      apellidos: t.apellidos,
      cargo: t.cargo,
      area: t.area,
      fechaIngreso: t.fechaIngreso.split('T')[0],
      tallaPantalon: t.tallaPantalon ?? '',
      tallaCamisa: t.tallaCamisa ?? '',
      tallaCalzado: t.tallaCalzado ?? '',
      estado: t.estado,
    })
    setError('')
    setShowModal(true)
  }

  const guardar = async () => {
    if (!form.dni || !form.nombres || !form.apellidos || !form.cargo) {
      setError('Complete los campos obligatorios (*)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editando ? `/api/trabajadores/${editando.id}` : '/api/trabajadores'
      const method = editando ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fechaIngreso: new Date(form.fechaIngreso).toISOString(),
          tallaPantalon: form.tallaPantalon || null,
          tallaCamisa: form.tallaCamisa || null,
          tallaCalzado: form.tallaCalzado || null,
        }),
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

  const cambiarEstado = async (t: Trabajador) => {
    const nuevoEstado = t.estado === 'activo' ? 'inactivo' : 'activo'
    await fetch(`/api/trabajadores/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    cargar()
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Padrón General de Colaboradores
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {trabajadores.length} trabajadores registrados en planilla y planta DALUPEZMAR
            </p>
          </div>
        </div>

        <button onClick={abrirNuevo} className="btn-primary text-xs shrink-0 self-start sm:self-auto">
          <Plus size={16} /> Registrar Colaborador
        </button>
      </div>

      {/* Barra de Filtros Espaciosa */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            className="input-field input-with-icon text-xs py-2.5"
            placeholder="Buscar por DNI, apellidos, nombres o cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="input-field w-auto text-xs py-2.5 font-bold"
            value={filtroArea}
            onChange={e => setFiltroArea(e.target.value)}
          >
            <option value="">Todas las áreas</option>
            {AREAS.map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            className="input-field w-auto text-xs py-2.5 font-bold"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Solo Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Vista de Tabla Espaciosa (Desktop / Tablet) */}
      <div className="card p-0 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[920px]">
            <thead>
              <tr className="bg-slate-800 text-slate-200 border-b border-slate-700">
                <th className="py-3.5 px-4 font-bold w-28">DNI</th>
                <th className="py-3.5 px-4 font-bold min-w-[200px]">Apellidos y Nombres</th>
                <th className="py-3.5 px-4 font-bold min-w-[160px]">Cargo / Puesto</th>
                <th className="py-3.5 px-4 font-bold min-w-[130px]">Área Operativa</th>
                <th className="py-3.5 px-4 font-bold min-w-[150px]">Tallas Registradas</th>
                <th className="py-3.5 px-4 font-bold text-center w-28">Estado</th>
                <th className="py-3.5 px-4 font-bold text-center w-24">Actas</th>
                <th className="py-3.5 px-4 font-bold text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-slate-300">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-slate-800/80 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trabajadores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-12 text-sm">
                    No se encontraron colaboradores con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                trabajadores.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono font-black text-blue-700 dark:text-cyan-400 text-xs whitespace-nowrap">
                      <span className="bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                        {t.dni}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-sm text-slate-950 dark:text-white leading-snug">
                        {t.apellidos}, {t.nombres}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        Ingreso: {new Date(t.fechaIngreso).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{t.cargo}</td>
                    <td className="py-3.5 px-4">
                      <span className="badge-area">{t.area}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold">
                          P: <strong>{t.tallaPantalon || '-'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold">
                          C: <strong>{t.tallaCamisa || '-'}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold">
                          Z: <strong>{t.tallaCalzado || '-'}</strong>
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={t.estado === 'activo' ? 'badge-vigente' : 'badge-vencido'}
                      >
                        {t.estado === 'activo' ? '● Activo' : '● Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black font-mono text-blue-700 dark:text-cyan-400 text-sm">
                      {t._count?.entregas ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => abrirEditar(t)}
                          className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-slate-300 hover:text-white transition shadow-2xs border border-blue-300 dark:border-slate-700"
                          title="Editar Trabajador"
                        >
                          <Pencil size={13} className="text-blue-700 dark:text-slate-300" />
                        </button>
                        <button
                          onClick={() => cambiarEstado(t)}
                          className={`p-2 rounded-xl transition shadow-2xs border ${
                            t.estado === 'activo'
                              ? 'bg-rose-50 dark:bg-red-950/40 text-rose-700 dark:text-red-400 hover:bg-rose-600 hover:text-white border-rose-300 dark:border-red-800/40'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border-emerald-300 dark:border-emerald-800/40'
                          }`}
                          title={t.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}
                        >
                          {t.estado === 'activo' ? (
                            <UserX size={13} className="text-rose-700 dark:text-red-400" />
                          ) : (
                            <UserCheck size={13} className="text-emerald-700 dark:text-emerald-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario Amplio */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
          onClick={e => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {editando ? 'Editar Datos del Colaborador' : 'Registrar Nuevo Colaborador'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="label">DNI / Documento de Identidad *</label>
                <input
                  className="input-field"
                  value={form.dni}
                  onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
                  maxLength={12}
                  placeholder="Ej. 61376102"
                />
              </div>
              <div>
                <label className="label">Área de Trabajo *</label>
                <select
                  className="input-field"
                  value={form.area}
                  onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
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
                  value={form.nombres}
                  onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))}
                  placeholder="Ej. Lourdes Rosa"
                />
              </div>
              <div>
                <label className="label">Apellidos Completos *</label>
                <input
                  className="input-field"
                  value={form.apellidos}
                  onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                  placeholder="Ej. Manrique Romani"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Cargo / Puesto Operativo *</label>
                <input
                  className="input-field"
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ej. Operario de Producción"
                />
              </div>

              <div>
                <label className="label">Talla Pantalón</label>
                <select
                  className="input-field"
                  value={form.tallaPantalon}
                  onChange={e => setForm(f => ({ ...f, tallaPantalon: e.target.value }))}
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
                  value={form.tallaCamisa}
                  onChange={e => setForm(f => ({ ...f, tallaCamisa: e.target.value }))}
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
                  value={form.tallaCalzado}
                  onChange={e => setForm(f => ({ ...f, tallaCalzado: e.target.value }))}
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
                  value={form.fechaIngreso}
                  onChange={e => setForm(f => ({ ...f, fechaIngreso: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
              >
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar Colaborador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
