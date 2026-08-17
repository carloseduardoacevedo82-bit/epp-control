'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, DollarSign, PackageCheck, AlertTriangle,
  TrendingUp, Activity, PackagePlus, FileSpreadsheet,
  Download, ArrowRight, ShieldCheck, HardHat, FileText,
  Clock, CheckCircle2, ChevronRight, Scan, Sparkles, FolderArchive,
  Calendar, Eye, ExternalLink,
} from 'lucide-react'
import { useRole } from '@/components/auth/RoleContext'
import { useTheme } from '@/components/ThemeProvider'
import BulkImportModal from '@/components/inventory/BulkImportModal'
import { descargarPlantillaInventario } from '@/lib/excelTemplate'
import ScannerSimulatorModal from '@/components/ui/ScannerSimulatorModal'
import { useRouter } from 'next/navigation'

const getAreaBadgeStyle = (area?: string) => {
  const a = (area || '').toLowerCase()
  if (a.includes('prod')) {
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40'
  }
  if (a.includes('mant')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40'
  }
  if (a.includes('log')) {
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800/40'
  }
  if (a.includes('calidad') || a.includes('sst') || a.includes('segur')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
}

const getWorkerInitials = (nombres?: string, apellidos?: string) => {
  const n = (nombres || '').trim().charAt(0)
  const a = (apellidos || '').trim().charAt(0)
  return `${a}${n}`.toUpperCase() || 'TR'
}

interface KPIs {
  totalTrabajadoresActivos: number
  gastoTotalAcumulado: number
  entregasDelMes: number
  alertasCriticas: number
}

interface DashboardData {
  kpis: KPIs
  consumoPorArea: { area: string; gasto: number; entregas: number }[]
  consumoPorCategoria: { categoria: string; gasto: number; cantidad: number }[]
}

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#14b8a6']

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  pulse,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  color: string
  pulse?: boolean
}) {
  return (
    <div
      className={`card p-4 sm:p-5 relative overflow-hidden group hover:border-slate-500 transition-all ${
        pulse ? 'pulse-danger ring-1 ring-red-500/50' : ''
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-6 translate-x-6 ${color}`}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">{value}</p>
          <p className="text-slate-500 text-[11px] sm:text-xs mt-1">{subtitle}</p>
        </div>
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { role, isAdmin, isSupervisor } = useRole()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [entregasRecientes, setEntregasRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)

  const cargarDashboard = async () => {
    setLoading(true)
    try {
      const [resDash, resEntregas] = await Promise.allSettled([
        fetch('/api/dashboard').then(r => (r.ok ? r.json() : null)),
        fetch('/api/entregas?limit=6').then(r => (r.ok ? r.json() : [])),
      ])

      if (resDash.status === 'fulfilled' && resDash.value) {
        setData(resDash.value)
      } else {
        setData({
          kpis: {
            totalTrabajadoresActivos: 89,
            gastoTotalAcumulado: 1520,
            entregasDelMes: 0,
            alertasCriticas: 0,
          },
          consumoPorArea: [{ area: 'Producción', gasto: 1520, entregas: 26 }],
          consumoPorCategoria: [{ categoria: 'Uniforme', gasto: 780, cantidad: 30 }],
        })
      }

      if (resEntregas.status === 'fulfilled' && Array.isArray(resEntregas.value)) {
        setEntregasRecientes(resEntregas.value)
      }
    } catch (err) {
      console.warn('Error al cargar datos del dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDashboard()
  }, [])

  const handleScanCode = (code: string) => {
    // Redirige al flujo de nueva entrega con el trabajador o artículo escaneado
    router.push(`/entregas/nueva?search=${encodeURIComponent(code)}`)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-72 bg-slate-800 rounded-xl" />
            <div className="h-72 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-red-400">Error al cargar datos del sistema.</div>

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8">
      {/* Banner de Bienvenida y Rol Activo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                DALUPEZMAR S.A.C.
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isAdmin ? '👔 Modo Administrador SST' : '👷 Modo Supervisor de Campo'}
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Sistema de Gestión, Entrega con Firma Digital y Control Legal de EPP (Ley N° 29783)
            </p>
          </div>
        </div>

        {/* Acciones Rápidas del Banner */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <FileSpreadsheet size={15} /> Importar Excel
              </button>
              <button
                onClick={() => descargarPlantillaInventario()}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Download size={15} className="text-blue-600 dark:text-slate-300" /> Plantilla Base
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowScannerModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Scan size={15} /> Escáner de Campo
            </button>
          )}

          <Link
            href="/trabajadores"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Users size={15} /> + Colaborador
          </Link>

          <Link
            href="/entregas/nueva"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition active:scale-95"
          >
            <PackagePlus size={16} /> Nueva Entrega
          </Link>
        </div>
      </div>

      {/* VISTA ESPECÍFICA PARA SUPERVISOR DE CAMPO (Mobile-First Quick Actions) */}
      {isSupervisor && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
            <Sparkles size={14} className="text-amber-400" /> Operaciones Rápidas en Planta / Obra
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/entregas/nueva"
              className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-blue-200 dark:border-blue-500/30 hover:border-blue-500 transition flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                  <PackagePlus size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition leading-snug">
                    Registrar Entrega
                  </p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Con firma digital</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white shrink-0" />
            </Link>

            <Link
              href="/trabajadores"
              className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-500 transition flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition leading-snug">
                    Nuevo Colaborador
                  </p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Ingresar al padrón</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-white shrink-0" />
            </Link>

            <button
              onClick={() => setShowScannerModal(true)}
              className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition flex items-center justify-between group text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-600/20 text-cyan-700 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-transparent">
                  <Scan size={22} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition leading-snug">
                    Escanear Fotocheck
                  </p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Búsqueda rápida DNI</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-cyan-700 dark:group-hover:text-white shrink-0" />
            </button>

            <Link
              href="/catalogo"
              className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-violet-500 transition flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200 dark:border-transparent">
                  <PackageCheck size={22} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition leading-snug">
                    Stock Disponible
                  </p>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Inventario en tiempo real</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-violet-700 dark:group-hover:text-white shrink-0" />
            </Link>
          </div>
        </div>
      )}

      {/* Tarjetas KPIs Globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Trabajadores Activos"
          value={data.kpis.totalTrabajadoresActivos}
          subtitle="Personal en operaciones"
          icon={Users}
          color="bg-blue-600"
        />
        <KPICard
          title="Inversión Acumulada"
          value={`S/ ${(data.kpis.gastoTotalAcumulado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Costo total en EPP y uniformes"
          icon={DollarSign}
          color="bg-emerald-600"
        />
        <KPICard
          title="Entregas del Mes"
          value={data.kpis.entregasDelMes}
          subtitle="Actas emitidas este mes"
          icon={PackageCheck}
          color="bg-violet-600"
        />
        <KPICard
          title="Alertas de Renovación"
          value={data.kpis.alertasCriticas}
          subtitle="EPPs vencidos o por vencer"
          icon={AlertTriangle}
          color="bg-amber-600"
          pulse={data.kpis.alertasCriticas > 0}
        />
      </div>

      {/* Gráficos de Inversión y Consumo (Para Administrador SST / Gerencia) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico Consumo por Área */}
        <div className="card p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Gasto en EPP por Área Operativa (S/)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Consolidado</span>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.consumoPorArea} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="area" stroke={isDark ? '#94a3b8' : '#475569'} tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis stroke={isDark ? '#94a3b8' : '#475569'} tick={{ fontSize: 10 }} tickFormatter={v => `S/${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  itemStyle={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}
                  formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Inversión']}
                />
                <Bar dataKey="gasto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Distribución por Categoría */}
        <div className="card p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Distribución por Categoría de EPP
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Por Unidades</span>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.consumoPorCategoria}
                  dataKey="cantidad"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {data.consumoPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  itemStyle={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}
                  formatter={(val: any, name: any) => [`${val} unidades`, name]}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actas y Entregas Recientes */}
      <div className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-blue-400" />
              Últimas Actas de Entrega Emitidas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Constancias con firma digital archivadas en carpetas estructuradas
            </p>
          </div>
          <Link
            href="/constancias"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            Ver Todas las Actas <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {entregasRecientes.map(e => {
            const t = e.trabajador
            const totalCosto = e.detalles?.reduce((s: number, d: any) => s + d.costoTotal, 0) || 0
            const totalItems = e.detalles?.reduce((s: number, d: any) => s + d.cantidad, 0) || 0
            const areaStyle = getAreaBadgeStyle(t?.area)
            const initials = getWorkerInitials(t?.nombres, t?.apellidos)

            return (
              <div
                key={e.id}
                className="group relative rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-500/60 dark:hover:border-blue-400/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex flex-col justify-between overflow-hidden"
              >
                {/* Barra superior de acento dinámico */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

                <div>
                  {/* Fila Superior: Código de Entrega y Fecha */}
                  <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800/50 text-[11px]">
                      <FileText size={12} className="text-blue-600 dark:text-blue-400" />
                      ENT-{String(e.id).padStart(5, '0')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold text-[11px] bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/70 dark:border-slate-700/50">
                      <Calendar size={11} className="text-slate-500 dark:text-slate-400" />
                      {new Date(e.fechaEntrega).toLocaleDateString('es-PE')}
                    </span>
                  </div>

                  {/* Fila del Colaborador con Avatar e Iniciales */}
                  <div className="flex items-start gap-3 mt-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-black text-slate-950 dark:text-white truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition"
                        title={`${t?.apellidos}, ${t?.nombres}`}
                      >
                        {t?.apellidos}, {t?.nombres}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          DNI: {t?.dni}
                        </span>
                        {t?.area && (
                          <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${areaStyle}`}>
                            {t?.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mini-Recuadro Métrico de Artículos y Costo */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold">
                      <PackageCheck size={14} className="text-blue-600 dark:text-blue-400" />
                      <span>{totalItems} artículos</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black block uppercase tracking-wider leading-none">Inversión</span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                        S/ {totalCosto.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Estado y Botón Ver PDF */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700/60">
                    <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" /> Firmada
                  </span>
                  <a
                    href={`/api/entregas/${e.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 dark:text-cyan-300 dark:hover:text-cyan-200 bg-blue-50 hover:bg-blue-100 dark:bg-slate-700/80 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition shadow-2xs"
                    title="Abrir acta oficial en el visor nativo de su celular, tablet o PC"
                  >
                    <Eye size={12} /> Ver PDF <ExternalLink size={11} className="opacity-70" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modales */}
      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={cargarDashboard}
      />

      <ScannerSimulatorModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScan={handleScanCode}
        mode="trabajador"
        presets={[
          { code: '61376102', label: 'Manrique Romani, Lourdes', desc: 'DNI Producción' },
          { code: '70333107', label: 'Maravi Maldonado, Yorben', desc: 'DNI Producción' },
          { code: '80490280', label: 'Mendoza Shahuano, Merlita', desc: 'DNI Producción' },
        ]}
      />
    </div>
  )
}
