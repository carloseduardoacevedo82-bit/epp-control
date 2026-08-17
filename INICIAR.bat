@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║   DALUPEZMAR S.A.C. - EPP Control                  ║
echo ║   Iniciando sistema...                              ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: Verificar que está instalado
if not exist "node_modules" (
    echo [ERROR] No se encontraron dependencias instaladas.
    echo Ejecute primero INSTALAR.bat
    pause
    exit /b 1
)

if not exist "prisma\dev.db" (
    echo [AVISO] Base de datos no encontrada. Inicializando...
    call npx prisma db push
    call npx ts-node -P tsconfig.seed.json prisma/seed.ts
)

echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║   DALUPEZMAR S.A.C. - SISTEMA DE CONTROL DE EPP Y UNIFORMES        ║
echo ║   Servidor Activo para PC, Celulares y Tablets (Cualquier Internet)║
echo ╠════════════════════════════════════════════════════════════════════════╣
echo ║  • En esta computadora:   http://localhost:3000                    ║
echo ║  • En Red Local Wi-Fi:    http://192.168.1.11:3000                 ║
echo ║  • Desde CUALQUIER Celular / Tablet (4G/5G / Internet Global):      ║
echo ║    https://discover-forth-pub-guaranteed.trycloudflare.com         ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.
echo Presione Ctrl+C para detener el servidor
echo.

:: Iniciar tunel global Cloudflare si existe el binario
if exist "cloudflared.exe" (
    start /b "" cmd /c "cloudflared.exe tunnel --url http://localhost:3000 >nul 2>&1"
)

:: Abrir navegador automáticamente después de 3 segundos
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Iniciar Next.js en modo producción (ultra-rápido, sin avisos ni overlays de desarrollo)
call npx next start -H 0.0.0.0 -p 3000
