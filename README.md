# EPP Control — DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C.

## Sistema de Control y Gestión de Entrega de EPPs y Uniformes

**RUC:** 20615714128

---

## ⚙️ Requisitos

- **Node.js** versión 18 o superior → [Descargar aquí](https://nodejs.org)
- **Windows 10/11** (compatible con macOS/Linux ejecutando los comandos equivalentes)

---

## 🚀 Instalación (Primera vez)

### Opción A — Instalación automática (Windows)
Haga doble clic en **`INSTALAR.bat`** y espere a que finalice.

### Opción B — Manual (cualquier OS)
```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

## ▶️ Iniciar el Sistema

### Windows
Haga doble clic en **`INICIAR.bat`**
_(El sistema se abrirá automáticamente en http://localhost:3000)_

### Manual
```bash
npm run dev
```
Luego abra su navegador en: **http://localhost:3000**

---

## 📁 Estructura del Proyecto

```
epp-control/
├── app/
│   ├── page.tsx              # Dashboard con KPIs y gráficos
│   ├── trabajadores/         # Gestión de trabajadores (CRUD)
│   ├── catalogo/             # Catálogo EPP (CRUD)
│   ├── entregas/nueva/       # Nueva entrega (flujo 4 pasos + firma)
│   ├── renovaciones/         # Semáforo de renovaciones
│   └── reportes/             # Reportes + exportación Excel
├── lib/
│   ├── prisma.ts             # Cliente de base de datos
│   ├── types.ts              # Tipos TypeScript
│   ├── generatePDF.ts        # Generador de actas PDF
│   └── generateExcel.ts      # Exportador Excel
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   ├── seed.ts               # Datos iniciales de prueba
│   └── dev.db                # Base de datos SQLite (se crea automáticamente)
├── INSTALAR.bat              # Script de instalación (Windows)
└── INICIAR.bat               # Script de inicio (Windows)
```

---

## 🗄️ Base de Datos

- Motor: **SQLite** (no requiere servidor externo)
- Archivo: `prisma/dev.db` (se crea automáticamente)
- ORM: **Prisma**

Para reiniciar datos de prueba:
```bash
npx prisma db push --force-reset
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

## 📦 Datos de Prueba (Seed)

Al instalar, se cargan automáticamente:
- **5 trabajadores** de distintas áreas
- **10 artículos EPP** variados (cascos, lentes, botines, uniformes, arneses, etc.)
- **3 entregas** con diferentes estados (Vigente, Por Vencer, Vencido)

---

## 🏭 Para Distribución en Otras PCs

Copie toda la carpeta `epp-control/` a la PC destino y ejecute `INSTALAR.bat`.

> **Nota:** Cada PC tendrá su propia base de datos SQLite local. Si requiere base de datos compartida en red, contacte al administrador para migrar a PostgreSQL.

---

## 📄 Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| Dashboard | KPIs, gráficos de gasto por área y categoría |
| Trabajadores | CRUD completo con tallas corporales |
| Catálogo EPP | CRUD con control de stock y alertas |
| Nueva Entrega | Flujo 4 pasos: colaborador → artículos → firma digital → PDF |
| Renovaciones | Semáforo 🟢🟡🔴 con filtros por área/categoría/estado |
| Reportes | Historial con filtros múltiples + exportación Excel |

---

_DALUPEZMAR SERVICIOS INDUSTRIALES S.A.C. © 2025_
