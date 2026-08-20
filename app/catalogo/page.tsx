'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Filter,
  Layers,
  TrendingUp,
  Minus,
  RotateCcw,
  Footprints,
  Shirt,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Boxes,
} from 'lucide-react'
import type { ArticuloEPP } from '@/lib/types'
import { CATEGORIAS_EPP, TALLAS_CALZADO, TALLAS_ROPA, TALLAS_PANTALON } from '@/lib/types'
import { useRole } from '@/components/auth/RoleContext'
import BulkImportModal from '@/components/inventory/BulkImportModal'
import { descargarPlantillaInventario } from '@/lib/excelTemplate'

type ModuloActivo = 'todos' | 'calzado' | 'ropa' | 'accesorios'

export const DESCRIPCIONES_POR_CATEGORIA: Record<string, Array<{ nombre: string; vidaUtil: number; costoAprox: number }>> = {
  'Protección Cabeza': [
    { nombre: 'Casco de seguridad Tipo 1 Clase E', vidaUtil: 365, costoAprox: 35.0 },
    { nombre: 'Casco dieléctrico blanco con barbiquejo', vidaUtil: 365, costoAprox: 45.0 },
    { nombre: 'Toca fantasma', vidaUtil: 180, costoAprox: 15.0 },
    { nombre: 'Gorro con solapa para sol / legionario', vidaUtil: 180, costoAprox: 13.0 },
    { nombre: 'Vincha para cabello', vidaUtil: 180, costoAprox: 5.0 },
    { nombre: 'Pasamontañas térmico', vidaUtil: 365, costoAprox: 18.0 },
    { nombre: 'Barbiquejo de 3 puntos con mentonera', vidaUtil: 180, costoAprox: 8.5 },
  ],
  'Protección Visual': [
    { nombre: 'Lentes de seguridad transparentes anti-impacto', vidaUtil: 180, costoAprox: 18.0 },
    { nombre: 'Lentes de seguridad oscuros con protección UV', vidaUtil: 180, costoAprox: 18.0 },
    { nombre: 'Lentes antiempañantes de seguridad', vidaUtil: 180, costoAprox: 25.0 },
    { nombre: 'Protector facial transparente con cabezal', vidaUtil: 180, costoAprox: 40.0 },
    { nombre: 'Sobrelentes de seguridad para lentes de medida', vidaUtil: 180, costoAprox: 22.0 },
  ],
  'Protección Auditiva': [
    { nombre: 'Tapones auditivos de silicona reutilizables', vidaUtil: 30, costoAprox: 2.0 },
    { nombre: 'Tapones auditivos desechables de espuma', vidaUtil: 15, costoAprox: 1.5 },
    { nombre: 'Orejeras de seguridad tipo copa para casco', vidaUtil: 365, costoAprox: 48.0 },
    { nombre: 'Orejeras de diadema ajustable', vidaUtil: 365, costoAprox: 42.0 },
  ],
  'Protección Manos': [
    { nombre: 'Guantes de lana con puntos de PVC', vidaUtil: 90, costoAprox: 15.0 },
    { nombre: 'Guantes de alta temperatura naranjados', vidaUtil: 90, costoAprox: 20.0 },
    { nombre: 'Guantes de corte nivel 5 anticorte', vidaUtil: 90, costoAprox: 22.0 },
    { nombre: 'Guantes térmicos para frío', vidaUtil: 180, costoAprox: 28.0 },
    { nombre: 'Guantes de nitrilo resistente a químicos', vidaUtil: 60, costoAprox: 12.0 },
    { nombre: 'Guantes de badana para operador', vidaUtil: 90, costoAprox: 16.5 },
    { nombre: 'Guantes de cuero reforzado para soldador', vidaUtil: 180, costoAprox: 32.0 },
  ],
  'Calzado': [
    { nombre: 'Botas caña largas de goma punta de acero', vidaUtil: 180, costoAprox: 55.0 },
    { nombre: 'Botas de seguridad dieléctricas con punta composite', vidaUtil: 365, costoAprox: 70.0 },
    { nombre: 'Botines de seguridad de cuero punta de acero', vidaUtil: 365, costoAprox: 95.0 },
    { nombre: 'Botas térmicas antideslizantes para cámara', vidaUtil: 365, costoAprox: 90.0 },
    { nombre: 'Zapatos de seguridad industrial caña baja', vidaUtil: 365, costoAprox: 65.0 },
  ],
  'Protección Respiratoria': [
    { nombre: 'Respirador semimascarilla de silicona doble vía', vidaUtil: 90, costoAprox: 25.0 },
    { nombre: 'Filtros para partículas y polvo P100', vidaUtil: 60, costoAprox: 35.0 },
    { nombre: 'Cartuchos para vapores orgánicos y gases ácidos', vidaUtil: 60, costoAprox: 45.0 },
    { nombre: 'Mascarilla descartable N95 / KN95', vidaUtil: 15, costoAprox: 4.5 },
  ],
  'Protección Alturas': [
    { nombre: 'Arnés de seguridad de cuerpo entero 4 anillos', vidaUtil: 730, costoAprox: 55.0 },
    { nombre: 'Línea de vida con absorbedor de impacto doble gancho', vidaUtil: 730, costoAprox: 75.0 },
    { nombre: 'Línea de posicionamiento regulable', vidaUtil: 730, costoAprox: 45.0 },
    { nombre: 'Conector de anclaje tipo faja (Tie-off)', vidaUtil: 730, costoAprox: 30.0 },
  ],
  'Protección Climática': [
    { nombre: 'Poncho para lluvia impermeable con capucha', vidaUtil: 365, costoAprox: 32.0 },
    { nombre: 'Casaca cortaviento impermeable reflectiva', vidaUtil: 365, costoAprox: 55.0 },
    { nombre: 'Capotín impermeable de PVC pesado', vidaUtil: 365, costoAprox: 40.0 },
  ],
  'Uniforme': [
    { nombre: 'Polo manga corta algodón con cuello camisero', vidaUtil: 365, costoAprox: 25.0 },
    { nombre: 'Polo manga larga con cintas reflectivas', vidaUtil: 365, costoAprox: 28.0 },
    { nombre: 'Suéter manga larga cuello redondo', vidaUtil: 180, costoAprox: 30.0 },
    { nombre: 'Pantalón largo drill con cinta reflectiva', vidaUtil: 180, costoAprox: 30.0 },
    { nombre: 'Pantalón térmico impermeable para congelados', vidaUtil: 365, costoAprox: 65.0 },
    { nombre: 'Chaqueta ignífuga antiestática', vidaUtil: 365, costoAprox: 60.0 },
    { nombre: 'Casaca térmica para cámara de refrigeración', vidaUtil: 365, costoAprox: 85.0 },
    { nombre: 'Chaleco térmico reflectivo tipo brigadista', vidaUtil: 365, costoAprox: 45.0 },
    { nombre: 'Medias gruesas de trabajo', vidaUtil: 180, costoAprox: 10.0 },
    { nombre: 'Medias térmicas para baja temperatura', vidaUtil: 180, costoAprox: 15.0 },
  ],
  'Herramientas / Accesorios': [
    { nombre: 'Cinturón porta herramientas de cuero reforzado', vidaUtil: 730, costoAprox: 30.0 },
    { nombre: 'Linterna frontal LED recargable para casco', vidaUtil: 365, costoAprox: 25.0 },
    { nombre: 'Silbato de emergencia con cordón', vidaUtil: 730, costoAprox: 5.0 },
    { nombre: 'Candado de bloqueo y etiquetado LOTO', vidaUtil: 730, costoAprox: 35.0 },
  ],
}

const emptyForm = {
  codigo: '',
  nombre: '',
  categoria: CATEGORIAS_EPP[0] as string,
  talla: '',
  costoUnitario: '',
  vidaUtilDias: '365',
  stockActual: '0',
  stockMinimo: '5',
  marcaFabricante: '3M / Estándar',
  activo: true,
}

// Normaliza el nombre del modelo para agrupar diferentes tallas de un mismo producto
function normalizarNombreModelo(nombre: string): string {
  return nombre
    .replace(/\s+(T\d+|TALLA\s*\d+|TALLA\s*[A-Z]+|T-[A-Z0-9]+|\b\d{2}\b|\b(XS|S|M|L|XL|XXL|XXXL|XXXXL)\b)$/i, '')
    .trim()
}

export default function CatalogoPage() {
  const { isAdmin } = useRole()
  const [articulos, setArticulos] = useState<ArticuloEPP[]>([])
  const [loading, setLoading] = useState(true)
  const [moduloActivo, setModuloActivo] = useState<ModuloActivo>('todos')
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState<'todos' | 'critico' | 'ok'>('todos')
  const [filtroTallaRapida, setFiltroTallaRapida] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editando, setEditando] = useState<ArticuloEPP | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Modal de Ajuste / Carga de Stock Físico Real
  const [showStockModal, setShowStockModal] = useState(false)
  const [articuloStockAjuste, setArticuloStockAjuste] = useState<ArticuloEPP | null>(null)
  const [cantidadAjuste, setCantidadAjuste] = useState<string>('0')
  const [modoAjuste, setModoAjuste] = useState<'sumar' | 'fijar'>('sumar')
  const [guardandoStock, setGuardandoStock] = useState(false)
  const [errorStock, setErrorStock] = useState('')

  // Modal de Activación Rápida de Nueva Talla para un Modelo
  const [showActivarTallaModal, setShowActivarTallaModal] = useState(false)
  const [modeloBaseActivar, setModeloBaseActivar] = useState<{
    nombreBase: string
    categoria: string
    marca: string
    costo: number
    vidaUtil: number
    codigoPrefijo: string
    tallaDeseada: string
  } | null>(null)
  const [stockInicialNuevaTalla, setStockInicialNuevaTalla] = useState<string>('10')
  const [stockMinimoNuevaTalla, setStockMinimoNuevaTalla] = useState<string>('5')
  const [activandoTalla, setActivandoTalla] = useState(false)
  const [errorActivarTalla, setErrorActivarTalla] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/articulos`)
    const data = await res.json()
    setArticulos(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Filtrado de artículos según módulo y búsqueda
  const articulosFiltrados = useMemo(() => {
    return articulos.filter(a => {
      // Filtro por módulo
      if (moduloActivo === 'calzado' && a.categoria !== 'Calzado') return false
      if (moduloActivo === 'ropa' && a.categoria !== 'Uniforme') return false
      if (moduloActivo === 'accesorios' && (a.categoria === 'Calzado' || a.categoria === 'Uniforme')) return false

      // Filtro por categoría en vista general
      if (moduloActivo === 'todos' && filtroCategoria && a.categoria !== filtroCategoria) return false

      // Filtro por stock
      if (filtroStock === 'critico' && a.stockActual > a.stockMinimo) return false
      if (filtroStock === 'ok' && a.stockActual <= a.stockMinimo) return false

      // Filtro rápido por talla seleccionada
      if (filtroTallaRapida && a.talla !== filtroTallaRapida) return false

      // Búsqueda textual
      if (search) {
        const q = search.toLowerCase()
        const match =
          a.nombre.toLowerCase().includes(q) ||
          a.codigo.toLowerCase().includes(q) ||
          (a.talla && a.talla.toLowerCase().includes(q)) ||
          (a.marcaFabricante && a.marcaFabricante.toLowerCase().includes(q)) ||
          a.categoria.toLowerCase().includes(q)
        if (!match) return false
      }

      return true
    })
  }, [articulos, moduloActivo, filtroCategoria, filtroStock, filtroTallaRapida, search])

  // ── AGRUPACIÓN POR MODELOS PARA EL MÓDULO DE CALZADOS (35 A 47) ───────────────
  const modelosCalzado = useMemo(() => {
    const articulosCalzado = articulos.filter(a => a.categoria === 'Calzado')
    const mapa = new Map<
      string,
      {
        nombreBase: string
        marca: string
        costoPromedio: number
        vidaUtil: number
        codigoBase: string
        articulosPorTalla: Map<string, ArticuloEPP>
        stockTotal: number
      }
    >()

    for (const art of articulosCalzado) {
      const nombreBase = normalizarNombreModelo(art.nombre)
      if (!mapa.has(nombreBase)) {
        mapa.set(nombreBase, {
          nombreBase,
          marca: art.marcaFabricante || 'Estándar',
          costoPromedio: art.costoUnitario,
          vidaUtil: art.vidaUtilDias,
          codigoBase: art.codigo.split('-T')[0].replace(/-\d+$/, ''),
          articulosPorTalla: new Map<string, ArticuloEPP>(),
          stockTotal: 0,
        })
      }
      const item = mapa.get(nombreBase)!
      const tallaKey = (art.talla || 'Único').trim()
      item.articulosPorTalla.set(tallaKey, art)
      item.stockTotal += art.stockActual
    }

    return Array.from(mapa.values())
  }, [articulos])

  // ── AGRUPACIÓN POR MODELOS PARA EL MÓDULO DE ROPAS Y UNIFORMES ──────────────
  const modelosRopa = useMemo(() => {
    const articulosRopa = articulos.filter(a => a.categoria === 'Uniforme')
    const mapa = new Map<
      string,
      {
        nombreBase: string
        marca: string
        costoPromedio: number
        vidaUtil: number
        codigoBase: string
        articulosPorTalla: Map<string, ArticuloEPP>
        stockTotal: number
      }
    >()

    for (const art of articulosRopa) {
      const nombreBase = normalizarNombreModelo(art.nombre)
      if (!mapa.has(nombreBase)) {
        mapa.set(nombreBase, {
          nombreBase,
          marca: art.marcaFabricante || 'Estándar',
          costoPromedio: art.costoUnitario,
          vidaUtil: art.vidaUtilDias,
          codigoBase: art.codigo.split('-T')[0].replace(/-\d+$/, ''),
          articulosPorTalla: new Map<string, ArticuloEPP>(),
          stockTotal: 0,
        })
      }
      const item = mapa.get(nombreBase)!
      const tallaKey = (art.talla || 'Único').trim()
      item.articulosPorTalla.set(tallaKey, art)
      item.stockTotal += art.stockActual
    }

    return Array.from(mapa.values())
  }, [articulos])

  // Métricas rápidas por módulo
  const metricasCalzado = useMemo(() => {
    const calzados = articulos.filter(a => a.categoria === 'Calzado')
    const totalPares = calzados.reduce((s, a) => s + a.stockActual, 0)
    const criticos = calzados.filter(a => a.stockActual <= a.stockMinimo).length
    const valorizacion = calzados.reduce((s, a) => s + a.stockActual * a.costoUnitario, 0)
    return { totalPares, criticos, modelos: modelosCalzado.length, valorizacion }
  }, [articulos, modelosCalzado])

  const metricasRopa = useMemo(() => {
    const ropas = articulos.filter(a => a.categoria === 'Uniforme')
    const totalPrendas = ropas.reduce((s, a) => s + a.stockActual, 0)
    const criticos = ropas.filter(a => a.stockActual <= a.stockMinimo).length
    const valorizacion = ropas.reduce((s, a) => s + a.stockActual * a.costoUnitario, 0)
    return { totalPrendas, criticos, modelos: modelosRopa.length, valorizacion }
  }, [articulos, modelosRopa])

  const abrirNuevo = (categoriaDefault?: string) => {
    setEditando(null)
    setForm({
      ...emptyForm,
      categoria: categoriaDefault || (moduloActivo === 'calzado' ? 'Calzado' : moduloActivo === 'ropa' ? 'Uniforme' : CATEGORIAS_EPP[0]),
    })
    setError('')
    setShowModal(true)
  }

  const abrirEditar = (a: ArticuloEPP) => {
    setEditando(a)
    setForm({
      codigo: a.codigo,
      nombre: a.nombre,
      categoria: a.categoria,
      talla: a.talla ?? '',
      costoUnitario: String(a.costoUnitario),
      vidaUtilDias: String(a.vidaUtilDias),
      stockActual: String(a.stockActual),
      stockMinimo: String(a.stockMinimo),
      marcaFabricante: a.marcaFabricante || 'Estándar',
      activo: a.activo,
    })
    setError('')
    setShowModal(true)
  }

  const abrirAjusteStock = (a: ArticuloEPP) => {
    setArticuloStockAjuste(a)
    setCantidadAjuste('0')
    setModoAjuste('sumar')
    setErrorStock('')
    setShowStockModal(true)
  }

  const abrirActivarTalla = (modelo: any, tallaDeseada: string) => {
    setModeloBaseActivar({
      nombreBase: modelo.nombreBase,
      categoria: modelo.nombreBase.toLowerCase().includes('pantalón') || modelo.nombreBase.toLowerCase().includes('polo') || modelo.nombreBase.toLowerCase().includes('suéter') || modelo.nombreBase.toLowerCase().includes('casaca') || modelo.nombreBase.toLowerCase().includes('chaleco') ? 'Uniforme' : 'Calzado',
      marca: modelo.marca,
      costo: modelo.costoPromedio,
      vidaUtil: modelo.vidaUtil,
      codigoPrefijo: modelo.codigoBase,
      tallaDeseada,
    })
    setStockInicialNuevaTalla('10')
    setStockMinimoNuevaTalla('5')
    setErrorActivarTalla('')
    setShowActivarTallaModal(true)
  }

  const guardarActivacionTalla = async () => {
    if (!modeloBaseActivar) return
    const stockInit = parseInt(stockInicialNuevaTalla, 10) || 0
    const stockMin = parseInt(stockMinimoNuevaTalla, 10) || 5

    // Generar SKU único para la nueva talla
    const nuevoCodigo = `${modeloBaseActivar.codigoPrefijo}-T${modeloBaseActivar.tallaDeseada}`.toUpperCase()
    const nuevoNombre = `${modeloBaseActivar.nombreBase} Talla ${modeloBaseActivar.tallaDeseada}`

    setActivandoTalla(true)
    setErrorActivarTalla('')
    try {
      const res = await fetch('/api/articulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: nuevoCodigo,
          nombre: nuevoNombre,
          categoria: modeloBaseActivar.categoria,
          talla: modeloBaseActivar.tallaDeseada,
          costoUnitario: modeloBaseActivar.costo,
          vidaUtilDias: modeloBaseActivar.vidaUtil,
          stockActual: stockInit,
          stockMinimo: stockMin,
          marcaFabricante: modeloBaseActivar.marca,
          activo: true,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setErrorActivarTalla(d.error || 'Error al habilitar la talla')
        return
      }

      setShowActivarTallaModal(false)
      cargar()
    } catch (err: any) {
      setErrorActivarTalla(err.message || 'Error de conexión')
    } finally {
      setActivandoTalla(false)
    }
  }

  const guardarAjusteStock = async () => {
    if (!articuloStockAjuste) return
    const cantNum = parseInt(cantidadAjuste, 10)
    if (isNaN(cantNum)) {
      setErrorStock('Ingrese una cantidad numérica válida')
      return
    }

    let nuevoStock = articuloStockAjuste.stockActual
    if (modoAjuste === 'sumar') {
      nuevoStock += cantNum
    } else {
      nuevoStock = cantNum
    }

    if (nuevoStock < 0) {
      setErrorStock('El stock final no puede ser negativo')
      return
    }

    setGuardandoStock(true)
    setErrorStock('')
    try {
      const res = await fetch(`/api/articulos/${articuloStockAjuste.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockActual: nuevoStock,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setErrorStock(d.error || 'Error al actualizar inventario')
        return
      }

      setShowStockModal(false)
      cargar()
    } catch (err: any) {
      setErrorStock(err.message || 'Error de conexión')
    } finally {
      setGuardandoStock(false)
    }
  }

  const guardar = async () => {
    if (!form.codigo || !form.nombre || !form.costoUnitario) {
      setError('Complete los campos obligatorios (*)')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        talla: form.talla?.trim() || null,
        costoUnitario: parseFloat(form.costoUnitario) || 0,
        vidaUtilDias: parseInt(form.vidaUtilDias, 10) || 365,
        stockActual: parseInt(form.stockActual, 10) || 0,
        stockMinimo: parseInt(form.stockMinimo, 10) || 5,
        marcaFabricante: form.marcaFabricante?.trim() || 'Estándar',
        activo: form.activo,
      }
      const url = editando ? `/api/articulos/${editando.id}` : '/api/articulos'
      const method = editando ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const getOpcionesTallas = (cat: string) => {
    if (cat === 'Calzado') return [...TALLAS_CALZADO]
    if (cat === 'Uniforme') return [...TALLAS_ROPA, '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', 'Talla Única']
    return ['Talla Única', 'S', 'M', 'L', 'XL', 'Estándar']
  }

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── CABECERA Y ACCIONES PRINCIPALES ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
              Control de Stock e Inventario EPP
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-semibold">
              Gestión modular de existencias, catalogación de tallas y reabastecimiento DALUPEZMAR S.A.C.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <FileSpreadsheet size={15} /> Carga Masiva Excel
              </button>
              <button
                onClick={() => descargarPlantillaInventario()}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Download size={14} className="text-blue-600 dark:text-slate-300" /> Plantilla
              </button>
            </>
          )}
          <button onClick={() => abrirNuevo()} className="btn-primary text-xs shadow-md shadow-blue-500/20">
            <Plus size={15} /> Nuevo Artículo
          </button>
        </div>
      </div>

      {/* ── SELECTOR DE MÓDULOS INDEPENDIENTES POR TALLAS ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-inner">
        <button
          onClick={() => {
            setModuloActivo('todos')
            setFiltroTallaRapida('')
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black transition-all ${
            moduloActivo === 'todos'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-slate-700'
              : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <Boxes size={16} />
          <span>Inventario Global ({articulos.length})</span>
        </button>

        <button
          onClick={() => {
            setModuloActivo('calzado')
            setFiltroTallaRapida('')
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black transition-all ${
            moduloActivo === 'calzado'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
              : 'text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white'
          }`}
        >
          <Footprints size={16} />
          <span>👟 Calzados por Tallas (35-47)</span>
        </button>

        <button
          onClick={() => {
            setModuloActivo('ropa')
            setFiltroTallaRapida('')
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black transition-all ${
            moduloActivo === 'ropa'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/40'
              : 'text-slate-700 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white'
          }`}
        >
          <Shirt size={16} />
          <span>👕 Ropas y Uniformes (S-4XL)</span>
        </button>

        <button
          onClick={() => {
            setModuloActivo('accesorios')
            setFiltroTallaRapida('')
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-black transition-all ${
            moduloActivo === 'accesorios'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25 ring-2 ring-teal-400/40'
              : 'text-slate-700 dark:text-slate-400 hover:text-teal-600 dark:hover:text-white'
          }`}
        >
          <ShieldCheck size={16} />
          <span>🛡️ Implementos y Accesorios</span>
        </button>
      </div>

      {/* ── CONTENIDO DINÁMICO SEGÚN EL MÓDULO ACTIVO ───────────────────────── */}

      {/* 1. 👟 MÓDULO INDEPENDIENTE: CONTROL DE CALZADOS POR TALLAS (35 A 47) */}
      {moduloActivo === 'calzado' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Tarjetas KPIs Calzado */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4 bg-gradient-to-br from-blue-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-blue-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Pares en Almacén</p>
              <p className="text-2xl font-black text-blue-700 dark:text-cyan-400 mt-1">
                {metricasCalzado.totalPares} <span className="text-xs font-medium text-slate-500">pares</span>
              </p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-indigo-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-indigo-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Modelos Registrados</p>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                {metricasCalzado.modelos} <span className="text-xs font-medium text-slate-500">modelos</span>
              </p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-red-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-red-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tallas Críticas / Reponer</p>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                {metricasCalzado.criticos} <span className="text-xs font-medium text-slate-500">tallas</span>
              </p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-emerald-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-emerald-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Valorización Calzado</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                S/ {metricasCalzado.valorizacion.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Selector Rápido de Talla de Calzado (35 a 47) */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Footprints className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <span className="text-xs font-black text-slate-900 dark:text-white">Filtrar por Número de Calzado:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFiltroTallaRapida('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filtroTallaRapida === ''
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todas (35-47)
              </button>
              {TALLAS_CALZADO.map(t => (
                <button
                  key={t}
                  onClick={() => setFiltroTallaRapida(filtroTallaRapida === t ? '' : t)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${
                    filtroTallaRapida === t
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* MATRIZ DE MODELOS DE CALZADO CON DESGLOSE POR TALLAS (35 A 47) */}
          <div className="space-y-4">
            {modelosCalzado.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 text-sm">
                No hay calzados registrados en el inventario. Pulsa &quot;Nuevo Artículo&quot; para registrar un modelo de bota o calzado.
              </div>
            ) : (
              modelosCalzado.map(mod => {
                return (
                  <div
                    key={mod.nombreBase}
                    className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-sm hover:shadow-md transition space-y-4"
                  >
                    {/* Encabezado del Modelo de Calzado */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                            {mod.codigoBase}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Marca: <strong className="text-slate-800 dark:text-slate-200">{mod.marca}</strong>
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-950 dark:text-white mt-1">
                          {mod.nombreBase}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Stock Total Acumulado</p>
                          <p className="text-lg font-black text-blue-700 dark:text-cyan-400">
                            {mod.stockTotal} <span className="text-xs">pares</span>
                          </p>
                        </div>
                        <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-700">
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Costo Unit.</p>
                          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                            S/ {mod.costoPromedio.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MATRIZ HORIZONTAL DE TALLAS 35 A 47 */}
                    <div>
                      <p className="text-xs font-black text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between">
                        <span>Desglose de Stock por Tallas (35 a 47):</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Haz clic en cualquier talla para ajustar o cargar stock físico
                        </span>
                      </p>

                      <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-13 gap-2">
                        {TALLAS_CALZADO.map(talla => {
                          const artTalla = mod.articulosPorTalla.get(talla)
                          const existe = !!artTalla
                          const esCritico = existe && artTalla.stockActual <= artTalla.stockMinimo

                          if (existe && artTalla) {
                            return (
                              <button
                                key={talla}
                                onClick={() => abrirAjusteStock(artTalla)}
                                className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-between group hover:scale-105 active:scale-95 ${
                                  esCritico
                                    ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 ring-1 ring-red-400/40'
                                    : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-900 dark:text-white'
                                }`}
                                title={`Talla ${talla}: Stock ${artTalla.stockActual} (Mín: ${artTalla.stockMinimo})`}
                              >
                                <span className="text-xs font-mono font-black">T.{talla}</span>
                                <span
                                  className={`text-sm font-black mt-1 font-mono ${
                                    artTalla.stockActual === 0
                                      ? 'text-red-600 dark:text-red-400'
                                      : esCritico
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-700 dark:text-emerald-400'
                                  }`}
                                >
                                  {artTalla.stockActual}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 mt-0.5">
                                  Ajustar
                                </span>
                              </button>
                            )
                          }

                          // Talla aún no habilitada en la base de datos -> Botón rápido para activarla
                          return (
                            <button
                              key={talla}
                              onClick={() => abrirActivarTalla(mod, talla)}
                              className="p-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/30 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 text-center transition flex flex-col items-center justify-center gap-1 group active:scale-95"
                              title={`Activar Talla ${talla} para este modelo`}
                            >
                              <span className="text-xs font-mono font-bold opacity-60">T.{talla}</span>
                              <Plus size={13} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400" />
                              <span className="text-[8px] font-bold uppercase tracking-tighter">Crear</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 2. 👕 MÓDULO INDEPENDIENTE: CONTROL DE ROPAS Y UNIFORMES (S A XXXXL & 28-44) */}
      {moduloActivo === 'ropa' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Tarjetas KPIs Ropa */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4 bg-gradient-to-br from-indigo-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-indigo-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Prendas en Almacén</p>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                {metricasRopa.totalPrendas} <span className="text-xs font-medium text-slate-500">prendas</span>
              </p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-blue-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-blue-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Modelos de Prendas</p>
              <p className="text-2xl font-black text-blue-700 dark:text-cyan-400 mt-1">
                {metricasRopa.modelos} <span className="text-xs font-medium text-slate-500">modelos</span>
              </p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-red-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-red-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Prendas Críticas / Reponer</p>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                {metricasRopa.criticos} <span className="text-xs font-medium text-slate-500">tallas</span>
              </p>
            </div>
            <div className="card p-4 bg-gradient-to-br from-emerald-50/80 to-white dark:from-slate-800/90 dark:to-slate-900 border-emerald-200 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Valorización Uniformes</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                S/ {metricasRopa.valorizacion.toFixed(2)}
              </p>
            </div>
          </div>

          {/* MATRIZ DE MODELOS DE ROPA CON DESGLOSE POR TALLAS (TEXTILES Y PANTALONES) */}
          <div className="space-y-4">
            {modelosRopa.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 text-sm">
                No hay uniformes o prendas registradas. Pulsa &quot;Nuevo Artículo&quot; para registrar un modelo de prenda.
              </div>
            ) : (
              modelosRopa.map(mod => {
                const esPantalon = mod.nombreBase.toLowerCase().includes('pantalón') || mod.nombreBase.toLowerCase().includes('pantalon')
                const tallasAMostrar = esPantalon
                  ? ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']
                  : ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'Talla Única']

                return (
                  <div
                    key={mod.nombreBase}
                    className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-sm hover:shadow-md transition space-y-4"
                  >
                    {/* Encabezado del Modelo Textil */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            {mod.codigoBase}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Marca: <strong className="text-slate-800 dark:text-slate-200">{mod.marca}</strong>
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-950 dark:text-white mt-1">
                          {mod.nombreBase}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Stock Total de Prenda</p>
                          <p className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                            {mod.stockTotal} <span className="text-xs">unidades</span>
                          </p>
                        </div>
                        <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-700">
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Costo Unit.</p>
                          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono">
                            S/ {mod.costoPromedio.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MATRIZ DE TALLAS TEXTILES */}
                    <div>
                      <p className="text-xs font-black text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between">
                        <span>Desglose de Stock por Talla:</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Haz clic en cualquier talla para cargar o ajustar existencias
                        </span>
                      </p>

                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                        {tallasAMostrar.map(talla => {
                          const artTalla = mod.articulosPorTalla.get(talla)
                          const existe = !!artTalla
                          const esCritico = existe && artTalla.stockActual <= artTalla.stockMinimo

                          if (existe && artTalla) {
                            return (
                              <button
                                key={talla}
                                onClick={() => abrirAjusteStock(artTalla)}
                                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-between group hover:scale-105 active:scale-95 ${
                                  esCritico
                                    ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 ring-1 ring-red-400/40'
                                    : 'bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-900 dark:text-white'
                                }`}
                                title={`Talla ${talla}: Stock ${artTalla.stockActual} (Mín: ${artTalla.stockMinimo})`}
                              >
                                <span className="text-xs font-mono font-black">{talla}</span>
                                <span
                                  className={`text-base font-black mt-1 font-mono ${
                                    artTalla.stockActual === 0
                                      ? 'text-red-600 dark:text-red-400'
                                      : esCritico
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-700 dark:text-emerald-400'
                                  }`}
                                >
                                  {artTalla.stockActual}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mt-0.5">
                                  Ajustar
                                </span>
                              </button>
                            )
                          }

                          return (
                            <button
                              key={talla}
                              onClick={() => abrirActivarTalla(mod, talla)}
                              className="p-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/30 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-center transition flex flex-col items-center justify-center gap-1 group active:scale-95"
                              title={`Activar Talla ${talla} para este modelo`}
                            >
                              <span className="text-xs font-mono font-bold opacity-60">{talla}</span>
                              <Plus size={13} className="text-slate-400 group-hover:text-indigo-600" />
                              <span className="text-[8px] font-bold uppercase tracking-tighter">Crear</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* 3. 🛡️ MÓDULO DE IMPLEMENTOS / ACCESORIOS O 4. 📦 VISTA DE INVENTARIO GLOBAL */}
      {(moduloActivo === 'todos' || moduloActivo === 'accesorios') && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Barra de Filtros */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                className="input-field input-with-icon text-xs py-2.5"
                placeholder="Buscar por código SKU, descripción, marca o talla..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {moduloActivo === 'todos' && (
                <select
                  className="input-field w-auto text-xs py-2.5 font-bold"
                  value={filtroCategoria}
                  onChange={e => setFiltroCategoria(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIAS_EPP.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold">
                <button
                  onClick={() => setFiltroStock('todos')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filtroStock === 'todos'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({articulosFiltrados.length})
                </button>
                <button
                  onClick={() => setFiltroStock('critico')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filtroStock === 'critico'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-red-600'
                  }`}
                >
                  ⚠️ Crítico / Reponer
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Artículos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="card p-5 space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              ))
            ) : articulosFiltrados.length === 0 ? (
              <div className="col-span-full card p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                No se encontraron artículos en el inventario con los filtros seleccionados.
              </div>
            ) : (
              articulosFiltrados.map(art => {
                const esCritico = art.stockActual <= art.stockMinimo

                return (
                  <div
                    key={art.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                      esCritico
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800/50 ring-1 ring-red-400/30'
                        : 'bg-white dark:bg-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-mono font-black text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px]">
                          {art.codigo}
                        </span>
                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs ${
                            esCritico
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                          }`}
                        >
                          {esCritico ? (
                            <AlertTriangle size={11} className="text-red-700 shrink-0" />
                          ) : (
                            <CheckCircle2 size={11} className="text-emerald-700 shrink-0" />
                          )}
                          Stock: {art.stockActual} <span className="opacity-75">(Mín: {art.stockMinimo})</span>
                        </span>
                      </div>

                      <p className="text-sm font-black text-slate-950 dark:text-white mt-2 leading-snug">
                        {art.nombre}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                        {art.categoria} • Marca:{' '}
                        <strong className="text-slate-800 dark:text-slate-300">
                          {art.marcaFabricante || 'Estándar'}
                        </strong>
                      </p>

                      <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Talla: </span>
                          <span className="font-bold text-slate-900 dark:text-slate-200 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {art.talla || 'Talla Única'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Vida Útil: </span>
                          <span className="font-bold text-slate-900 dark:text-slate-200">{art.vidaUtilDias}d</span>
                        </div>
                        <div>
                          <span className="font-mono font-black text-blue-700 dark:text-emerald-400 text-sm">
                            S/ {art.costoUnitario.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones: Ajuste Rápido de Stock + Editar Ficha */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
                      <button
                        onClick={() => abrirAjusteStock(art)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition shadow-2xs border border-slate-300 dark:border-slate-600 active:scale-95"
                        title="Cargar entradas, salidas o ajustar balance de stock físico"
                      >
                        <Layers size={13} className="text-blue-600 dark:text-cyan-400" /> Stock
                      </button>

                      <button
                        onClick={() => abrirEditar(art)}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                      >
                        <Pencil size={12} className="text-white" /> Editar
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── MODAL NUEVO / EDITAR ARTÍCULO ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {editando ? 'Editar Artículo e Implemento EPP' : 'Nuevo Artículo EPP'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Categoría del EPP *</label>
                <select
                  className="input-field font-bold text-blue-700 dark:text-cyan-400 bg-blue-50/50 dark:bg-slate-800"
                  value={form.categoria}
                  onChange={e => {
                    const nuevaCat = e.target.value
                    const opciones = getOpcionesTallas(nuevaCat)
                    const sugerencias = DESCRIPCIONES_POR_CATEGORIA[nuevaCat] || []
                    const primeraSugerencia = sugerencias[0]

                    setForm(f => ({
                      ...f,
                      categoria: nuevaCat,
                      talla: opciones[0] || 'Talla Única',
                      // Si no tenía nombre o cambia de categoría, sugerir el primer artículo de esa categoría
                      nombre: f.nombre ? f.nombre : primeraSugerencia ? primeraSugerencia.nombre : '',
                      costoUnitario: (!f.costoUnitario || f.costoUnitario === '0') && primeraSugerencia ? String(primeraSugerencia.costoAprox) : f.costoUnitario,
                      vidaUtilDias: primeraSugerencia ? String(primeraSugerencia.vidaUtil) : f.vidaUtilDias,
                    }))
                  }}
                >
                  {CATEGORIAS_EPP.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="label">Código SKU *</label>
                <input
                  className="input-field font-mono font-bold"
                  placeholder="Ej. CAL-BOT-42"
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                />
              </div>

              {/* DESCRIPCIÓN COMPLETA DEL EPP CON SELECTOR AUTOMÁTICO SEGÚN CATEGORÍA */}
              <div className="col-span-2 space-y-1.5">
                <label className="label flex items-center justify-between">
                  <span>Descripción Completa del EPP *</span>
                  <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-normal">
                    ✨ Selecciona de la lista o escribe tu propia descripción
                  </span>
                </label>

                {/* Lista Desplegable Automática de la Categoría Seleccionada */}
                <select
                  className="input-field font-bold text-xs bg-slate-50 dark:bg-slate-800/90 border-blue-300 dark:border-blue-700/60 text-slate-900 dark:text-slate-100"
                  value=""
                  onChange={e => {
                    const descElegida = e.target.value
                    if (!descElegida) return
                    const itemData = (DESCRIPCIONES_POR_CATEGORIA[form.categoria] || []).find(d => d.nombre === descElegida)
                    setForm(f => ({
                      ...f,
                      nombre: descElegida,
                      costoUnitario: itemData ? String(itemData.costoAprox) : f.costoUnitario,
                      vidaUtilDias: itemData ? String(itemData.vidaUtil) : f.vidaUtilDias,
                    }))
                  }}
                >
                  <option value="">
                    📋 Seleccionar artículo predefinido de [{form.categoria}] ({ (DESCRIPCIONES_POR_CATEGORIA[form.categoria] || []).length } opciones)...
                  </option>
                  {(DESCRIPCIONES_POR_CATEGORIA[form.categoria] || []).map(item => (
                    <option key={item.nombre} value={item.nombre}>
                      {item.nombre} • (Vida útil: {item.vidaUtil}d • Ref: S/ {item.costoAprox.toFixed(2)})
                    </option>
                  ))}
                </select>

                {/* Campo de Texto Editable / Personalizable con Autocompletado */}
                <div className="relative">
                  <input
                    list="lista-descripciones-epp"
                    className="input-field font-semibold"
                    placeholder="Ej. Botas de Seguridad Punta de Acero Caña Alta..."
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                  />
                  <datalist id="lista-descripciones-epp">
                    {(DESCRIPCIONES_POR_CATEGORIA[form.categoria] || []).map(item => (
                      <option key={item.nombre} value={item.nombre} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="label">Marca / Proveedor</label>
                <input
                  className="input-field"
                  placeholder="Ej. 3M / MSA / Nazca / Delta Plus"
                  value={form.marcaFabricante}
                  onChange={e => setForm({ ...form, marcaFabricante: e.target.value })}
                />
              </div>

              {/* Selector de Tallas Inteligente */}
              <div>
                <label className="label">
                  Talla / Medida {form.categoria === 'Calzado' ? '(35-47)' : form.categoria === 'Uniforme' ? '(S-XXXXL / 28-50)' : ''}
                </label>
                <div className="space-y-1.5">
                  <select
                    className="input-field font-bold"
                    value={form.talla}
                    onChange={e => setForm({ ...form, talla: e.target.value })}
                  >
                    <option value="">Seleccione talla...</option>
                    {getOpcionesTallas(form.categoria).map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="OTRA">Otra / Escribir personalizada...</option>
                  </select>

                  {(!getOpcionesTallas(form.categoria).includes(form.talla) && form.talla !== '') || form.talla === 'OTRA' ? (
                    <input
                      className="input-field text-xs font-mono"
                      placeholder="Ingrese talla personalizada..."
                      value={form.talla === 'OTRA' ? '' : form.talla}
                      onChange={e => setForm({ ...form, talla: e.target.value })}
                      autoFocus
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <label className="label">Costo Unitario (S/) *</label>
                <input
                  type="number"
                  step="0.10"
                  className="input-field font-mono font-bold"
                  value={form.costoUnitario}
                  onChange={e => setForm({ ...form, costoUnitario: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">Vida Útil (Días)</label>
                <input
                  type="number"
                  className="input-field font-mono"
                  value={form.vidaUtilDias}
                  onChange={e => setForm({ ...form, vidaUtilDias: e.target.value })}
                  placeholder="365"
                />
              </div>

              <div>
                <label className="label">Stock Actual Físico</label>
                <input
                  type="number"
                  className="input-field font-mono font-bold text-blue-700 dark:text-cyan-400"
                  value={form.stockActual}
                  onChange={e => setForm({ ...form, stockActual: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  className="input-field font-mono"
                  value={form.stockMinimo}
                  onChange={e => setForm({ ...form, stockMinimo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
              >
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar Artículo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE ACTIVACIÓN RÁPIDA DE NUEVA TALLA PARA UN MODELO ───────── */}
      {showActivarTallaModal && modeloBaseActivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                    Habilitar Nueva Talla {modeloBaseActivar.tallaDeseada}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Modelo: {modeloBaseActivar.nombreBase}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowActivarTallaModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {errorActivarTalla && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} /> {errorActivarTalla}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">SKU que se generará:</span>
                  <span className="font-mono font-black text-blue-700 dark:text-cyan-400">
                    {modeloBaseActivar.codigoPrefijo}-T{modeloBaseActivar.tallaDeseada}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Costo unitario base:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    S/ {modeloBaseActivar.costo.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Stock Inicial a Ingresar para Talla {modeloBaseActivar.tallaDeseada}:</label>
                <input
                  type="number"
                  className="input-field font-mono text-base font-bold text-center py-2.5"
                  value={stockInicialNuevaTalla}
                  onChange={e => setStockInicialNuevaTalla(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Stock Mínimo de Alerta:</label>
                <input
                  type="number"
                  className="input-field font-mono text-sm font-bold text-center"
                  value={stockMinimoNuevaTalla}
                  onChange={e => setStockMinimoNuevaTalla(e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowActivarTallaModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarActivacionTalla}
                disabled={activandoTalla}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
              >
                <CheckCircle2 size={14} /> {activandoTalla ? 'Habilitando...' : 'Habilitar y Guardar Talla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE AJUSTE / CARGA RÁPIDA DE STOCK FÍSICO REAL ───────────── */}
      {showStockModal && articuloStockAjuste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950 dark:text-white leading-tight">
                    Ajuste de Stock Físico Real
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {articuloStockAjuste.codigo} • {articuloStockAjuste.talla || 'Talla Única'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStockModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <p className="text-xs font-black text-slate-950 dark:text-white leading-snug">
                {articuloStockAjuste.nombre}
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700/60 font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Stock Actual Registrado:</span>
                <span className="font-mono font-black text-blue-700 dark:text-cyan-400 text-sm">
                  {articuloStockAjuste.stockActual} unidades
                </span>
              </div>
            </div>

            {errorStock && (
              <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={15} /> {errorStock}
              </div>
            )}

            {/* Opciones de Operación */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 font-bold">
                <button
                  type="button"
                  onClick={() => setModoAjuste('sumar')}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    modoAjuste === 'sumar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Plus size={14} /> Registrar Entrada (+)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoAjuste('fijar')
                    setCantidadAjuste(String(articuloStockAjuste.stockActual))
                  }}
                  className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                    modoAjuste === 'fijar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <RotateCcw size={13} /> Fijar Balance Total
                </button>
              </div>

              <div>
                <label className="label">
                  {modoAjuste === 'sumar' ? 'Cantidad a Ingresar / Sumar al Stock (+):' : 'Nuevo Balance de Stock Físico Total:'}
                </label>
                <input
                  type="number"
                  className="input-field font-mono text-base font-bold text-center py-2.5"
                  value={cantidadAjuste}
                  onChange={e => setCantidadAjuste(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Nuevo Stock Calculado:</span>
                <span className="font-mono text-base text-emerald-700 dark:text-emerald-400 font-black">
                  {modoAjuste === 'sumar'
                    ? articuloStockAjuste.stockActual + (parseInt(cantidadAjuste, 10) || 0)
                    : parseInt(cantidadAjuste, 10) || 0}{' '}
                  unidades
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarAjusteStock}
                disabled={guardandoStock}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <Save size={14} /> {guardandoStock ? 'Actualizando...' : 'Guardar y Reflejar Inventario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación Masiva Excel */}
      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={cargar}
      />
    </div>
  )
}
