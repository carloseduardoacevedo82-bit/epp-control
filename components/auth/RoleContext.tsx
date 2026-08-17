'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { RolUsuario, UsuarioSession } from '@/lib/types'

interface RoleContextType {
  role: RolUsuario
  setRole: (role: RolUsuario) => void
  user: UsuarioSession
  isAdmin: boolean
  isSupervisor: boolean
  canImportInventory: boolean
  canGenerateConsolidatedReport: boolean
  canManageWorkers: boolean
  canManageCatalog: boolean
  toggleRole: () => void
}

const defaultAdminUser: UsuarioSession = {
  id: 1,
  email: 'gerencia.ssoma@dalupezmar.com',
  nombre: 'Ing. Carlos Mendoza (SST)',
  rol: 'ADMIN',
  cargo: 'Jefe de Seguridad y Salud (SSOMA)',
}

const defaultSupervisorUser: UsuarioSession = {
  id: 2,
  email: 'supervisor.planta@dalupezmar.com',
  nombre: 'Marcos Rivas (Campo)',
  rol: 'SUPERVISOR',
  cargo: 'Supervisor Operativo de Turno',
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<RolUsuario>('ADMIN')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedRole = localStorage.getItem('epp_active_role') as RolUsuario
    if (savedRole === 'ADMIN' || savedRole === 'SUPERVISOR') {
      setRoleState(savedRole)
    }
    setMounted(true)
  }, [])

  const setRole = (newRole: RolUsuario) => {
    setRoleState(newRole)
    if (typeof window !== 'undefined') {
      localStorage.setItem('epp_active_role', newRole)
    }
  }

  const toggleRole = () => {
    const newRole: RolUsuario = role === 'ADMIN' ? 'SUPERVISOR' : 'ADMIN'
    setRole(newRole)
  }

  const user = role === 'ADMIN' ? defaultAdminUser : defaultSupervisorUser
  const isAdmin = role === 'ADMIN'
  const isSupervisor = role === 'SUPERVISOR'

  const value: RoleContextType = {
    role,
    setRole,
    user,
    isAdmin,
    isSupervisor,
    canImportInventory: isAdmin,
    canGenerateConsolidatedReport: isAdmin,
    canManageWorkers: isAdmin,
    canManageCatalog: true, // both can consult/manage stock
    toggleRole,
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole debe usarse dentro de un RoleProvider')
  }
  return context
}
