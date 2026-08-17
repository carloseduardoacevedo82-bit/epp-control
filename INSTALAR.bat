@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║   DALUPEZMAR S.A.C. - EPP Control                  ║
echo ║   Sistema de Gestion de EPPs y Uniformes            ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargue Node.js desde: https://nodejs.org
    echo Version recomendada: 18 o superior
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% encontrado

:: Instalar dependencias
echo.
echo [1/3] Instalando dependencias npm...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la instalacion de dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

:: Generar Prisma client
echo.
echo [2/3] Configurando base de datos...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la generacion del cliente Prisma
    pause
    exit /b 1
)
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la creacion de la base de datos
    pause
    exit /b 1
)
echo [OK] Base de datos configurada

:: Seed inicial
echo.
echo [3/3] Cargando datos iniciales de prueba...
call npx ts-node -P tsconfig.seed.json prisma/seed.ts
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] No se pudieron cargar datos iniciales (puede ignorar si ya existen)
)
echo [OK] Configuracion completada

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  ¡Instalacion exitosa!                              ║
echo ║                                                      ║
echo ║  Ejecute INICIAR.bat para arrancar el sistema       ║
echo ╚══════════════════════════════════════════════════════╝
echo.
pause
