export type EstadoRenovacion = 'Vigente' | 'Por Vencer' | 'Vencido'
export type EstadoTrabajador = 'activo' | 'inactivo'
export type RolUsuario = 'ADMIN' | 'SUPERVISOR'

export const AREAS = [
  'Producción',
  'Operaciones',
  'SSOMA',
  'Mantenimiento',
  'Logística',
  'Electricidad',
  'Administración',
  'RRHH',
  'Área Externa',
] as const

export const TALLAS_CALZADO = [
  '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47',
] as const

export const TALLAS_ROPA = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL',
] as const

export const TALLAS_PANTALON = [
  '28', '30', '32', '34', '36', '38', '40', '42', '44',
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL',
] as const

export const CATEGORIAS_EPP = [
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
] as const

export interface UsuarioSession {
  id: number
  email: string
  nombre: string
  rol: RolUsuario
  cargo?: string
}

export interface Trabajador {
  id: number
  dni: string
  codigoFotocheck?: string | null
  nombres: string
  apellidos: string
  cargo: string
  area: string
  grupoSanguineo?: string | null
  contactoEmergencia?: string | null
  plantaPrincipal?: string | null
  fotoUrl?: string | null
  fechaIngreso: string
  tallaPantalon?: string | null
  tallaCamisa?: string | null
  tallaCalzado?: string | null
  estado: EstadoTrabajador
  createdAt: string
  updatedAt: string
  _count?: { entregas: number }
}

export interface ArticuloEPP {
  id: number
  codigo: string
  nombre: string
  categoria: string
  talla?: string | null
  costoUnitario: number
  vidaUtilDias: number
  stockActual: number
  stockMinimo: number
  marcaFabricante?: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface DetalleEntrega {
  id: number
  entregaId: number
  articuloId: number
  articulo: ArticuloEPP
  cantidad: number
  costoUnitarioMomento: number
  costoTotal: number
  fechaRenovacionCalc: string
  estadoRenovacion: EstadoRenovacion
  createdAt: string
}

export interface Entrega {
  id: number
  trabajadorId: number
  trabajador: Trabajador
  fechaEntrega: string
  firmaDigitalUrl?: string | null
  observaciones?: string | null
  rutaPdf?: string | null
  hashVerificacion?: string | null
  creadoPorId?: number | null
  creadoPor?: UsuarioSession | null
  createdAt: string
  detalles: DetalleEntrega[]
}

export interface ConstanciaArchivoItem {
  id: number
  entregaId: number
  trabajadorId: number
  trabajadorNombre: string
  trabajadorDni: string
  rutaRelativa: string
  nombreArchivo: string
  fechaEntrega: string
  totalItems: number
  costoTotal: number
  tamanoKb?: number
  urlDescarga?: string
}

export interface CarpetaTrabajadorConstancias {
  dni: string
  apellidosNombres: string
  area: string
  cargo: string
  rutaCarpeta: string
  totalConstancias: number
  archivos: ConstanciaArchivoItem[]
}

export interface FilaExcelInventario {
  CODIGO_ARTICULO: string
  NOMBRE_DESCRIPCION: string
  CATEGORIA: string
  TALLA: string
  STOCK_ACTUAL: number | string
  STOCK_MINIMO: number | string
  COSTO_UNITARIO: number | string
  VIDA_UTIL_DIAS: number | string
  MARCA_FABRICANTE?: string
}

export interface FilaValidadaImportacion {
  numeroFila: number
  codigo: string
  nombre: string
  categoria: string
  talla: string
  stockActual: number
  stockMinimo: number
  costoUnitario: number
  vidaUtilDias: number
  marcaFabricante: string
  esValida: boolean
  errores: string[]
  esDuplicadoEnArchivo?: boolean
  existeEnBD?: boolean
}

export interface ResumenImportacionExcel {
  totalFilas: number
  filasValidas: number
  filasConError: number
  filasNuevas: number
  filasActualizadas: number
  items: FilaValidadaImportacion[]
  nombreArchivo: string
}

export interface LogImportacionRegistro {
  id: number
  nombreArchivo: string
  totalFilas: number
  filasExitosas: number
  filasConError: number
  detallesJson?: string | null
  usuarioResponsable?: string | null
  createdAt: string
}

export interface KPIDashboard {
  totalTrabajadoresActivos: number
  gastoTotalAcumulado: number
  entregasDelMes: number
  alertasCriticas: number
  totalArticulosStock: number
  articulosBajoMinimo: number
}

export interface ConsumoArea {
  area: string
  gasto: number
  entregas: number
}

export interface ConsumoCategoria {
  categoria: string
  gasto: number
  cantidad: number
}

export interface FiltrosReporte {
  fechaInicio?: string
  fechaFin?: string
  trabajadorId?: number
  area?: string
  categoria?: string
  estadoRenovacion?: EstadoRenovacion
}

export interface FilaReporte {
  idEntrega?: string
  dni: string
  trabajador: string
  cargo?: string
  area: string
  codigo?: string
  articulo: string
  categoria?: string
  talla: string
  cantidad: number
  costoUnitario: number
  costoTotal: number
  fechaEntrega: string
  fechaRenovacion: string
  estado: EstadoRenovacion
  rutaPdf?: string
}
