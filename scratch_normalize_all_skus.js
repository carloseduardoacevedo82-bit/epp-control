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

function generarSkuEstandar(categoria, nombre, talla, id) {
  let prefijo = 'EPP'
  if (categoria === 'Calzado') prefijo = 'CAL'
  else if (categoria === 'Uniforme') prefijo = 'UNI'
  else if (categoria === 'Protección Cabeza') prefijo = 'EPP-CAB'
  else if (categoria === 'Protección Visual') prefijo = 'EPP-VIS'
  else if (categoria === 'Protección Auditiva') prefijo = 'EPP-AUD'
  else if (categoria === 'Protección Manos') prefijo = 'EPP-MAN'
  else if (categoria === 'Protección Respiratoria') prefijo = 'EPP-RES'
  else if (categoria === 'Protección Alturas') prefijo = 'EPP-ALT'
  else if (categoria === 'Protección Climática') prefijo = 'EPP-CLI'
  else if (categoria === 'Herramientas / Accesorios') prefijo = 'EPP-ACC'

  const nombreNorm = (nombre || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, '')

  let abrev = ''
  if (nombreNorm.includes('BOTA') && nombreNorm.includes('GOMA')) abrev = 'BOTG'
  else if (nombreNorm.includes('BOTA') && nombreNorm.includes('DIELEC')) abrev = 'BOTD'
  else if (nombreNorm.includes('BOTA') && nombreNorm.includes('TERM')) abrev = 'BOTT'
  else if (nombreNorm.includes('BOTIN') || nombreNorm.includes('CUERO')) abrev = 'BOTC'
  else if (nombreNorm.includes('ZAPATO')) abrev = 'ZAP'
  else if (nombreNorm.includes('POLO') && (nombreNorm.includes('CORTA') || nombreNorm.includes('MC'))) abrev = 'POLC'
  else if (nombreNorm.includes('POLO') && (nombreNorm.includes('LARGA') || nombreNorm.includes('ML'))) abrev = 'POLL'
  else if (nombreNorm.includes('SUETER') || nombreNorm.includes('CHOMPA')) abrev = 'SUET'
  else if (nombreNorm.includes('PANTALON') && nombreNorm.includes('DRILL')) abrev = 'PAND'
  else if (nombreNorm.includes('PANTALON') && nombreNorm.includes('TERM')) abrev = 'PANT'
  else if (nombreNorm.includes('CHAQUETA') || nombreNorm.includes('IGNIF')) abrev = 'CHAI'
  else if (nombreNorm.includes('CASACA')) abrev = 'CASA'
  else if (nombreNorm.includes('CHALECO')) abrev = 'CHAL'
  else if (nombreNorm.includes('MEDIA') && nombreNorm.includes('GRUES')) abrev = 'MEDG'
  else if (nombreNorm.includes('MEDIA') && nombreNorm.includes('TERM')) abrev = 'MEDT'
  else if (nombreNorm.includes('CASCO') && nombreNorm.includes('DIELEC')) abrev = '02'
  else if (nombreNorm.includes('CASCO')) abrev = '01'
  else if (nombreNorm.includes('TOCA')) abrev = '03'
  else if (nombreNorm.includes('GORRO') || nombreNorm.includes('SOLAPA')) abrev = '04'
  else if (nombreNorm.includes('VINCHA')) abrev = '05'
  else if (nombreNorm.includes('PASAMONTANA')) abrev = '06'
  else if (nombreNorm.includes('BARBIQUEJO')) abrev = '07'
  else if (nombreNorm.includes('TRANSPARENTE')) abrev = '01'
  else if (nombreNorm.includes('OSCURO')) abrev = '02'
  else if (nombreNorm.includes('ANTIEMP')) abrev = '03'
  else if (nombreNorm.includes('FACIAL')) abrev = '04'
  else if (nombreNorm.includes('SOBRELENTE')) abrev = '05'
  else if (nombreNorm.includes('SILICONA') || nombreNorm.includes('TAPON')) abrev = '01'
  else if (nombreNorm.includes('OREJERA')) abrev = '02'
  else if (nombreNorm.includes('LANA')) abrev = '01'
  else if (nombreNorm.includes('TEMPERATURA') || nombreNorm.includes('NARANJA')) abrev = '02'
  else if (nombreNorm.includes('CORTE') || nombreNorm.includes('ANTICORTE')) abrev = '03'
  else if (nombreNorm.includes('FRIO') || nombreNorm.includes('TERMICO')) abrev = '04'
  else if (nombreNorm.includes('NITRILO')) abrev = '05'
  else if (nombreNorm.includes('BADANA') || nombreNorm.includes('CUERO')) abrev = '06'
  else if (nombreNorm.includes('RESPIRADOR') || nombreNorm.includes('SEMIMASCARILLA')) abrev = '01'
  else if (nombreNorm.includes('FILTRO') || nombreNorm.includes('P100')) abrev = '02'
  else if (nombreNorm.includes('CARTUCHO')) abrev = '03'
  else if (nombreNorm.includes('MASCARILLA')) abrev = '04'
  else if (nombreNorm.includes('ARNES')) abrev = '01'
  else if (nombreNorm.includes('LINEA') || nombreNorm.includes('VIDA')) abrev = '02'
  else if (nombreNorm.includes('POSICIONAMIENTO')) abrev = '03'
  else if (nombreNorm.includes('PONCHO') || nombreNorm.includes('LLUVIA')) abrev = '01'
  else if (nombreNorm.includes('CINTURON') || nombreNorm.includes('HERRAMIENTA')) abrev = '01'
  else {
    const palabras = nombreNorm.split(/\s+/).filter(p => p.length >= 2 && !['CON', 'PARA', 'POR', 'DEL', 'LOS', 'LAS', 'TIPO', 'UNA', 'DE', 'EN'].includes(p))
    if (palabras.length >= 2) {
      abrev = palabras[0].slice(0, 3) + palabras[1].slice(0, 1)
    } else if (palabras.length === 1) {
      abrev = palabras[0].slice(0, 4)
    } else {
      abrev = String(id).padStart(2, '0')
    }
  }

  const tallaStr = (talla || '').trim().toUpperCase()
  const esTallaEspecifica = tallaStr && tallaStr !== 'TALLA ÚNICA' && tallaStr !== 'ESTÁNDAR' && tallaStr !== 'ÚNICO'

  if (categoria === 'Calzado' || categoria === 'Uniforme') {
    const sufijo = esTallaEspecifica ? `-${tallaStr.replace(/\s+/g, '')}` : '-U'
    return `${prefijo}-${abrev}${sufijo}`
  } else {
    const sufijo = esTallaEspecifica ? `-${tallaStr.replace(/\s+/g, '')}` : ''
    return `${prefijo}-${abrev}${sufijo}`
  }
}

async function main() {
  const prisma = getPrisma()
  console.log('Obteniendo todos los artículos de la base de datos...')

  const articulos = await prisma.articuloEPP.findMany({
    orderBy: { id: 'asc' }
  })

  console.log(`Total artículos a procesar: ${articulos.length}`)

  // Paso 1: Poner SKUs temporales únicos para evitar colisiones durante la reasignación
  console.log('Asignando códigos temporales...')
  for (const art of articulos) {
    await prisma.articuloEPP.update({
      where: { id: art.id },
      data: { codigo: `TEMP-${art.id}-${Date.now().toString(36)}` }
    })
  }

  // Paso 2: Calcular y asignar SKUs normalizados garantizando unicidad
  console.log('Asignando SKUs automáticos normalizados...')
  const skusAsignados = new Set()
  let actualizados = 0

  for (const art of articulos) {
    let skuBase = generarSkuEstandar(art.categoria, art.nombre, art.talla, art.id)
    let skuFinal = skuBase
    let contador = 2
    while (skusAsignados.has(skuFinal)) {
      skuFinal = `${skuBase}-V${contador}`
      contador++
    }
    skusAsignados.add(skuFinal)

    await prisma.articuloEPP.update({
      where: { id: art.id },
      data: { codigo: skuFinal }
    })

    actualizados++
    console.log(`[ID ${art.id}] ${skuFinal.padEnd(16)} -> ${art.nombre} (${art.talla || 'U'})`)
  }

  console.log(`\n✅ Normalización de SKUs completada: ${actualizados} artículos con SKU automático actualizado.`)
}

main().catch(console.error)
