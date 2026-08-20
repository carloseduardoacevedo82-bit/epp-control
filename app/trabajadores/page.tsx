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
  RefreshCw,
  Scan,
  CheckCircle2,
  AlertCircle,
  HardHat,
  Droplet,
} from 'lucide-react'
import type { Trabajador } from '@/lib/types'
import { AREAS, TALLAS_CALZADO, TALLAS_ROPA, TALLAS_PANTALON } from '@/lib/types'
import ScannerSimulatorModal from '@/components/ui/ScannerSimulatorModal'

const GRUPOS_SANGUINEOS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const emptyForm = {
  dni: '',
  codigoFotocheck: '',
  nombres: '',
  apellidos: '',
  cargo: '',
  area: AREAS[0] as string,
  grupoSanguineo: 'O+',
  contactoEmergencia: '',
  plantaPrincipal: 'PECEPE S.A.C.',
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
  const [showScanner, setShowScanner] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
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

  // Sincronizar automáticamente con el sistema de Asistencia y Fotochecks
  const handleSincronizar = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/sync-asistencia', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSyncMessage(
          `✅ Sincronizados: ${data.totalAsistencia} colaboradores (${data.creados} nuevos, ${data.actualizados} actualizados)`
        )
        cargar()
      } else {
        setSyncMessage(`⚠️ Error: ${data.error}`)
      }
    } catch (e: any) {
      setSyncMessage(`⚠️ Error de red al sincronizar: ${e.message}`)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 7000)
    }
  }

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
      codigoFotocheck: t.codigoFotocheck ?? '',
      nombres: t.nombres,
      apellidos: t.apellidos,
      cargo: t.cargo,
      area: t.area,
      grupoSanguineo: t.grupoSanguineo ?? 'O+',
      contactoEmergencia: t.contactoEmergencia ?? '',
      plantaPrincipal: t.plantaPrincipal ?? 'PECEPE S.A.C.',
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
          codigoFotocheck: form.codigoFotocheck?.trim() || null,
          contactoEmergencia: form.contactoEmergencia?.trim() || null,
          plantaPrincipal: form.plantaPrincipal?.trim() || null,
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
              {trabajadores.length} trabajadores sincronizados con Fotochecks y Asistencia DALUPEZMAR
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleSincronizar}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Sincronizar altas, bajas y cambios con la base de datos de Asistencia y Fotochecks"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin text-cyan-400' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Asistencia'}
          </button>

          <button
            onClick={() => setShowScanner(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95"
            title="Escanear fotocheck físico con la cámara del celular"
          >
            <Scan size={15} /> Escanear Fotocheck
          </button>

          <button onClick={abrirNuevo} className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={16} /> Registrar Colaborador
          </button>
        </div>
      </div>

      {/* Notificación de Sincronización */}
      {syncMessage && (
        <div className="p-3.5 bg-blue-950/70 border border-cyan-500/40 text-cyan-200 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Barra de Filtros Espaciosa */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            className="input-field input-with-icon text-xs py-2.5"
            placeholder="Buscar por DNI, Fotocheck (DAL-XXXX), apellidos, nombres o cargo..."
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
            <option value="inactivo">Inactivos (De baja)</option>
          </select>
        </div>
      </div>

      {/* Vista de Tabla Espaciosa (Desktop / Tablet) */}
      <div className="card p-0 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-800 text-slate-200 border-b border-slate-700">
                <th className="py-3.5 px-4 font-bold w-36">DNI / Fotocheck</th>
                <th className="py-3.5 px-4 font-bold min-w-[200px]">Apellidos y Nombres</th>
                <th className="py-3.5 px-4 font-bold min-w-[170px]">Cargo / Puesto</th>
                <th className="py-3.5 px-4 font-bold min-w-[130px]">Área Operativa</th>
                <th className="py-3.5 px-4 font-bold min-w-[110px]">Tallas</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Emergencia</th>
                <th className="py-3.5 px-4 font-bold text-center w-24">Estado</th>
                <th className="py-3.5 px-4 font-bold text-center w-20">Actas</th>
                <th className="py-3.5 px-4 font-bold text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-slate-300">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-slate-800/80 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trabajadores.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-400 py-12 text-sm">
                    No se encontraron colaboradores con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                trabajadores.map(t => {
                  const isInactive = t.estado === 'inactivo'
                  return (
                  <tr key={t.id} className={`transition ${isInactive ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`font-black px-2 py-0.5 rounded-lg border ${
                          isInactive
                            ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                            : 'text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                        }`}>
                          {t.dni}
                        </span>
                        {t.codigoFotocheck && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                            📷 {t.codigoFotocheck}
                          </span>
                        )}
                        {isInactive && (
                          <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 rounded border border-red-300 dark:border-red-700 flex items-center gap-0.5">
                            ⛔ INACTIVO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-black text-sm text-slate-950 dark:text-white leading-snug flex items-center gap-2 flex-wrap">
                        <span>{t.apellidos}, {t.nombres}</span>
                        {isInactive && (
                          <span className="text-[10px] font-black text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/90 px-2 py-0.5 rounded-full border border-red-300 dark:border-red-700">
                            ⛔ DADO DE BAJA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Ingreso: {new Date(t.fechaIngreso).toLocaleDateString('es-PE')}</span>
                        {t.grupoSanguineo && (
                          <span className="text-rose-500 dark:text-rose-400 font-bold">
                            🩸 {t.grupoSanguineo}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{t.cargo}</td>
                    <td className="py-3.5 px-4">
                      <span className="badge-area">{t.area}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold">
                          P: {t.tallaPantalon || '-'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold">
                          C: {t.tallaCamisa || '-'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold">
                          Z: {t.tallaCalzado || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.contactoEmergencia || '+51 911111111'}
                      </span>
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
                          title={t.estado === 'activo' ? 'Dar de baja en EPP y Fotocheck' : 'Reactivar Colaborador'}
                        >
                          {t.estado === 'activo' ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro / Edición de Colaborador */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {editando ? 'Editar Colaborador DALUPEZMAR' : 'Registrar Nuevo Colaborador'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="label">DNI / Documento Identidad *</label>
                <input
                  className="input-field font-mono"
                  value={form.dni}
                  onChange={e => setForm(f => ({ ...f, dni: e.target.value }))}
                  maxLength={12}
                  placeholder="Ej. 63401773"
                />
              </div>

              <div>
                <label className="label">Código de Fotocheck (QR / Carné)</label>
                <input
                  className="input-field font-mono"
                  value={form.codigoFotocheck}
                  onChange={e => setForm(f => ({ ...f, codigoFotocheck: e.target.value.toUpperCase() }))}
                  placeholder="Ej. DAL-1012"
                />
              </div>

              <div>
                <label className="label">Nombres Completos *</label>
                <input
                  className="input-field"
                  value={form.nombres}
                  onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))}
                  placeholder="Ej. Dempster"
                />
              </div>
              <div>
                <label className="label">Apellidos Completos *</label>
                <input
                  className="input-field"
                  value={form.apellidos}
                  onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
                  placeholder="Ej. Cahuaza Muena"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Cargo / Puesto Operativo *</label>
                <input
                  className="input-field"
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ej. TROQUELADO DE ANILLAS"
                />
              </div>

              <div>
                <label className="label">Área Operativa *</label>
                <select
                  className="input-field font-bold"
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
                <label className="label">Grupo Sanguíneo</label>
                <select
                  className="input-field font-bold"
                  value={form.grupoSanguineo}
                  onChange={e => setForm(f => ({ ...f, grupoSanguineo: e.target.value }))}
                >
                  {GRUPOS_SANGUINEOS.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Contacto de Emergencia</label>
                <input
                  className="input-field font-mono"
                  value={form.contactoEmergencia}
                  onChange={e => setForm(f => ({ ...f, contactoEmergencia: e.target.value }))}
                  placeholder="Ej. +51 911111111"
                />
              </div>

              <div>
                <label className="label">Planta Principal</label>
                <input
                  className="input-field"
                  value={form.plantaPrincipal}
                  onChange={e => setForm(f => ({ ...f, plantaPrincipal: e.target.value }))}
                  placeholder="Ej. PECEPE S.A.C."
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
                  {TALLAS_PANTALON.map(t => (
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
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar y Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escáner Óptico de Fotochecks en vivo */}
      <ScannerSimulatorModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={code => {
          setSearch(code)
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
    </div>
  )
}
