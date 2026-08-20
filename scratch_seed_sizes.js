const { PrismaClient } = require('@prisma/client')
const { PrismaLibSql } = require('@prisma/adapter-libsql')
const path = require('path')
const fs = require('fs')

function getPrisma() {
  const posiblesRutas = [
    path.join(process.cwd(), 'data', 'dev.db'),
    path.join(process.cwd(), 'prisma', 'dev.db'),
    path.join(process.cwd(), 'dev.db'),
    '/app/data/dev.db',
    '/app/dev.db'
  ]
  let dbPath = path.join(process.cwd(), 'dev.db')
  for (const p of posiblesRutas) {
    if (fs.existsSync(p)) {
      dbPath = p
      break
    }
  }

  const adapter = new PrismaLibSql({
    url: `file:${dbPath}`,
  })
  return new PrismaClient({ adapter })
}

async function main() {
  const prisma = getPrisma()
  console.log('Iniciando registro de tallas independientes y generación de SKUs...')

  const articulosData = []

  // 1. CALZADOS POR TALLAS (35 AL 47)
  const modelosCalzado = [
    { nombre: 'Botas caña largas de goma punta de acero', prefix: 'CAL-BOTG', costo: 55.0, vida: 180 },
    { nombre: 'Botas de seguridad dieléctricas', prefix: 'CAL-BOTD', costo: 70.0, vida: 365 },
    { nombre: 'Botas térmicas antideslizantes', prefix: 'CAL-BOTT', costo: 90.0, vida: 365 },
    { nombre: 'Botines de seguridad de cuero punta de acero', prefix: 'CAL-BOTC', costo: 95.0, vida: 365 },
  ]
  const tallasCalzado = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']

  for (const mod of modelosCalzado) {
    for (const talla of tallasCalzado) {
      articulosData.push({
        codigo: `${mod.prefix}-${talla}`,
        nombre: `${mod.nombre} T${talla}`,
        categoria: 'Calzado',
        talla: talla,
        costoUnitario: mod.costo,
        vidaUtilDias: mod.vida,
        stockActual: talla === '40' || talla === '41' || talla === '42' ? 30 : 15,
        stockMinimo: 5,
        marcaFabricante: 'Delta Plus / Bata',
        activo: true,
      })
    }
  }

  // 2. ROPAS Y UNIFORMES (S A XXXXL)
  const modelosRopa = [
    { nombre: 'Polo manga corta algodón con cuello camisero', prefix: 'UNI-POLC', costo: 25.0, vida: 365 },
    { nombre: 'Polo manga larga con cintas reflectivas', prefix: 'UNI-POLL', costo: 28.0, vida: 365 },
    { nombre: 'Suéter manga larga cuello redondo', prefix: 'UNI-SUET', costo: 30.0, vida: 180 },
    { nombre: 'Chaqueta ignífuga antiestática', prefix: 'UNI-CHAI', costo: 60.0, vida: 365 },
    { nombre: 'Casaca térmica para cámara de refrigeración', prefix: 'UNI-CASA', costo: 85.0, vida: 365 },
    { nombre: 'Chaleco térmico reflectivo tipo brigadista', prefix: 'UNI-CHAL', costo: 45.0, vida: 365 },
  ]
  const tallasRopa = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']

  for (const mod of modelosRopa) {
    for (const talla of tallasRopa) {
      articulosData.push({
        codigo: `${mod.prefix}-${talla}`,
        nombre: `${mod.nombre} Talla ${talla}`,
        categoria: 'Uniforme',
        talla: talla,
        costoUnitario: mod.costo,
        vidaUtilDias: mod.vida,
        stockActual: talla === 'M' || talla === 'L' || talla === 'XL' ? 40 : 20,
        stockMinimo: 5,
        marcaFabricante: 'DALUPEZMAR Textil',
        activo: true,
      })
    }
  }

  // 3. PANTALONES (28 AL 50)
  const modelosPantalon = [
    { nombre: 'Pantalón largo drill con cinta reflectiva', prefix: 'UNI-PAND', costo: 30.0, vida: 180 },
    { nombre: 'Pantalón térmico impermeable para congelados', prefix: 'UNI-PANT', costo: 65.0, vida: 365 },
  ]
  const tallasPantalon = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50']

  for (const mod of modelosPantalon) {
    for (const talla of tallasPantalon) {
      articulosData.push({
        codigo: `${mod.prefix}-${talla}`,
        nombre: `${mod.nombre} Talla ${talla}`,
        categoria: 'Uniforme',
        talla: talla,
        costoUnitario: mod.costo,
        vidaUtilDias: mod.vida,
        stockActual: talla === '32' || talla === '34' || talla === '36' ? 35 : 15,
        stockMinimo: 5,
        marcaFabricante: 'DALUPEZMAR Textil',
        activo: true,
      })
    }
  }

  // 4. OTROS IMPLEMENTOS Y ACCESORIOS ESTÁNDAR
  const eppsEstandar = [
    { codigo: 'UNI-MEDG-U', nombre: 'Medias gruesas de trabajo', categoria: 'Uniforme', talla: 'Talla Única', costoUnitario: 10.0, vidaUtilDias: 180, stockActual: 100, stockMinimo: 20 },
    { codigo: 'UNI-MEDT-U', nombre: 'Medias térmicas para baja temperatura', categoria: 'Uniforme', talla: 'Talla Única', costoUnitario: 15.0, vidaUtilDias: 180, stockActual: 80, stockMinimo: 15 },
    { codigo: 'EPP-CAB-01', nombre: 'Casco de seguridad Tipo 1 Clase E', categoria: 'Protección Cabeza', talla: 'Talla Única', costoUnitario: 35.0, vidaUtilDias: 365, stockActual: 60, stockMinimo: 10 },
    { codigo: 'EPP-CAB-02', nombre: 'Casco dieléctrico blanco con barbiquejo', categoria: 'Protección Cabeza', talla: 'Talla Única', costoUnitario: 45.0, vidaUtilDias: 365, stockActual: 40, stockMinimo: 10 },
    { codigo: 'EPP-CAB-03', nombre: 'Toca fantasma', categoria: 'Protección Cabeza', talla: 'Talla Única', costoUnitario: 15.0, vidaUtilDias: 180, stockActual: 150, stockMinimo: 25 },
    { codigo: 'EPP-CAB-04', nombre: 'Gorro con solapa para sol / legionario', categoria: 'Protección Cabeza', talla: 'Talla Única', costoUnitario: 13.0, vidaUtilDias: 180, stockActual: 80, stockMinimo: 15 },
    { codigo: 'EPP-CAB-05', nombre: 'Vincha para cabello', categoria: 'Protección Cabeza', talla: 'Talla Única', costoUnitario: 5.0, vidaUtilDias: 180, stockActual: 120, stockMinimo: 20 },
    { codigo: 'EPP-CAB-06', nombre: 'Pasamontañas térmico', categoria: 'Protección Cabeza', talla: 'Talla Única', costoUnitario: 18.0, vidaUtilDias: 365, stockActual: 50, stockMinimo: 10 },
    { codigo: 'EPP-VIS-01', nombre: 'Lentes de seguridad transparentes anti-impacto', categoria: 'Protección Visual', talla: 'Talla Única', costoUnitario: 18.0, vidaUtilDias: 180, stockActual: 100, stockMinimo: 20 },
    { codigo: 'EPP-VIS-02', nombre: 'Lentes de seguridad oscuros con protección UV', categoria: 'Protección Visual', talla: 'Talla Única', costoUnitario: 18.0, vidaUtilDias: 180, stockActual: 80, stockMinimo: 15 },
    { codigo: 'EPP-VIS-03', nombre: 'Lentes antiempañantes de seguridad', categoria: 'Protección Visual', talla: 'Talla Única', costoUnitario: 25.0, vidaUtilDias: 180, stockActual: 90, stockMinimo: 15 },
    { codigo: 'EPP-VIS-04', nombre: 'Protector facial transparente con cabezal', categoria: 'Protección Visual', talla: 'Talla Única', costoUnitario: 40.0, vidaUtilDias: 180, stockActual: 30, stockMinimo: 5 },
    { codigo: 'EPP-AUD-01', nombre: 'Tapones auditivos de silicona reutilizables', categoria: 'Protección Auditiva', talla: 'Talla Única', costoUnitario: 2.0, vidaUtilDias: 30, stockActual: 300, stockMinimo: 50 },
    { codigo: 'EPP-AUD-02', nombre: 'Orejeras de seguridad tipo copa para casco', categoria: 'Protección Auditiva', talla: 'Talla Única', costoUnitario: 48.0, vidaUtilDias: 365, stockActual: 40, stockMinimo: 8 },
    { codigo: 'EPP-MAN-01', nombre: 'Guantes de lana con puntos de PVC', categoria: 'Protección Manos', talla: 'Talla Única', costoUnitario: 15.0, vidaUtilDias: 90, stockActual: 120, stockMinimo: 20 },
    { codigo: 'EPP-MAN-02', nombre: 'Guantes de alta temperatura naranjados', categoria: 'Protección Manos', talla: 'Talla Única', costoUnitario: 20.0, vidaUtilDias: 90, stockActual: 80, stockMinimo: 15 },
    { codigo: 'EPP-MAN-03', nombre: 'Guantes de corte nivel 5 anticorte', categoria: 'Protección Manos', talla: 'Talla Única', costoUnitario: 22.0, vidaUtilDias: 90, stockActual: 100, stockMinimo: 15 },
    { codigo: 'EPP-MAN-04', nombre: 'Guantes térmicos para frío', categoria: 'Protección Manos', talla: 'Talla Única', costoUnitario: 28.0, vidaUtilDias: 180, stockActual: 70, stockMinimo: 10 },
    { codigo: 'EPP-MAN-05', nombre: 'Guantes de nitrilo resistente a químicos', categoria: 'Protección Manos', talla: 'Talla Única', costoUnitario: 12.0, vidaUtilDias: 60, stockActual: 150, stockMinimo: 25 },
    { codigo: 'EPP-MAN-06', nombre: 'Guantes de badana para operador', categoria: 'Protección Manos', talla: 'Talla Única', costoUnitario: 16.5, vidaUtilDias: 90, stockActual: 90, stockMinimo: 15 },
    { codigo: 'EPP-RES-01', nombre: 'Respirador semimascarilla de silicona doble vía', categoria: 'Protección Respiratoria', talla: 'Talla Única', costoUnitario: 25.0, vidaUtilDias: 90, stockActual: 60, stockMinimo: 10 },
    { codigo: 'EPP-RES-02', nombre: 'Filtros para partículas y polvo P100', categoria: 'Protección Respiratoria', talla: 'Talla Única', costoUnitario: 35.0, vidaUtilDias: 60, stockActual: 80, stockMinimo: 15 },
    { codigo: 'EPP-ALT-01', nombre: 'Arnés de seguridad de cuerpo entero 4 anillos', categoria: 'Protección Alturas', talla: 'Talla Única', costoUnitario: 55.0, vidaUtilDias: 730, stockActual: 25, stockMinimo: 5 },
    { codigo: 'EPP-ALT-02', nombre: 'Línea de vida con absorbedor de impacto', categoria: 'Protección Alturas', talla: 'Talla Única', costoUnitario: 75.0, vidaUtilDias: 730, stockActual: 25, stockMinimo: 5 },
    { codigo: 'EPP-CLI-01', nombre: 'Poncho para lluvia impermeable con capucha', categoria: 'Protección Climática', talla: 'Talla Única', costoUnitario: 32.0, vidaUtilDias: 365, stockActual: 50, stockMinimo: 10 },
    { codigo: 'EPP-ACC-01', nombre: 'Cinturón porta herramientas de cuero reforzado', categoria: 'Herramientas / Accesorios', talla: 'Talla Única', costoUnitario: 30.0, vidaUtilDias: 730, stockActual: 30, stockMinimo: 5 },
  ]

  for (const art of eppsEstandar) {
    articulosData.push(art)
  }

  console.log(`Total de artículos y tallas a registrar: ${articulosData.length}`)

  let creados = 0
  let actualizados = 0

  for (const item of articulosData) {
    try {
      const existe = await prisma.articuloEPP.findUnique({
        where: { codigo: item.codigo }
      })

      if (existe) {
        await prisma.articuloEPP.update({
          where: { codigo: item.codigo },
          data: {
            nombre: item.nombre,
            categoria: item.categoria,
            talla: item.talla,
            costoUnitario: item.costoUnitario,
            vidaUtilDias: item.vidaUtilDias,
            marcaFabricante: item.marcaFabricante || 'Estándar',
            activo: true,
          }
        })
        actualizados++
      } else {
        await prisma.articuloEPP.create({
          data: item
        })
        creados++
      }
    } catch (e) {
      console.error(`Error procesando ${item.codigo}:`, e.message)
    }
  }

  console.log(`✅ Proceso finalizado: ${creados} nuevos creados, ${actualizados} actualizados.`)
}

main().catch(console.error)
