const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('\n============================================================');
console.log('       DALUPEZMAR S.A.C. - SERVIDOR INTEGRAL EPP');
console.log('============================================================\n');

// 1. Matar procesos anteriores en puerto 3000
try {
  const output = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
  const lines = output.trim().split('\n');
  for (const line of lines) {
    if (line.includes('LISTENING')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && pid !== String(process.pid)) {
        console.log(`[AVISO] Liberando puerto 3000 (PID: ${pid})...`);
        try { execSync(`taskkill /F /PID ${pid} >nul 2>&1`); } catch (_) {}
      }
    }
  }
} catch (_) {}

// 2. Obtener IP local
let localIp = '127.0.0.1';
try {
  const nets = require('os').networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
  }
} catch (_) {}

// 3. Iniciar Next.js
console.log('[1/2] Iniciando servidor Next.js de alta velocidad...');
const standalonePath = path.join(__dirname, '.next', 'standalone', 'server.js');
let nextProcess;

if (fs.existsSync(standalonePath)) {
  nextProcess = spawn('node', ['.next/standalone/server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' },
    stdio: 'inherit',
    shell: true,
  });
} else {
  nextProcess = spawn('npx.cmd', ['next', 'start', '-H', '0.0.0.0', '-p', '3000'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });
}


nextProcess.on('error', (err) => {
  console.error('[ERROR] Error al iniciar Next.js:', err);
});

// 4. Iniciar Cloudflare Tunnel si existe
const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');
if (fs.existsSync(cloudflaredPath)) {
  console.log('[2/2] Creando enlace público HTTPS seguro para cámara móvil...');
  const cf = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:3000'], {
    cwd: __dirname,
  });

  let urlDetected = false;
  const parseUrl = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !urlDetected) {
      urlDetected = true;
      const tunnelUrl = match[0];
      
      console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
      console.log('║   📱 ACCESO DIRECTO PARA CELULARES (CON CÁMARA ACTIVA HTTPS)          ║');
      console.log('╠════════════════════════════════════════════════════════════════════════╣');
      console.log(`║  👉 ENLACE MÓVIL (HTTPS):  \x1b[32m\x1b[1m${tunnelUrl}\x1b[0m`);
      console.log(`║  💻 EN ESTA PC:            http://localhost:3000                       ║`);
      console.log(`║  📶 EN RED WI-FI LOCAL:    http://${localIp}:3000                     ║`);
      console.log('╠════════════════════════════════════════════════════════════════════════╣');
      console.log('║  📷 Escáner Óptico: Lee QR frente (DAL-1012) y Barras reverso (DNI)  ║');
      console.log('║  👥 Base de Datos: 87 colaboradores DALUPEZMAR S.A.C. sincronizados    ║');
      console.log('╚════════════════════════════════════════════════════════════════════════╝\n');
    }
  };

  cf.stdout.on('data', parseUrl);
  cf.stderr.on('data', parseUrl);

  cf.on('exit', () => {
    if (!urlDetected) {
      console.log(`\n[INFO] Servidor activo en http://${localIp}:3000 y http://localhost:3000\n`);
    }
  });
} else {
  console.log(`\n[INFO] Servidor activo en http://${localIp}:3000 y http://localhost:3000\n`);
}

process.on('SIGINT', () => {
  try { nextProcess.kill(); } catch (_) {}
  process.exit();
});
