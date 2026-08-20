import { prisma } from '../lib/prisma'

function calcEstado(fechaRenovacion: Date): string {
  const hoy = new Date()
  const diff = Math.floor((fechaRenovacion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Vencido'
  if (diff <= 15) return 'Por Vencer'
  return 'Vigente'
}

// Lista oficial de trabajadores de DALUPEZMAR S.A.C.
const personalOficial = [
  { apellidos: 'Manrique Romani', nombres: 'Lourdes Rosa', dni: '61376102', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Maravi Maldonado', nombres: 'Yorben Wildo', dni: '70333107', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Mendoza Shahuano', nombres: 'Merlita', dni: '80490280', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Meza Huaymana', nombres: 'Pacsi Brilli', dni: '63038564', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Morales Vilchez', nombres: 'Dalia', dni: '80531382', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Morales Macahuachi', nombres: 'Mirelia', dni: '62719067', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Mozombite Yuyarima', nombres: 'Leonardo', dni: '73119775', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Nuñez Lazo', nombres: 'Arnold', dni: '72359957', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Oblitas Gonzalez', nombres: 'Daniel George', dni: '76016694', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Ochavano Lomas', nombres: 'Marcos Abel', dni: '48046198', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Ortega Narziso', nombres: 'Sandra', dni: '48592444', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Paima Chilicasepa', nombres: 'Mariel Naomi', dni: '60427615', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Panaifo Perez', nombres: 'Rebeca', dni: '62698406', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Ramos Cahuaza', nombres: 'Brandon', dni: '76763723', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Riega Carnero', nombres: 'Milton Wilber', dni: '30405445', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Roque Bayes', nombres: 'Jonathan', dni: '45014861', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Salazar Romero', nombres: 'Jorge Luis', dni: '10480632', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Salazar Mozombite', nombres: 'Ana Lucia', dni: '70782457', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Samaniego Ballarta', nombres: 'Jose Antonio', dni: '74726588', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Sanchez Llamoza', nombres: 'Jean Franco', dni: '71806451', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Sanchez Godoy', nombres: 'Sandy Estefany', dni: '75216072', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Santa Cruz Quispe', nombres: 'Amador', dni: '48291534', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Soria Guedes', nombres: 'Balentino Cristoper', dni: '60929731', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Tanchiva Mendoza', nombres: 'Elia', dni: '40511901', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Tanchiva Mendoza', nombres: 'Reddy', dni: '05353645', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Torres Gamarra', nombres: 'Constantino Justiniano', dni: '23676539', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Usquiano Olascuaga', nombres: 'Reymon Favian', dni: '61296965', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Yaricahua Yuyarima', nombres: 'Karyn', dni: '70581266', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Ynuma Tanchiva', nombres: 'David Jesus', dni: '61267077', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Ortega Narciso', nombres: 'Washington Junior', dni: '61378929', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Yahuarcani Valles', nombres: 'Genesis Pamela', dni: '61194467', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Roman Alderete', nombres: 'Estefani', dni: '42510041', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Cornejo Zeña', nombres: 'Giancarlo Martin', dni: '61946516', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Asipali Rubio', nombres: 'Jairo Samuel', dni: '61660649', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Rios Vela', nombres: 'Genesis Isabel', dni: '74231928', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Arangure Mendez', nombres: 'Wilker Armando', dni: '008622740', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Brito Neiva', nombres: 'Egliannys Yarismar', dni: '006153301', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Cordones Cabeza', nombres: 'Genesis Dayan', dni: '006880093', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Gamboa Rodriguez', nombres: 'Yubeisy Del Valle', dni: '007967214', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Jaen Betancourt', nombres: 'Edwar Daniel', dni: '005921423', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Leon Mejias', nombres: 'Durbis Bismarys', dni: '008935577', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Medina Gamboa', nombres: 'Maria De Los Angeles', dni: '008278987', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Mendez Palma', nombres: 'Miguel Andres', dni: '009559361', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Muñoz Gomez', nombres: 'Oscarina De Los Angeles', dni: '007650654', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Paredes Pacheco', nombres: 'Maricruz Mariuska', dni: '008474812', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Perez Pereira', nombres: 'Yoseline Yakeline', dni: '007325053', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Prieto Yoris', nombres: 'Stefany Inmaculada', dni: '006917711', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Rojas Zambrano', nombres: 'Ender Jose', dni: '009715510', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Ruiz Polanco', nombres: 'Iliana Lilibeth', dni: '008165638', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Saavedra Diaz', nombres: 'Jesus David', dni: '008706148', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Torres Romero', nombres: 'Joselyn Yoseany', dni: '008642415', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Venegas Martinez', nombres: 'Yersi Soley', dni: '007860093', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Acevedo Mendoza', nombres: 'Carlos Eduardo', dni: '005704276', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Rustasehenko Calero', nombres: 'Daiam Lissette', dni: '003011701', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Salazar Romero', nombres: 'Catalino', dni: '08348653', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Aguero Paredes', nombres: 'Lucia Juana', dni: '20569691', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Apagueño Panaifo', nombres: 'Richard', dni: '78706411', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Arevalo Henderson', nombres: 'Charly Arnold', dni: '43046174', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Arimuya Tamani', nombres: 'Deiby Javier', dni: '74927639', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Armas Muena', nombres: 'Segundo Angel', dni: '77478525', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Arotinco Godoy', nombres: 'Andy Gustavo', dni: '76110226', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Bautista Lupuche', nombres: 'Jose', dni: '41859381', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Cahuaza Muena', nombres: 'Dempster', dni: '63401773', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Cahuaza Vasquez', nombres: 'Edwin', dni: '80424858', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Cardenas Bejarano', nombres: 'Mariana Lizet', dni: '75345441', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Carhuavilca Carbajal', nombres: 'Owen Mickel Ballak', dni: '75406766', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Castro Ubaldo', nombres: 'Mirtha Karina', dni: '40811097', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Cristobal Contreras', nombres: 'Gady', dni: '61134209', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Fernandez Bobadilla', nombres: 'Joel Dario', dni: '60948067', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Fernandez Venero', nombres: 'David', dni: '70348540', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Flores Ruiz', nombres: 'Maria Elisbeth', dni: '45606571', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Garcia Prieto', nombres: 'Rosario', dni: '43974196', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Gomez Sulca', nombres: 'Luz Blanca', dni: '10499585', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Gomez Sulca', nombres: 'Grady Herlinda', dni: '46099735', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Huarcaya Yaranga', nombres: 'Elizabeth', dni: '44975175', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Ipushima Yahuarcani', nombres: 'Rosalinda', dni: '60592404', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Lopez Mozombite', nombres: 'Luz Noemi', dni: '77265489', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Lopez Acevedo', nombres: 'David Ignacio', dni: '75763467', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Macahuachi Grefa', nombres: 'Delia', dni: '45190108', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Maiz Carbajal', nombres: 'Liliana', dni: '42830778', cargo: 'Operario Producción', area: 'Producción' },
  { apellidos: 'Mamani Paredes', nombres: 'Christopher Nelson', dni: '76241177', cargo: 'Operario Producción', area: 'Producción' },
  // Trabajadores adicionales de la lista de entregas de julio
  { apellidos: 'Godoi Gonzalez', nombres: 'Hermis Enrique', dni: '009750381', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Quintana Toro', nombres: 'Greydi Marbeli', dni: '006206936', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Flores Nuñez', nombres: 'Elvis Anthony', dni: '73131267', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Chota Gonzales', nombres: 'Franklin Jhonatan', dni: '61899430', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Pinedo Mendoza', nombres: 'Chriss Andre', dni: '61066788', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Correa Garcia', nombres: 'Walter Daniel', dni: '62011393', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Medina Risso', nombres: 'Julio Cesar', dni: '009424087', cargo: 'Operario', area: 'Producción' },
  { apellidos: 'Torres Paredes', nombres: 'Edithmar Paola', dni: '004094941', cargo: 'Operario', area: 'Producción' },
]

// ── 54 REGISTROS REALES DE ENTREGAS DE JULIO 2026 ───────────────────────────
const entregasJulio2026 = [
  { dni: '009750381', fecha: '2026-07-21', articulo: 'Polo', cant: 2, talla: 'M', costo: 25.00 },
  { dni: '009750381', fecha: '2026-07-21', articulo: 'Pantalón largo', cant: 2, talla: 'M', costo: 30.00 },
  { dni: '009750381', fecha: '2026-07-21', articulo: 'Medias gruesas', cant: 1, talla: '', costo: 10.00 },
  { dni: '009750381', fecha: '2026-07-21', articulo: 'Botas caña largas de goma punta de acero', cant: 1, talla: '41', costo: 55.00 },

  { dni: '006206936', fecha: '2026-07-21', articulo: 'Pantalón largo', cant: 2, talla: 'L', costo: 30.00 },
  { dni: '006206936', fecha: '2026-07-21', articulo: 'Suéter manga larga', cant: 2, talla: 'L', costo: 30.00 },
  { dni: '006206936', fecha: '2026-07-21', articulo: 'Polo', cant: 1, talla: 'L', costo: 25.00 },
  { dni: '006206936', fecha: '2026-07-21', articulo: 'Toca fantasma', cant: 2, talla: '', costo: 15.00 },
  { dni: '006206936', fecha: '2026-07-21', articulo: 'Vincha para cabello', cant: 1, talla: '', costo: 5.00 },
  { dni: '006206936', fecha: '2026-07-21', articulo: 'Botas caña largas de goma punta de acero', cant: 1, talla: '40', costo: 55.00 },
  { dni: '006206936', fecha: '2026-07-21', articulo: 'Guantes de lana', cant: 1, talla: '', costo: 15.00 },
  { dni: '006206936', fecha: '2026-07-21', articulo: 'Medias gruesas', cant: 1, talla: '', costo: 10.00 },

  { dni: '73131267', fecha: '2026-07-20', articulo: 'Pantalón largo', cant: 1, talla: 'L', costo: 30.00 },
  { dni: '73131267', fecha: '2026-07-20', articulo: 'Botas caña largas de goma punta de acero', cant: 1, talla: '42', costo: 55.00 },
  { dni: '73131267', fecha: '2026-07-20', articulo: 'Toca fantasma', cant: 2, talla: '', costo: 15.00 },
  { dni: '73131267', fecha: '2026-07-20', articulo: 'Suéter manga larga', cant: 1, talla: 'L', costo: 30.00 },
  { dni: '73131267', fecha: '2026-07-20', articulo: 'Medias gruesas', cant: 1, talla: '', costo: 10.00 },
  { dni: '73131267', fecha: '2026-07-20', articulo: 'Guantes de lana', cant: 1, talla: '', costo: 15.00 },

  { dni: '61899430', fecha: '2026-07-22', articulo: 'Pantalón largo', cant: 2, talla: 'L', costo: 30.00 },
  { dni: '61899430', fecha: '2026-07-22', articulo: 'Suéter manga larga', cant: 2, talla: 'L', costo: 30.00 },
  { dni: '61899430', fecha: '2026-07-22', articulo: 'Medias gruesas', cant: 1, talla: '', costo: 10.00 },
  { dni: '61899430', fecha: '2026-07-22', articulo: 'Guantes de lana', cant: 2, talla: '', costo: 15.00 },
  { dni: '61899430', fecha: '2026-07-22', articulo: 'Toca fantasma', cant: 2, talla: '', costo: 15.00 },
  { dni: '61899430', fecha: '2026-07-22', articulo: 'Botas caña largas de goma punta de acero', cant: 1, talla: '43', costo: 55.00 },

  { dni: '61066788', fecha: '2026-07-07', articulo: 'Pantalón largo', cant: 1, talla: 'M', costo: 30.00 },
  { dni: '61066788', fecha: '2026-07-07', articulo: 'Suéter manga larga', cant: 1, talla: 'M', costo: 30.00 },
  { dni: '61066788', fecha: '2026-07-07', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },

  { dni: '007650654', fecha: '2026-07-08', articulo: 'Botas caña largas de goma punta de acero', cant: 1, talla: '', costo: 55.00 },
  { dni: '007325053', fecha: '2026-07-08', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '61066788', fecha: '2026-07-08', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '76110226', fecha: '2026-07-08', articulo: 'Pantalón largo', cant: 1, talla: '', costo: 30.00 },
  { dni: '76110226', fecha: '2026-07-08', articulo: 'Suéter manga larga', cant: 1, talla: '', costo: 30.00 },
  { dni: '76110226', fecha: '2026-07-08', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },

  { dni: '008278987', fecha: '2026-07-11', articulo: 'Suéter manga larga', cant: 1, talla: '', costo: 30.00 },
  { dni: '008278987', fecha: '2026-07-11', articulo: 'Pantalón largo', cant: 1, talla: '', costo: 30.00 },
  { dni: '007860093', fecha: '2026-07-11', articulo: 'Pantalón largo', cant: 1, talla: '', costo: 30.00 },
  { dni: '006880093', fecha: '2026-07-11', articulo: 'Polo', cant: 1, talla: '', costo: 25.00 },
  { dni: '008278987', fecha: '2026-07-11', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },

  { dni: '74927639', fecha: '2026-07-13', articulo: 'Medias gruesas', cant: 1, talla: '', costo: 10.00 },
  { dni: '62011393', fecha: '2026-07-13', articulo: 'Pantalón largo', cant: 1, talla: '', costo: 30.00 },
  { dni: '62011393', fecha: '2026-07-13', articulo: 'Suéter manga larga', cant: 1, talla: '', costo: 30.00 },
  { dni: '62011393', fecha: '2026-07-13', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },

  { dni: '70348540', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '009424087', fecha: '2026-07-15', articulo: 'Botas caña largas de goma punta de acero', cant: 1, talla: '', costo: 55.00 },
  { dni: '74927639', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '008642415', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '10499585', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '23676539', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '45190108', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '43974196', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '80531382', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '008474812', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '46099735', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
  { dni: '004094941', fecha: '2026-07-15', articulo: 'Toca fantasma', cant: 1, talla: '', costo: 15.00 },
]

async function main() {
  console.log('🌱 Iniciando seed DALUPEZMAR S.A.C. con entregas reales de Julio 2026...')

  // Limpiar datos existentes
  await prisma.detalleEntrega.deleteMany()
  await prisma.entrega.deleteMany()
  await prisma.articuloEPP.deleteMany()
  await prisma.trabajador.deleteMany()

  // ─── 89 TRABAJADORES REGISTRADOS ──────────────────────────────────────────
  const trabajadoresData = personalOficial.map((p, idx) => {
    const tallasPantalon = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50']
    const tallasCamisa = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']
    const tallasCalzado = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']

    return {
      dni: p.dni,
      nombres: p.nombres,
      apellidos: p.apellidos,
      cargo: p.cargo,
      area: idx % 10 === 0 ? 'Área Externa' : p.area,
      fechaIngreso: new Date('2024-01-15'),
      tallaPantalon: tallasPantalon[idx % tallasPantalon.length],
      tallaCamisa: tallasCamisa[idx % tallasCamisa.length],
      tallaCalzado: tallasCalzado[idx % tallasCalzado.length],
      estado: 'activo',
    }
  })

  const trabajadores = await prisma.trabajador.createManyAndReturn({
    data: trabajadoresData,
  })

  // ─── CATÁLOGO OFICIAL COMPLETO POR TALLAS INDEPENDIENTES Y SKUS ─────────
  const articulosDataList: any[] = []

  // 1. Calzados (35 al 47)
  const modelosCalzado = [
    { nombre: 'Botas caña largas de goma punta de acero', prefix: 'CAL-BOTG', costo: 55.0, vida: 180 },
    { nombre: 'Botas de seguridad dieléctricas', prefix: 'CAL-BOTD', costo: 70.0, vida: 365 },
    { nombre: 'Botas térmicas antideslizantes', prefix: 'CAL-BOTT', costo: 90.0, vida: 365 },
    { nombre: 'Botines de seguridad de cuero punta de acero', prefix: 'CAL-BOTC', costo: 95.0, vida: 365 },
  ]
  const tallasCalzadoList = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']
  for (const mod of modelosCalzado) {
    for (const talla of tallasCalzadoList) {
      articulosDataList.push({
        codigo: `${mod.prefix}-${talla}`,
        nombre: `${mod.nombre} T${talla}`,
        categoria: 'Calzado',
        talla,
        costoUnitario: mod.costo,
        vidaUtilDias: mod.vida,
        stockActual: talla === '40' || talla === '41' || talla === '42' ? 30 : 15,
        stockMinimo: 5,
        marcaFabricante: 'Delta Plus / Bata',
        activo: true,
      })
    }
  }

  // 2. Ropas y Uniformes (XS a XXXXL)
  const modelosRopa = [
    { nombre: 'Polo manga corta algodón con cuello camisero', prefix: 'UNI-POLC', costo: 25.0, vida: 365 },
    { nombre: 'Polo manga larga con cintas reflectivas', prefix: 'UNI-POLL', costo: 28.0, vida: 365 },
    { nombre: 'Suéter manga larga cuello redondo', prefix: 'UNI-SUET', costo: 30.0, vida: 180 },
    { nombre: 'Chaqueta ignífuga antiestática', prefix: 'UNI-CHAI', costo: 60.0, vida: 365 },
    { nombre: 'Casaca térmica para cámara de refrigeración', prefix: 'UNI-CASA', costo: 85.0, vida: 365 },
    { nombre: 'Chaleco térmico reflectivo tipo brigadista', prefix: 'UNI-CHAL', costo: 45.0, vida: 365 },
  ]
  const tallasRopaList = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL']
  for (const mod of modelosRopa) {
    for (const talla of tallasRopaList) {
      articulosDataList.push({
        codigo: `${mod.prefix}-${talla}`,
        nombre: `${mod.nombre} Talla ${talla}`,
        categoria: 'Uniforme',
        talla,
        costoUnitario: mod.costo,
        vidaUtilDias: mod.vida,
        stockActual: talla === 'M' || talla === 'L' || talla === 'XL' ? 40 : 20,
        stockMinimo: 5,
        marcaFabricante: 'DALUPEZMAR Textil',
        activo: true,
      })
    }
  }

  // 3. Pantalones (28 al 50)
  const modelosPantalon = [
    { nombre: 'Pantalón largo drill con cinta reflectiva', prefix: 'UNI-PAND', costo: 30.0, vida: 180 },
    { nombre: 'Pantalón térmico impermeable para congelados', prefix: 'UNI-PANT', costo: 65.0, vida: 365 },
  ]
  const tallasPantalonList = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50']
  for (const mod of modelosPantalon) {
    for (const talla of tallasPantalonList) {
      articulosDataList.push({
        codigo: `${mod.prefix}-${talla}`,
        nombre: `${mod.nombre} Talla ${talla}`,
        categoria: 'Uniforme',
        talla,
        costoUnitario: mod.costo,
        vidaUtilDias: mod.vida,
        stockActual: talla === '32' || talla === '34' || talla === '36' ? 35 : 15,
        stockMinimo: 5,
        marcaFabricante: 'DALUPEZMAR Textil',
        activo: true,
      })
    }
  }

  // 4. Otros EPPs e implementos estándar
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
    articulosDataList.push(art)
  }

  const articulos = await prisma.articuloEPP.createManyAndReturn({
    data: articulosDataList,
  })

  // ─── INSERTAR LAS 54 ENTREGAS REALES DE JULIO 2026 ────────────────────────
  // Agrupar por Trabajador y Fecha para crear las actas de entrega correspondientes
  const gruposEntrega = new Map<string, typeof entregasJulio2026>()

  for (const item of entregasJulio2026) {
    const clave = `${item.dni}_${item.fecha}`
    if (!gruposEntrega.has(clave)) {
      gruposEntrega.set(clave, [])
    }
    gruposEntrega.get(clave)!.push(item)
  }

  let totalGastoAcumulado = 0
  let totalItemsEntregados = 0

  for (const [clave, itemsGrupo] of gruposEntrega.entries()) {
    const { dni, fecha } = itemsGrupo[0]
    const trabajador = trabajadores.find(t => t.dni === dni)

    if (!trabajador) {
      console.warn(`Trabajador con DNI ${dni} no encontrado`)
      continue
    }

    const fechaEntrega = new Date(`${fecha}T10:00:00`)
    const entrega = await prisma.entrega.create({
      data: {
        trabajadorId: trabajador.id,
        fechaEntrega,
        observaciones: 'Hoja de Cargo Firmada - Entrega Real Julio 2026',
      },
    })

    for (const item of itemsGrupo) {
      const art = articulos.find(a =>
        a.nombre.toLowerCase().trim() === item.articulo.toLowerCase().trim() ||
        a.nombre.toLowerCase().startsWith(item.articulo.toLowerCase().trim()) ||
        item.articulo.toLowerCase().startsWith(a.nombre.toLowerCase().trim())
      ) || articulos[0]

      const costoUnitario = item.costo
      const costoTotal = costoUnitario * item.cant
      const fechaRenovacion = new Date(fechaEntrega.getTime() + art.vidaUtilDias * 24 * 60 * 60 * 1000)

      totalGastoAcumulado += costoTotal
      totalItemsEntregados += item.cant

      await prisma.detalleEntrega.create({
        data: {
          entregaId: entrega.id,
          articuloId: art.id,
          cantidad: item.cant,
          costoUnitarioMomento: costoUnitario,
          costoTotal,
          fechaRenovacionCalc: fechaRenovacion,
          estadoRenovacion: calcEstado(fechaRenovacion),
        },
      })
    }
  }

  console.log('✅ Seed completado con éxito:')
  console.log(`   - ${trabajadores.length} trabajadores registrados`)
  console.log(`   - ${articulos.length} artículos EPP oficiales en catálogo`)
  console.log(`   - ${gruposEntrega.size} actas de entrega creadas`)
  console.log(`   - ${entregasJulio2026.length} detalles de entrega registrados`)
  console.log(`   - Total Gasto Julio 2026: S/ ${totalGastoAcumulado.toFixed(2)}`)
  console.log(`   - Total Ítems Entregados: ${totalItemsEntregados} unidades`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
