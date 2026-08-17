'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  HardHat,
  Wifi,
  WifiOff,
  Maximize,
  Minimize,
  PackagePlus,
  UserCheck,
  Building2,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react'
import { useRole } from '@/components/auth/RoleContext'
import BulkImportModal from '@/components/inventory/BulkImportModal'
import ThemeToggle from '@/components/ThemeToggle'

export default function Header() {
  const { role, setRole, toggleRole, isAdmin, user } = useRole()
  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
      setIsFullscreen(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between transition-colors">
        {/* Lado Izquierdo: Logo en Móvil & Título */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-xs text-white leading-tight">DALUPEZMAR</p>
              <p className="text-[9px] text-slate-400">EPP Control</p>
            </div>
          </div>

          {/* Indicador de Conectividad PWA */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 text-[11px] font-bold">
            {isOnline ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-800 dark:text-slate-200">En Línea</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-amber-800 dark:text-amber-300 font-bold">Modo Offline Local</span>
              </>
            )}
          </div>
        </div>

        {/* Lado Derecho: Switcher de Roles (RBAC), Acciones Rápidas & Pantalla Completa */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón Carga Masiva (Solo visible para Admin o en pantallas grandes) */}
          {isAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <FileSpreadsheet size={15} /> Cargar Excel
            </button>
          )}

          {/* Switcher de Rol Interactivo */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setRole('ADMIN')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                role === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Modo Administrador SST: Control global, costos, usuarios y Excel"
            >
              <span>👔</span>
              <span className="hidden sm:inline">Admin SST</span>
            </button>
            <button
              onClick={() => setRole('SUPERVISOR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                role === 'SUPERVISOR'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Modo Supervisor de Campo: Entregas rápidas, escaneo y firmas"
            >
              <span>👷</span>
              <span className="hidden sm:inline">Supervisor Campo</span>
            </button>
          </div>

          {/* Theme Switcher Compacto */}
          <ThemeToggle compact={true} />

          {/* Botón Pantalla Completa Táctil */}
          <button
            onClick={toggleFullscreenMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition"
            title="Pantalla Completa en Dispositivo Móvil"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {/* Botón Acción Rápida: Entrega */}
          <Link
            href="/entregas/nueva"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition transform active:scale-95"
          >
            <PackagePlus size={15} /> Nueva Entrega
          </Link>
        </div>
      </header>

      {/* Modal de Importación */}
      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          if (typeof window !== 'undefined') window.location.reload()
        }}
      />
    </>
  )
}
