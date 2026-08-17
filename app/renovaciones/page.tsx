'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  User,
  ShieldCheck,
  Building2,
  Package,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface DetalleRenovacion {
  id: number
  estadoRenovacion: 'Vigente' | 'Por Vencer' | 'Vencido'
  fechaRenovacionCalc: string
  cantidad: number
  articulo: { nombre: string; categoria: string; codigo: string }
  entrega: {
    fechaEntrega: string
    trabajador: { nombres: string; apellidos: string; dni: string; area: string }
  }
}

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

function BadgeEstado({ estado }: { estado: string }) {
  if (estado === 'Vencido') {
    return (
      <span className="badge-vencido whitespace-nowrap">
        <AlertTriangle size={12} className="shrink-0" /> Vencido
      </span>
    )
  }
  if (estado === 'Por Vencer') {
    return (
      <span className="badge-por-vencer whitespace-nowrap">
        <Clock size={12} className="shrink-0" /> Por Vencer (&le;15d)
      </span>
    )
  }
  return (
    <span className="badge-vigente whitespace-nowrap">
      <CheckCircle2 size={12} className="shrink-0" /> Vigente
    </span>
  )
}

export default function RenovacionesPage() {
  const [detalles, setDetalles] = useState<DetalleRenovacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroArea, setFiltroArea] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroEstado) params.set('estado', filtroEstado)
    if (filtroArea) params.set('area', filtroArea)
    if (filtroCategoria) params.set('categoria', filtroCategoria)
    const res = await fetch(`/api/renovaciones?${params}`)
    const data = await res.json()
    setDetalles(data)
    setLoading(false)
  }, [filtroEstado, filtroArea, filtroCategoria])

  useEffect(() => {
    cargar()
  }, [cargar])

  const countPorEstado = {
    Vencido: detalles.filter(d => d.estadoRenovacion === 'Vencido').length,
    'Por Vencer': detalles.filter(d => d.estadoRenovacion === 'Por Vencer').length,
    Vigente: detalles.filter(d => d.estadoRenovacion === 'Vigente').length,
  }

  const detallesFiltrados = search
    ? detalles.filter(d => {
        const q = search.toLowerCase()
        return (
          d.entrega.trabajador.dni.includes(q) ||
          `${d.entrega.trabajador.apellidos} ${d.entrega.trabajador.nombres}`.toLowerCase().includes(q) ||
          d.articulo.nombre.toLowerCase().includes(q) ||
          d.articulo.codigo.toLowerCase().includes(q)
        )
      })
    : detalles

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shadow-sm">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Semáforo de Renovaciones y Vida Útil de EPP
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Monitoreo automatizado del vencimiento y reposición periódica de equipos
            </p>
          </div>
        </div>

        <button onClick={cargar} className="btn-secondary text-xs shrink-0 self-start sm:self-auto">
          <RefreshCw size={14} /> Actualizar Semáforo
        </button>
      </div>

      {/* Contadores Semáforo Amplios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-black text-red-800 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle size={14} /> EPPs Vencidos
            </p>
            <p className="text-3xl font-black text-red-950 dark:text-white">{countPorEstado.Vencido}</p>
            <p className="text-[11px] font-semibold text-red-800/80 dark:text-slate-400">Requieren renovación inmediata</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-600/20 text-red-700 dark:text-red-400 flex items-center justify-center text-xl font-bold border border-red-200 dark:border-red-800/50">
            🔴
          </div>
        </div>

        <div className="card p-5 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock size={14} /> Por Vencer (&le;15 días)
            </p>
            <p className="text-3xl font-black text-amber-950 dark:text-white">{countPorEstado['Por Vencer']}</p>
            <p className="text-[11px] font-semibold text-amber-800/80 dark:text-slate-400">Programar reabastecimiento</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-200 dark:border-amber-800/50">
            🟡
          </div>
        </div>

        <div className="card p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckCircle2 size={14} /> EPPs Vigentes
            </p>
            <p className="text-3xl font-black text-emerald-950 dark:text-white">{countPorEstado.Vigente}</p>
            <p className="text-[11px] font-semibold text-emerald-800/80 dark:text-slate-400">En óptimo estado de vida útil</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xl font-bold border border-emerald-200 dark:border-emerald-800/50">
            🟢
          </div>
        </div>
      </div>

      {/* Barra de Filtros Espaciosa */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            className="input-field input-with-icon text-xs py-2.5"
            placeholder="Buscar por colaborador, DNI o prenda EPP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="input-field w-auto text-xs py-2.5 font-bold"
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="Vencido">🔴 Vencidos</option>
            <option value="Por Vencer">🟡 Por Vencer</option>
            <option value="Vigente">🟢 Vigentes</option>
          </select>

          <select
            className="input-field w-auto text-xs py-2.5"
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
            className="input-field w-auto text-xs py-2.5"
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
        </div>
      </div>

      {/* Tabla Espaciosa con Scroll Horizontal Suave */}
      <div className="card p-0 overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1020px]">
            <thead>
              <tr className="bg-slate-800 text-slate-200 border-b border-slate-700">
                <th className="py-3.5 px-4 font-bold w-36">Condición</th>
                <th className="py-3.5 px-4 font-bold min-w-[210px]">Colaborador / DNI</th>
                <th className="py-3.5 px-4 font-bold min-w-[130px]">Área</th>
                <th className="py-3.5 px-4 font-bold min-w-[220px]">Prenda / EPP Asignado</th>
                <th className="py-3.5 px-4 font-bold min-w-[140px]">Categoría</th>
                <th className="py-3.5 px-4 font-bold text-center w-16">Cant.</th>
                <th className="py-3.5 px-4 font-bold text-center min-w-[120px]">F. Entrega</th>
                <th className="py-3.5 px-4 font-bold text-center min-w-[120px]">F. Renovación</th>
                <th className="py-3.5 px-4 font-bold text-center min-w-[130px]">Días Restantes</th>
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
              ) : detallesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-400 py-12 text-sm">
                    No se encontraron registros de renovación con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                detallesFiltrados.map(d => {
                  const diasRestantes = differenceInDays(new Date(d.fechaRenovacionCalc), new Date())
                  const esVencido = d.estadoRenovacion === 'Vencido'
                  const esPorVencer = d.estadoRenovacion === 'Por Vencer'

                  return (
                    <tr
                      key={d.id}
                      className={`transition ${
                        esVencido
                          ? 'bg-red-50/60 dark:bg-red-950/25 hover:bg-red-100/60 dark:hover:bg-red-950/40'
                          : esPorVencer
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <BadgeEstado estado={d.estadoRenovacion} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-slate-950 dark:text-white leading-snug">
                          {d.entrega.trabajador.apellidos}, {d.entrega.trabajador.nombres}
                        </div>
                        <div className="font-mono text-[11px] text-blue-700 dark:text-cyan-400 font-bold mt-0.5">
                          DNI: {d.entrega.trabajador.dni}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="badge-area">{d.entrega.trabajador.area}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug">
                          {d.articulo.nombre}
                        </div>
                        <div className="font-mono text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                          SKU: {d.articulo.codigo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {d.articulo.categoria}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-sm text-slate-950 dark:text-white">
                        {d.cantidad}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          <Calendar size={12} className="text-blue-600 dark:text-blue-400" />
                          {format(new Date(d.entrega.fechaEntrega), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 font-black text-xs text-slate-950 dark:text-white">
                          <Calendar size={12} className="text-amber-600 dark:text-amber-400" />
                          {format(new Date(d.fechaRenovacionCalc), 'dd/MM/yyyy')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl text-xs font-black font-mono shadow-2xs ${
                            diasRestantes < 0
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-300 border border-red-300 dark:border-red-800'
                              : diasRestantes <= 15
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {diasRestantes < 0
                            ? `-${Math.abs(diasRestantes)}d (Vencido)`
                            : `${diasRestantes} días`}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
