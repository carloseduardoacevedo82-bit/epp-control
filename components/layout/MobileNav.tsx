'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  FolderArchive,
  FileBarChart2,
  Users,
} from 'lucide-react'
import { useRole } from '@/components/auth/RoleContext'

export default function MobileNav() {
  const pathname = usePathname()
  const { role, isSupervisor } = useRole()

  const navItems = [
    { href: '/', label: 'Inicio', icon: LayoutDashboard },
    { href: '/trabajadores', label: 'Personal', icon: Users },
    { href: '/entregas/nueva', label: 'Entrega', icon: PackagePlus, highlight: true },
    { href: '/catalogo', label: 'Stock', icon: Package },
    { href: '/constancias', label: 'Actas', icon: FolderArchive },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] px-1 py-1.5 grid grid-cols-5 items-center safe-area-pb">
      {navItems.map(({ href, label, icon: Icon, highlight }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

        if (highlight) {
          return (
            <Link
              key={href}
              href={href}
              className="relative -top-3.5 flex flex-col items-center justify-center group focus:outline-none col-span-1"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border-2 border-white dark:border-slate-900 transform active:scale-95 transition">
                <Icon size={22} className="text-white" />
              </div>
              <span className="text-[10px] font-black text-blue-700 dark:text-cyan-400 mt-0.5">{label}</span>
            </Link>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition col-span-1 ${
              isActive
                ? 'text-blue-600 dark:text-cyan-400 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 font-semibold'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'} />
            <span className="text-[10px] mt-0.5">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
