# Reglas Generales del Proyecto - Sistema César

Este archivo contiene las reglas y preferencias para el desarrollo del proyecto. El asistente de IA debe seguir estas pautas en cada interacción.

## Idioma y Comunicación
- **Idioma:** Todas las respuestas, comentarios en el código y documentación deben estar en **Español**.
- **Tono:** Profesional, técnico y colaborativo.

## Arquitectura y Tecnologías
- **Frontend:** React con Vite.
  - Usar componentes funcionales y Hooks.
  - Estilos preferiblemente con CSS Vanilla o lo que ya esté establecido en el proyecto.
- **Backend:** Node.js con Express.
  - Mantener la estructura de rutas y controladores separada.
- **Base de Datos:** SQL (MySQL/PostgreSQL según configuración en `.env`).
  - Seguir las convenciones de nombres existentes para tablas y columnas.

## Estilo de Código
- **Nomenclatura:** 
  - Variables y funciones en `camelCase`.
  - Componentes de React en `PascalCase`.
  - Archivos de componentes en `.jsx`.
- **Limpieza:** 
  - Eliminar `console.log` innecesarios después de depurar.
  - Mantener funciones pequeñas y con una sola responsabilidad.
  - Documentar funciones complejas con comentarios breves.

## Flujo de Trabajo
- Antes de realizar cambios importantes en la base de datos, verificar el archivo `init_db.sql` o las migraciones existentes.
- Siempre verificar que el frontend y el backend estén sincronizados tras un cambio en la API.
- Al crear nuevas funcionalidades, asegurar que el diseño sea responsivo y moderno.

## Principios de Trabajo (CRÍTICO)

### 1. Modo Plan por Defecto
- Entrar en **modo planificación** para cualquier tarea no trivial (3+ pasos o decisiones de arquitectura).
- Si algo se desvía, detenerse y volver a planear de inmediato.
- Usar el modo plan para verificar pasos, no solo para construir.
- Escribir especificaciones claras desde el inicio para reducir ambigüedad.

### 2. Estrategia de Subagentes
- Usar **subagentes** para mantener limpio el contexto principal.
- Delegar investigación, exploración y análisis paralelo a subagentes.
- Para problemas complejos, usar más cómputo a través de subagentes.
- Un solo objetivo por subagente para mantener el enfoque.

### 3. Ciclo de Auto-mejora
- Después de cualquier corrección del usuario, actualizar un archivo de lecciones (`.agent/lessons.md`) con el patrón.
- Escribir reglas para evitar repetir el mismo error.
- Iterar sin piedad hasta que la tasa de errores baje.
- Revisar las lecciones al inicio de cada sesión del proyecto.

### 4. Verificación Antes de Terminar
- **Nunca** marcar una tarea como completada sin demostrar que funciona.
- Compara el comportamiento entre la versión principal y tus cambios cuando sea necesario.
- Preguntarse: "¿Un ingeniero senior aprobaría esto?"
- Ejecutar pruebas, revisar logs y demostrar que todo es correcto.

### 5. Exige Elegancia (Equilibrado)
- Para cambios complejos, pausar y preguntarse si hay una forma más elegante.
- Si una solución se siente improvisada, buscar una mejor.
- Para arreglos simples, no sobre-ingenierizar.
- Cuestionar el propio trabajo antes de presentarlo.

### 6. Corrección Autónoma de Errores
- Si recibes un reporte de error, arréglalo proactivamente.
- Revisar logs, errores y pruebas fallidas y resolverlo.
- No obligar al usuario a cambiar de contexto.
- Corregir fallos sin esperar instrucciones adicionales.

## Gestión de Tareas
- **Simplicidad primero:** Cada cambio debe ser lo más simple posible.
- **Sin pereza:** Encontrar la causa raíz, evitar soluciones temporales.
- **Impacto mínimo:** Cambiar solo lo necesario para evitar efectos secundarios.
