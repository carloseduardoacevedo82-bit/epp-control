@echo off
chcp 65001 >nul
title DALUPEZMAR S.A.C. - Sistema EPP y Fotochecks
cls

:: Verificar dependencias
if not exist "node_modules" (
    echo [ERROR] No se encontraron dependencias instaladas.
    echo Ejecute primero INSTALAR.bat
    pause
    exit /b 1
)

:: Verificar compilación de producción
if not exist ".next" (
    echo [AVISO] Compilando optimizaciones de producción por primera vez...
    call npm run build
)

:: Ejecutar servidor con túnel HTTPS automático para activar la cámara en celulares
node server_runner.js
