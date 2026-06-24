# Plan de Pruebas y Calidad de Software

Este documento define la estrategia, los objetivos, la cobertura y los estándares de calidad implementados para el proyecto de **Sistema de Gestión de Asistencia**.

---

## 1. Objetivos de Calidad
El objetivo principal del plan de aseguramiento de la calidad (QA) es garantizar la estabilidad, robustez y el correcto comportamiento de las funciones críticas del sistema (asistencia, atrasos, salidas anticipadas, carga masiva, notificaciones y autenticación).

### Métricas y Umbrales Clave:
* **Cobertura Mínima de Pruebas Unitarias**: $\ge 80\%$ de cobertura de sentencias (Statements) tanto en frontend como en backend.
* **Tasa de Aprobación de Pruebas**: 100% de las pruebas automatizadas deben pasar de forma exitosa antes de cada despliegue.
* **Calidad del Código**: Código libre de advertencias en consola (*warnings*) y errores en tiempo de ejecución durante la ejecución del conjunto de pruebas.

---

## 2. Estrategia de Pruebas
La estrategia actual se enfoca en **Pruebas Unitarias** para garantizar que los componentes lógicos individuales funcionen de manera predecible y aislada de dependencias externas.

### A. Backend (Jest)
* **Framework**: [Jest](https://jestjs.io/)
* **Aislamiento**: Mockeo del módulo de conexión a base de datos (`src/db.js`) y servicios externos (como el servicio de notificaciones de correo de `Resend`).
* **Alcance**: 
  * Rutas y controladores (Express Router).
  * Funciones utilitarias (cálculo de atrasos, permisos de módulos, formateo).
  * Middlewares (autenticación y validación de esquemas).

### B. Frontend (Vitest)
* **Framework**: [Vitest](https://vitest.dev/) con entorno `jsdom` para simulación del árbol DOM.
* **Librería de Renderizado**: React Testing Library para interactuar con componentes de React 19.
* **Alcance**:
  * Componentes de UI ( skeletons de carga, banners, paginación, etc.).
  * Contextos globales de estado (`AuthContext`, `ToastContext`, `DataCacheContext`).
  * Páginas del sistema (`Asistencia`, `Login`, `Dashboard`).
  * Clientes de API y utilidades de formateo.

---

## 3. Inventario de Pruebas

Actualmente, el sistema cuenta con las siguientes suites de pruebas implementadas:

### Backend (`backend/tests/`)
* **Autenticación y Sesión**: `authRoutes.test.js`, `authMiddleware.test.js`
* **Gestión de Estudiantes**: `estudiantesRoutes.test.js` (incluye validación de importación masiva desde XLS y creación automática de cursos).
* **Control de Asistencia**: `asistenciaRoutes.test.js` (cobertura del 100% en todos sus controladores de consulta, registro y edición), `asistenciaCursoFilter.test.js`, `attendance.test.js`.
* **Salidas Anticipadas**: `earlyExitRoutes.test.js`, `earlyExit.test.js`.
* **Auditoría y Reportes**: `auditRoutes.test.js`, `audit.test.js`.
* **Anuncios y Dashboard**: `anuncios.test.js`, `dashboard.test.js`.
* **Seguridad y Permisos**: `modulePermissions.test.js`, `requirePermission.test.js`.
* **Validación**: `validate.test.js`.
* **Notificaciones**: `notificationService.test.js`.

### Frontend (`frontend/tests/`)
* **Contextos y Proveedores**: `AuthContext.test.jsx`, `ToastContext.test.jsx`, `DataCacheContext.test.jsx`.
* **Páginas Clave**: `Login.test.jsx`, `Asistencia.test.jsx`, `Dashboard.test.jsx`.
* **Componentes de Interfaz**: `AnuncioBanner.test.jsx`, `ErrorBoundary.test.jsx`, `LoadingSkeleton.test.jsx`, `Pagination.test.jsx`.
* **API y Helpers**: `api.test.js`, `format.test.js`, `modulePermissions.test.js`.

---

## 4. Estado de Cobertura Actual (Junio 2026)

Tras la última optimización, los resultados de cobertura superan el umbral mínimo del 80%:

| Capa (Tecnología) | Cobertura de Sentencias | Cobertura de Líneas | Estado |
| :--- | :--- | :--- | :--- |
| **Backend (NodeJS / Jest)** | **88.50%** | **89.25%** | **Aprobado** |
| **Frontend (React 19 / Vitest)** | **85.23%** | **86.28%** | **Aprobado** |

---

## 5. Instrucciones para la Ejecución de Pruebas

Para validar la calidad del código localmente o en un entorno de Integración Continua (CI/CD):

### Ejecutar Pruebas del Backend
1. Navegar al directorio de backend:
   ```bash
   cd backend
   ```
2. Instalar dependencias (si no se ha hecho):
   ```bash
   npm install
   ```
3. Ejecutar suite de pruebas con reporte de cobertura:
   ```bash
   npm run test -- --coverage
   ```

### Ejecutar Pruebas del Frontend
1. Navegar al directorio de frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias (si no se ha hecho):
   ```bash
   npm install
   ```
3. Ejecutar suite de pruebas con reporte de cobertura:
   ```bash
   npm run test -- --coverage
   ```
