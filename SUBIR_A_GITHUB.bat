@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║       DALUPEZMAR S.A.C. - PUBLICAR EN GITHUB / NUBE          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar si git está configurado
set "GIT_CMD=.tools\cmd\git.exe"
if not exist "%GIT_CMD%" (
    set "GIT_CMD=git"
)

echo Verificando estado del repositorio...
"%GIT_CMD%" status --short

echo.
echo ────────────────────────────────────────────────────────────────
echo Si aún no has conectado tu repositorio de GitHub:
echo 1. Entra a https://github.com/new y crea un repositorio (ej: epp-control)
echo 2. Pega la URL de tu repositorio a continuación.
echo    (Ejemplo: https://github.com/TU_USUARIO/epp-control.git)
echo ────────────────────────────────────────────────────────────────
echo.

set /p REPO_URL="Ingresa la URL de tu repositorio de GitHub (o presiona ENTER si ya está configurado): "

if not "%REPO_URL%"=="" (
    echo Configurando repositorio remoto...
    "%GIT_CMD%" remote remove origin >nul 2>&1
    "%GIT_CMD%" remote add origin %REPO_URL%
)

echo.
echo Guardando cambios y subiendo a GitHub (rama main)...
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "update: actualizacion del proyecto para la nube" >nul 2>&1
"%GIT_CMD%" branch -M main
"%GIT_CMD%" push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ╔══════════════════════════════════════════════════════════════╗
    echo ║  ✅ PROYECTO SUBIDO CON ÉXITO A GITHUB                      ║
    echo ║  Ahora puedes ir a Render o Railway para desplegarlo 24/7. ║
    echo ╚══════════════════════════════════════════════════════════════╝
) else (
    echo.
    echo [AVISO] Si GitHub te solicitó autenticación, asegúrate de iniciar sesión en el navegador o ingresar tu Personal Access Token.
)

echo.
pause
