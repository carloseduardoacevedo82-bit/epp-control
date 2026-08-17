'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all shadow-sm"
        title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        aria-label="Cambiar tema"
      >
        {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-blue-600" />}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-xs font-semibold group cursor-pointer shadow-sm border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300 theme-toggle-btn"
      title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-600/20 text-blue-600'
        }`}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </div>
        <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/60 text-slate-400">
        {isDark ? '🌙 ON' : '☀️ ON'}
      </span>
    </button>
  )
}
