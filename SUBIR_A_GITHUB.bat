@echo off
setlocal
cd /d "%~dp0"

echo =======================================================
echo    DALUPEZMAR S.A.C. - SUBIR PROYECTO A GITHUB
echo =======================================================
echo.

set "GIT_CMD=.tools\cmd\git.exe"
if not exist "%GIT_CMD%" set "GIT_CMD=git"

echo Configurando repositorio remoto...
"%GIT_CMD%" remote remove origin >nul 2>&1
"%GIT_CMD%" remote add origin https://github.com/carloseduardoacevedo82-bit/epp-control.git

echo.
echo =======================================================
echo Para autorizar la subida a GitHub:
echo 1. Abre este enlace en tu navegador:
echo    https://github.com/settings/tokens/new?scopes=repo^&description=epp-control
echo 2. Haz clic abajo en el boton verde "Generate token".
echo 3. Copia el token generado (empieza por ghp_...)
echo =======================================================
echo.

set /p TOKEN="Pega aqui tu token de GitHub (o presiona ENTER para intentar con tus credenciales): "

if not "%TOKEN%"=="" (
    echo Configurando acceso autenticado...
    "%GIT_CMD%" remote set-url origin https://%TOKEN%@github.com/carloseduardoacevedo82-bit/epp-control.git
)

echo.
echo Enviando archivos a GitHub (rama main)...
"%GIT_CMD%" branch -M main
"%GIT_CMD%" push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo =======================================================
    echo    [EXITO] Proyecto subido correctamente a GitHub!
    echo    Ahora puedes desplegarlo en Render o Railway.
    echo =======================================================
) else (
    echo.
    echo [ERROR] No se pudo completar la subida. Verifica tu token o conexion.
)

echo.
pause
