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
  RefreshCw,
  Scan,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FolderCheck,
  FolderArchive,
  ArrowRightLeft,
  ShieldCheck,
  Sparkles,
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
  // Lista maestra de todos los colaboradores
  const [todosTrabajadores, setTodosTrabajadores] = useState<Trabajador[]>([])
  const [loading, setLoading] = useState(true)

  // Carpeta activa: 'activos' (por defecto) o 'bajas'
  const [tabCarpeta, setTabCarpeta] = useState<'activos' | 'bajas'>('activos')

  // Filtros de búsqueda
  const [search, setSearch] = useState('')
  const [filtroArea, setFiltroArea] = useState('')

  // Modales
  const [showModal, setShowModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [editando, setEditando] = useState<Trabajador | null>(null)
  const [trabajadorAEliminar, setTrabajadorAEliminar] = useState<Trabajador | null>(null)
  const [trabajadorABajar, setTrabajadorABajar] = useState<Trabajador | null>(null)
  const [trabajadorAReactivar, setTrabajadorAReactivar] = useState<Trabajador | null>(null)

  // Estados de proceso
  const [eliminando, setEliminando] = useState(false)
  const [procesandoEstado, setProcesandoEstado] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Cargar todos los colaboradores desde el backend
  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trabajadores')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTodosTrabajadores(data)
      }
    } catch (err: any) {
      console.error('Error al cargar trabajadores:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Contadores dinámicos para las carpetas
  const totalActivos = todosTrabajadores.filter(t => t.estado === 'activo').length
  const totalBajas = todosTrabajadores.filter(t => t.estado === 'inactivo').length

  // Filtrado estricto por carpeta y parámetros de búsqueda
  const trabajadoresMostrados = todosTrabajadores.filter(t => {
    // 1. Separación estricta por carpeta
    if (tabCarpeta === 'activos' && t.estado !== 'activo') return false
    if (tabCarpeta === 'bajas' && t.estado !== 'inactivo') return false

    // 2. Filtro por área operativa
    if (filtroArea && t.area !== filtroArea) return false

    // 3. Filtro por texto de búsqueda
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      const matchDni = t.dni.toLowerCase().includes(q)
      const matchFotocheck = (t.codigoFotocheck || '').toLowerCase().includes(q)
      const matchNombres = t.nombres.toLowerCase().includes(q)
      const matchApellidos = t.apellidos.toLowerCase().includes(q)
      const matchCompleto = `${t.apellidos} ${t.nombres}`.toLowerCase().includes(q)
      const matchInvertido = `${t.nombres} ${t.apellidos}`.toLowerCase().includes(q)
      const matchCargo = (t.cargo || '').toLowerCase().includes(q)

      if (
        !matchDni &&
        !matchFotocheck &&
        !matchNombres &&
        !matchApellidos &&
        !matchCompleto &&
        !matchInvertido &&
        !matchCargo
      ) {
        return false
      }
    }

    return true
  })

  // Sincronizar manualmente con el sistema de Asistencia y Fotochecks
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

  // Dar de baja a un trabajador activo (mover a carpeta de bajas)
  const confirmarDarDeBaja = async () => {
    if (!trabajadorABajar) return
    setProcesandoEstado(true)
    try {
      const res = await fetch(`/api/trabajadores/${trabajadorABajar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'inactivo' }),
      })
      if (res.ok) {
        setSyncMessage(
          `⛔ "${trabajadorABajar.apellidos}, ${trabajadorABajar.nombres}" fue dado de baja y transferido a la Carpeta de Bajas.`
        )
        setTrabajadorABajar(null)
        await cargar()
      } else {
        const d = await res.json()
        alert(`Error al dar de baja: ${d.error || 'Ocurrió un error inesperado'}`)
      }
    } catch (e: any) {
      alert(`Error de conexión: ${e.message}`)
    } finally {
      setProcesandoEstado(false)
      setTimeout(() => setSyncMessage(null), 8000)
    }
  }

  // Reactivar a un trabajador en baja (devolver a carpeta de activos)
  const confirmarReactivar = async () => {
    if (!trabajadorAReactivar) return
    setProcesandoEstado(true)
    try {
      const res = await fetch(`/api/trabajadores/${trabajadorAReactivar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'activo' }),
      })
      if (res.ok) {
        setSyncMessage(
          `✅ "${trabajadorAReactivar.apellidos}, ${trabajadorAReactivar.nombres}" ha sido reactivado exitosamente y devuelto a la Carpeta de Colaboradores Activos.`
        )
        setTrabajadorAReactivar(null)
        await cargar()
      } else {
        const d = await res.json()
        alert(`Error al reactivar: ${d.error || 'Ocurrió un error inesperado'}`)
      }
    } catch (e: any) {
      alert(`Error de conexión: ${e.message}`)
    } finally {
      setProcesandoEstado(false)
      setTimeout(() => setSyncMessage(null), 8000)
    }
  }

  // Eliminar definitivamente de EPP Control y Asistencia
  const confirmarEliminarPermanente = async () => {
    if (!trabajadorAEliminar) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/trabajadores/${trabajadorAEliminar.id}?permanente=true`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(`🗑️ ${data.message || 'Trabajador eliminado permanentemente de todo el sistema.'}`)
        setTrabajadorAEliminar(null)
        setShowModal(false)
        await cargar()
      } else {
        alert(`Error al eliminar: ${data.error || 'Ocurrió un error inesperado'}`)
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`)
    } finally {
      setEliminando(false)
      setTimeout(() => setSyncMessage(null), 8000)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── HEADER PRINCIPAL ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Padrón General de Colaboradores
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Personal clasificado por carpetas de nómina con sincronización en vivo hacia Fotochecks y Asistencia DALUPEZMAR
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleSincronizar}
            disabled={syncing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 disabled:opacity-50"
            title="Sincronizar altas, bajas y cambios con la base de datos de Asistencia y Fotochecks"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin text-cyan-500' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Asistencia'}
          </button>

          <button
            onClick={() => setShowScanner(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95"
            title="Escanear fotocheck físico con la cámara del celular o pistola lectora"
          >
            <Scan size={15} /> Escanear Fotocheck
          </button>

          <button onClick={abrirNuevo} className="btn-primary text-xs py-2.5 flex items-center gap-1.5 shadow-md shadow-blue-500/20">
            <Plus size={16} /> Registrar Colaborador
          </button>
        </div>
      </div>

      {/* ── NOTIFICACIÓN DE ESTADO / SINCRONIZACIÓN ───────────────────── */}
      {syncMessage && (
        <div className="p-4 bg-blue-950/80 border border-cyan-500/50 text-cyan-200 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="leading-relaxed">{syncMessage}</span>
          <button
            onClick={() => setSyncMessage(null)}
            className="ml-auto p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── PESTAÑAS TIPO CARPETAS FÍSICAS (ACTIVOS VS BAJAS) ────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Carpeta 1: Colaboradores Activos */}
          <button
            onClick={() => setTabCarpeta('activos')}
            className={`px-4 sm:px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs cursor-pointer ${
              tabCarpeta === 'activos'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            <FolderCheck className={`w-4 h-4 ${tabCarpeta === 'activos' ? 'text-white' : 'text-cyan-500'}`} />
            <span>📁 Carpeta: Colaboradores Activos</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                tabCarpeta === 'activos'
                  ? 'bg-blue-900/80 text-cyan-200 border border-blue-400/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {totalActivos}
            </span>
          </button>

          {/* Carpeta 2: Trabajadores en Baja */}
          <button
            onClick={() => setTabCarpeta('bajas')}
            className={`px-4 sm:px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs cursor-pointer ${
              tabCarpeta === 'bajas'
                ? 'bg-rose-700 text-white shadow-lg shadow-rose-700/30 ring-2 ring-rose-400/40'
                : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
            }`}
          >
            <FolderArchive className={`w-4 h-4 ${tabCarpeta === 'bajas' ? 'text-white' : 'text-rose-400'}`} />
            <span>📁 Carpeta: Trabajadores en Baja</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                tabCarpeta === 'bajas'
                  ? 'bg-rose-950 text-rose-200 border border-rose-400/30'
                  : 'bg-rose-50 dark:bg-red-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-red-900/60'
              }`}
            >
              {totalBajas}
            </span>
          </button>
        </div>

        {/* Indicador de Carpeta Activa */}
        <div className="text-right hidden md:block">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {tabCarpeta === 'activos' ? 'Estado de la Nómina' : 'Archivo Histórico'}
          </p>
          <p className="text-xs font-black text-slate-900 dark:text-white">
            {tabCarpeta === 'activos'
              ? `${totalActivos} trabajadores activos en planta PECEPE`
              : `${totalBajas} trabajadores archivados (con opción de reactivación)`}
          </p>
        </div>
      </div>

      {/* ── BANNER EXPLICATIVO SEGÚN LA CARPETA SELECCIONADA ───────────── */}
      {tabCarpeta === 'activos' ? (
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-slate-800 dark:text-slate-200">
              Visualizando <strong>Carpeta de Colaboradores Activos</strong>. Los colaboradores que fueron dados de baja han sido separados de esta lista y trasladados a su respectiva <strong>Carpeta de Bajas</strong>.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-cyan-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-slate-700 shrink-0">
            {trabajadoresMostrados.length} de {totalActivos} activos
          </span>
        </div>
      ) : (
        <div className="p-3.5 bg-rose-50/70 dark:bg-red-950/30 border border-rose-200 dark:border-red-900/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-800 dark:text-slate-200">
              Visualizando <strong>Carpeta de Trabajadores en Baja</strong>. Cada colaborador cuenta con la opción de <strong>Reactivar Colaborador</strong> para reintegrarlo inmediatamente a la Carpeta de Activos.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-slate-700 shrink-0">
            {trabajadoresMostrados.length} de {totalBajas} en baja
          </span>
        </div>
      )}

      {/* ── BARRA DE BÚSQUEDA Y FILTRO DE ÁREA ───────────────────────── */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            className="input-field input-with-icon text-xs py-2.5"
            placeholder={
              tabCarpeta === 'activos'
                ? 'Buscar en colaboradores activos por DNI, Fotocheck (DAL-XXXX), apellidos, nombres o cargo...'
                : 'Buscar en trabajadores en baja por DNI, apellidos, nombres o cargo para reactivar...'
            }
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

          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 transition"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      </div>

      {/* ── TABLA DE COLABORADORES POR CARPETA ───────────────────────── */}
      <div className="card p-0 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-800 text-slate-200 border-b border-slate-700">
                <th className="py-3.5 px-4 font-bold w-36">DNI / Fotocheck</th>
                <th className="py-3.5 px-4 font-bold min-w-[210px]">Apellidos y Nombres</th>
                <th className="py-3.5 px-4 font-bold min-w-[170px]">Cargo / Puesto</th>
                <th className="py-3.5 px-4 font-bold min-w-[130px]">Área Operativa</th>
                <th className="py-3.5 px-4 font-bold min-w-[110px]">Tallas</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Emergencia</th>
                <th className="py-3.5 px-4 font-bold text-center w-28">Carpeta / Estado</th>
                <th className="py-3.5 px-4 font-bold text-center w-20">Actas EPP</th>
                <th className="py-3.5 px-4 font-bold text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-300">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : trabajadoresMostrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 dark:text-slate-400 py-12 text-sm">
                    {tabCarpeta === 'activos'
                      ? 'No se encontraron colaboradores activos con los filtros especificados.'
                      : 'No se encontraron trabajadores en la Carpeta de Bajas con los filtros especificados.'}
                  </td>
                </tr>
              ) : (
                trabajadoresMostrados.map(t => {
                  const isInactive = t.estado === 'inactivo'
                  return (
                    <tr
                      key={t.id}
                      className={`transition ${
                        isInactive
                          ? 'bg-rose-500/5 hover:bg-rose-500/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* DNI / Fotocheck */}
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`font-black px-2 py-0.5 rounded-lg border ${
                              isInactive
                                ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-red-950/40 border-rose-300 dark:border-rose-800'
                                : 'text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {t.dni}
                          </span>
                          {t.codigoFotocheck && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                              📷 {t.codigoFotocheck}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Apellidos y Nombres */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-slate-950 dark:text-white leading-snug flex items-center gap-2 flex-wrap">
                          <span>
                            {t.apellidos}, {t.nombres}
                          </span>
                          {isInactive && (
                            <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/90 px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800">
                              ⛔ EN BAJA
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Ingreso: {new Date(t.fechaIngreso).toLocaleDateString('es-PE')}</span>
                          {t.grupoSanguineo && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              🩸 {t.grupoSanguineo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">{t.cargo}</td>

                      {/* Área */}
                      <td className="py-3.5 px-4">
                        <span className="badge-area">{t.area}</span>
                      </td>

                      {/* Tallas */}
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

                      {/* Emergencia */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {t.contactoEmergencia || '+51 911111111'}
                        </span>
                      </td>

                      {/* Carpeta / Estado */}
                      <td className="py-3.5 px-4 text-center">
                        {t.estado === 'activo' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            En Baja
                          </span>
                        )}
                      </td>

                      {/* Actas */}
                      <td className="py-3.5 px-4 text-center font-black font-mono text-blue-700 dark:text-cyan-400 text-sm">
                        {t._count?.entregas ?? 0}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Si está en la carpeta de Bajas: botón destacado REACTIVAR */}
                          {isInactive ? (
                            <button
                              onClick={() => setTrabajadorAReactivar(t)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                              title="Reactivar Colaborador (trasladar a Carpeta de Activos)"
                            >
                              <UserCheck size={14} />
                              <span>Reactivar</span>
                            </button>
                          ) : (
                            /* Si está en la carpeta de Activos: botón DAR DE BAJA */
                            <button
                              onClick={() => setTrabajadorABajar(t)}
                              className="p-2 rounded-xl bg-rose-50 dark:bg-red-950/40 text-rose-700 dark:text-red-400 hover:bg-rose-600 hover:text-white transition shadow-2xs border border-rose-300 dark:border-red-800/40 cursor-pointer"
                              title="Dar de baja al colaborador (trasladar a Carpeta de Bajas)"
                            >
                              <UserX size={14} />
                            </button>
                          )}

                          {/* Botón Editar */}
                          <button
                            onClick={() => abrirEditar(t)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white transition shadow-2xs border border-slate-300 dark:border-slate-700 cursor-pointer"
                            title="Editar Datos del Trabajador"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Botón Eliminar Permanente */}
                          <button
                            onClick={() => setTrabajadorAEliminar(t)}
                            className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition shadow-2xs border border-red-200 dark:border-red-800/50 cursor-pointer"
                            title="Eliminar permanentemente de todo el sistema (EPP y Asistencia)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL DE CONFIRMACIÓN: DAR DE BAJA ────────────────────────── */}
      {trabajadorABajar && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-2">
              <UserX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ¿Dar de baja al colaborador?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                El colaborador será retirado de la <strong>Carpeta de Activos</strong> y trasladado a la <strong>Carpeta de Bajas</strong>:
              </p>
              <div className="p-3 bg-rose-50 dark:bg-red-950/30 border border-rose-200 dark:border-red-900/50 rounded-2xl text-left space-y-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {trabajadorABajar.apellidos}, {trabajadorABajar.nombres}
                </p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  DNI: <span className="font-bold text-rose-600 dark:text-rose-400">{trabajadorABajar.dni}</span> • {trabajadorABajar.cargo}
                </p>
                <p className="text-[11px] text-slate-500">
                  Área: <span className="font-bold">{trabajadorABajar.area}</span>
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-left">
                <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                  <FolderArchive size={15} className="shrink-0 mt-0.5 text-blue-500" />
                  <span>
                    Su historial de actas y constancias se conservará intacto. Podrá reactivar al colaborador en cualquier momento desde la <strong>Carpeta de Bajas</strong>.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrabajadorABajar(null)}
                disabled={procesandoEstado}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarDarDeBaja}
                disabled={procesandoEstado}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <UserX size={14} />
                {procesandoEstado ? 'Dando de baja...' : 'Sí, Dar de Baja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN: REACTIVAR COLABORADOR ────────────────── */}
      {trabajadorAReactivar && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ¿Reactivar colaborador?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                El colaborador será retirado de la <strong>Carpeta de Bajas</strong> y devuelto a la <strong>Carpeta de Colaboradores Activos</strong>:
              </p>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-left space-y-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {trabajadorAReactivar.apellidos}, {trabajadorAReactivar.nombres}
                </p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  DNI: <span className="font-bold text-emerald-600 dark:text-emerald-400">{trabajadorAReactivar.dni}</span> • {trabajadorAReactivar.cargo}
                </p>
                <p className="text-[11px] text-slate-500">
                  Área: <span className="font-bold">{trabajadorAReactivar.area}</span>
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
                  <span>
                    Su estado pasará a <strong>Activo</strong> en EPP Control y se sincronizará automáticamente como <strong>ACTIVE</strong> en el sistema de Asistencia DALUPEZMAR.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrabajadorAReactivar(null)}
                disabled={procesandoEstado}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarReactivar}
                disabled={procesandoEstado}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <UserCheck size={14} />
                {procesandoEstado ? 'Reactivando...' : 'Sí, Reactivar Colaborador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN: ELIMINACIÓN PERMANENTE ─────────────── */}
      {trabajadorAEliminar && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-red-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ¿Eliminar definitivamente?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Estás a punto de eliminar de forma permanente e irreversible a:
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl text-left space-y-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {trabajadorAEliminar.apellidos}, {trabajadorAEliminar.nombres}
                </p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  DNI: <span className="font-bold text-red-600 dark:text-red-400">{trabajadorAEliminar.dni}</span> • {trabajadorAEliminar.cargo}
                </p>
                <p className="text-[11px] text-slate-500">
                  Entregas de EPP registradas: <span className="font-bold">{trabajadorAEliminar._count?.entregas ?? 0}</span>
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Esta acción eliminará al colaborador de <strong>EPP Control</strong> (incluyendo historial de actas y carpetas de constancias) y del sistema de <strong>Asistencia DALUPEZMAR</strong> en vivo.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTrabajadorAEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarPermanente}
                disabled={eliminando}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 size={14} />
                {eliminando ? 'Eliminando...' : 'Sí, Eliminar de Todo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE REGISTRO / EDICIÓN DE COLABORADOR ─────────────────── */}
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

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              {editando ? (
                <button
                  type="button"
                  onClick={() => setTrabajadorAEliminar(editando)}
                  className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-red-300 dark:border-red-800/60 transition active:scale-95 cursor-pointer"
                  title="Eliminar permanentemente de EPP Control y Asistencia"
                >
                  <Trash2 size={14} /> Eliminar Permanentemente
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2 ml-auto">
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
        </div>
      )}

      {/* ── ESCÁNER ÓPTICO DE FOTOCHECKS ──────────────────────────────── */}
      <ScannerSimulatorModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={code => {
          setSearch(code)
        }}
        mode="trabajador"
        workersList={todosTrabajadores}
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
