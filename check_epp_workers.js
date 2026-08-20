const { prisma } = require('./lib/prisma');

async function check() {
  const dnis = ['70581266', '61296965', '40811097', '60948067', '60592404', '008165638', '008706148', '75216072'];
  const workers = await prisma.trabajador.findMany({
    where: { dni: { in: dnis } }
  });
  console.log('Workers in DB:');
  workers.forEach(w => console.log('DNI:', w.dni, 'Fotocheck:', w.codigoFotocheck, 'Nombre:', w.apellidos, w.nombres, 'Estado:', w.estado));
  
  const allCounts = await prisma.trabajador.groupBy({
    by: ['estado'],
    _count: { id: true }
  });
  console.log('Summary:', allCounts);
  process.exit(0);
}

check();
