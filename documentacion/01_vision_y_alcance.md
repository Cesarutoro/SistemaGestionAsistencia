# Vision y Alcance

## 1. Vision del producto

Construir una plataforma de gestion escolar que centralice la operacion diaria de cursos, estudiantes, asistencia y eventos especiales, reduciendo el trabajo manual y aumentando la trazabilidad de cada registro.

El sistema debe permitir que el equipo administrativo y de apoyo escolar tenga una vista unica del estado academico-operativo del establecimiento, con capacidad de reaccion rapida ante atrasos, ausencias y salidas anticipadas.

## 2. Problema a resolver

Hoy la gestion escolar suele depender de planillas aisladas, registros manuales y comunicaciones dispersas. Eso genera:

- Dificultad para encontrar informacion confiable en tiempo real
- Riesgo de errores de digitacion y duplicidad
- Baja trazabilidad sobre quien registro o autorizo cada evento
- Poco control historico por estudiante, curso o dia
- Tiempo excesivo dedicado a tareas administrativas repetitivas

## 3. Objetivo general

Diseñar una solucion web segura, simple y escalable para administrar la informacion operacional del establecimiento educacional.

## 4. Objetivos especificos

- Gestionar cursos y estudiantes de forma centralizada
- Registrar asistencia diaria y marcar atrasos
- Registrar salidas anticipadas con motivo, autorizacion y auditoria
- Proveer paneles de consulta para seguimiento operativo
- Resguardar autenticacion y control de acceso por rol
- Preparar la base para reportes y exportaciones futuras

## 5. Alcance funcional inicial

### Incluido

- Autenticacion de usuarios
- Gestion de estudiantes
- Gestion de cursos
- Registro de asistencia
- Identificacion de atrasos
- Registro de salidas anticipadas
- Consultas por curso, fecha o estudiante
- Panel de resumen operacional

### Excluido en la primera version conceptual

- Comunicacion automatica con apoderados
- Firma electronica
- Integracion con sistemas externos ministeriales
- App movil nativa
- Analitica avanzada con indicadores predictivos
- Flujos financieros o de matricula

## 6. Publico objetivo

- Equipo directivo
- Inspectoria
- Personal administrativo
- Docentes con funciones operativas
- Usuarios con responsabilidades de supervision

## 7. Principios de producto

- Simplicidad operativa: pocas acciones para tareas frecuentes
- Trazabilidad: cada evento debe poder auditarse
- Consistencia: un mismo dato debe tener un unico origen de verdad
- Escalabilidad: la solucion debe soportar nuevas reglas sin redisenar todo
- Seguridad: acceso protegido y controlado por roles

## 8. Criterios de exito

- Disminucion del tiempo para registrar y consultar eventos diarios
- Reduccion de errores manuales
- Mayor claridad sobre atrasos y salidas anticipadas
- Adopcion por parte del equipo operativo
- Capacidad de auditoria sobre el historial escolar

## 9. Suposiciones de negocio

- Cada estudiante pertenece a un curso activo
- Un estudiante puede tener mas de un evento de asistencia a lo largo del tiempo
- Las salidas anticipadas requieren autorizacion interna
- El sistema sera usado en un contexto escolar con jornada diaria

## 10. Restricciones iniciales

- El acceso debe ser autenticado
- La informacion debe conservarse con historial
- No se deben permitir registros inconsistentes por fecha o estudiante
- Las relaciones principales deben evitar duplicidad de eventos por dia
