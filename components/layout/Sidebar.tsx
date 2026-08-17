'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  PackagePlus,
  RefreshCw,
  FileBarChart2,
  HardHat,
  ChevronRight,
  FolderArchive,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import { useRole } from '@/components/auth/RoleContext'
import ThemeToggle from '@/components/ThemeToggle'
import BulkImportModal from '@/components/inventory/BulkImportModal'
import { descargarPlantillaInventario } from '@/lib/excelTemplate'

export default function Sidebar() {
  const pathname = usePathname()
  const { role, isAdmin, user } = useRole()
  const [showImportModal, setShowImportModal] = useState(false)

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: 'KPIs' },
    { href: '/entregas/nueva', label: 'Nueva Entrega', icon: PackagePlus, highlight: true },
    { href: '/catalogo', label: 'Catálogo EPP', icon: Package },
    { href: '/trabajadores', label: 'Trabajadores', icon: Users, adminOnly: false },
    { href: '/renovaciones', label: 'Renovaciones', icon: RefreshCw },
    { href: '/constancias', label: 'Actas Digitales', icon: FolderArchive, badge: 'PDF' },
    { href: '/reportes', label: 'Reportes y Cierres', icon: FileBarChart2, badge: 'Excel' },
  ]

  return (
    <>
      <aside className="sidebar-container hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-slate-800 flex-col z-40 bg-slate-900/95 backdrop-blur-md transition-colors">
        {/* Logo Institucional */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm leading-tight text-white tracking-wide">
                DALUPEZMAR
              </p>
              <p className="text-[11px] text-slate-400 font-medium">S.A.C. — EPP & SST</p>
            </div>
          </div>

          {/* Badge del Rol Activo */}
          <div className="mt-3 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{isAdmin ? '👔' : '👷'}</span>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-slate-200 leading-none">
                  {isAdmin ? 'Administrador SST' : 'Supervisor Campo'}
                </p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{user.nombre.split(' ')[0]}</p>
              </div>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                isAdmin
                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
              }`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge, highlight }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-xs font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : highlight
                    ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-transparent'
                    : 'text-slate-800 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-800 text-white border border-blue-400/40'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60'
                    }`}
                  >
                    {badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white" />}
              </Link>
            )
          })}

          {/* Acciones Rápidas para Admin SST */}
          {isAdmin && (
            <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <p className="px-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Operaciones Excel
              </p>
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition text-left"
              >
                <FileSpreadsheet size={16} className="text-emerald-600" /> Cargar Inventario Excel
              </button>
              <button
                onClick={() => descargarPlantillaInventario()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition text-left"
              >
                <Download size={16} className="text-blue-600 dark:text-slate-400" /> Descargar Plantilla
              </button>
            </div>
          )}
        </nav>

        {/* Footer & Theme Switcher */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <ThemeToggle />
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-mono">RUC: 20615714128</p>
            <p className="text-[9px] text-slate-600">DALUPEZMAR S.A.C. © 2026</p>
          </div>
        </div>
      </aside>

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
