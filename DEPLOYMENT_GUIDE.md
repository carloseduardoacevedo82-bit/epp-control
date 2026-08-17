# 🚀 Guía de Despliegue en la Nube 24/7 - DALUPEZMAR S.A.C.
**Sistema de Control de Entrega de EPPs y Uniformes**

Esta guía detalla paso a paso cómo desplegar la aplicación en la nube para que esté disponible **24/7 con URL pública HTTPS**, accesible desde cualquier smartphone, tablet o computadora, sin requerir tener la PC encendida.

---

## 📌 Resumen de Arquitectura y Persistencia

1. **Base de Datos Persistente:**
   - La base de datos guarda: Trabajadores, Inventario/Stock, Registros de Entrega, Fechas de Renovación y las **Firmas Digitales capturadas (en formato PNG Base64)**.
   - **Opciones soportadas:**
     - **Opción 1 (Recomendada - 100% Gratis y Serverless):** [Turso (LibSQL Cloud)](https://turso.tech) o [Supabase (PostgreSQL)](https://supabase.com).
     - **Opción 2 (Plataforma All-in-One):** [Railway](https://railway.app) o [Render](https://render.com) con disco persistente / PostgreSQL gestionado.

2. **Generación y Archivo de PDFs:**
   - El sistema genera los PDFs de las constancias con folio, firmas y códigos de validación al instante.
   - Los PDFs se generan dinámicamente desde los datos y la firma almacenada en la base de datos, garantizando que nunca se pierda un documento firmado aunque el servidor se reinicie.

---

## 🛠️ OPCIÓN A: Despliegue en RENDER (Opción Gratuita / Bajo Costo)

Render te permite alojar el repositorio de GitHub y conectarlo a una base de datos en la nube.

### Paso 1: Subir el código a GitHub
1. Abre tu terminal en la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "feat: preparar proyecto para despliegue en la nube"
   ```
2. Crea un repositorio en [GitHub](https://github.com/new) (por ejemplo: `epp-control`).
3. Conecta y sube el código:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/epp-control.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Crear la Base de Datos en la Nube (Gratis)
Puedes usar **Turso** (SQLite serverless compatible sin cambiar esquemas) o **Supabase** (PostgreSQL):

#### Si usas Turso (Recomendado para SQLite):
1. Regístrate en [turso.tech](https://turso.tech).
2. Crea una base de datos llamada `epp-db`.
3. Obtén la `Database URL` (ej: `libsql://epp-db-tuusuario.turso.io`) y genera un `Auth Token`.

### Paso 3: Crear el Web Service en Render
1. Ve a [Render.com](https://dashboard.render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** > **Web Service**.
3. Selecciona tu repositorio `epp-control`.
4. Configura los parámetros:
   - **Name:** `epp-control` (o el nombre de tu empresa)
   - **Region:** Ohio (US East) o Frankfurt
   - **Branch:** `main`
   - **Runtime:** `Node` o `Docker` (Render detectará automáticamente el `Dockerfile`)
   - **Build Command:** `npm install && npx prisma db push && npm run build` (si usas Node)
   - **Start Command:** `npm run start` (si usas Node)
   - **Plan Type:** `Free`

### Paso 4: Configurar Variables de Entorno en Render
En la pestaña **Environment** de tu servicio en Render, agrega:
- `NODE_ENV`: `production`
- `DATABASE_URL`: Tu URL de base de datos (ej: `libsql://epp-db-tuusuario.turso.io` o tu URL de Postgres)
- `TURSO_AUTH_TOKEN`: Tu token de Turso (si aplica)
- `PORT`: `3000`

### Paso 5: Poblar los Datos Iniciales (Seed)
Para cargar el catálogo de EPPs y el personal oficial de DALUPEZMAR:
- En Render, ve a la pestaña **Shell** de tu servicio y ejecuta:
  ```bash
  npm run db:seed
  ```

¡Listo! Render te dará una URL HTTPS fija (ej: `https://epp-control.onrender.com`).

---

## 🚂 OPCIÓN B: Despliegue en RAILWAY (Despliegue Rápido con 1 Clic)

Railway es ideal por su soporte nativo de volúmenes persistentes y PostgreSQL integrado.

1. Ve a [Railway.app](https://railway.app) y conéctate con GitHub.
2. Haz clic en **New Project** > **Deploy from GitHub repo**.
3. Selecciona tu repositorio `epp-control`.
4. Si deseas usar SQLite local con disco persistente:
   - Ve a **Settings** > **Volumes** > **Add Volume**.
   - Monta el volumen en el directorio `/app/data`.
   - En **Variables**, define `DATABASE_URL="file:/app/data/epp.db"`.
5. Si deseas usar PostgreSQL:
   - Haz clic en **New** > **Database** > **Add PostgreSQL**.
   - Conecta la variable `DATABASE_URL` generada automáticamente al servicio de tu app.
6. En **Settings** > **Networking**, haz clic en **Generate Domain** para obtener tu URL pública HTTPS (ej: `https://epp-control-production.up.railway.app`).

---

## 📱 Acceso desde Celulares y Tablets para Firma Digital

1. Abre el navegador móvil (Chrome, Safari, Edge) en el celular o tablet del supervisor/operario.
2. Ingresa a la URL HTTPS generada (ej: `https://epp-control.onrender.com`).
3. Ve al módulo de **Nueva Entrega**, selecciona el trabajador y los EPPs.
4. El operario puede firmar directamente sobre la pantalla táctil con su dedo o lápiz óptico.
5. Al hacer clic en **Confirmar y Guardar Entrega**, el sistema guarda la firma en la nube, descuenta el stock y genera la constancia PDF automáticamente.
