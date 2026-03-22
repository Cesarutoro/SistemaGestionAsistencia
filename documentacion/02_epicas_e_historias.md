# Epicas e Historias de Usuario

## 1. Epicas del producto

### E1. Autenticacion y acceso
Gestion de sesiones y control de acceso por perfil de usuario.

### E2. Gestion academica base
Alta, edicion, consulta y eliminacion de cursos y estudiantes.

### E3. Asistencia diaria
Registro de ingreso, deteccion de atrasos y consulta historica.

### E4. Salidas anticipadas
Registro y seguimiento de salidas antes del termino de jornada.

### E5. Consulta y seguimiento
Visualizacion de resumentes por curso, fecha y estudiante.

### E6. Administracion y auditoria
Control de usuarios, trazabilidad y soporte para operaciones internas.

## 2. Historias de usuario por epica

### E1. Autenticacion y acceso

#### HU-01 Iniciar sesion
Como usuario autorizado, quiero iniciar sesion con mis credenciales para acceder al sistema segun mi perfil.

Criterios de aceptacion:
- El sistema valida credenciales correctas
- El sistema rechaza credenciales invalidas
- El usuario autenticado recibe acceso a las secciones permitidas

#### HU-02 Cerrar sesion
Como usuario autenticado, quiero cerrar sesion para proteger el acceso a la informacion.

Criterios de aceptacion:
- La sesion se invalida correctamente
- El usuario es redirigido a la pantalla de acceso

### E2. Gestion academica base

#### HU-03 Crear curso
Como administrador, quiero crear cursos para organizar la estructura academica.

Criterios de aceptacion:
- Se registra un nombre de curso unico
- El sistema evita duplicados

#### HU-04 Listar cursos
Como usuario operativo, quiero ver el listado de cursos para navegar la informacion academica.

Criterios de aceptacion:
- Los cursos se ordenan alfabeticamente
- El listado muestra la informacion esencial

#### HU-05 Crear estudiante
Como administrador, quiero registrar estudiantes para asociarlos a su curso correspondiente.

Criterios de aceptacion:
- Se registra identificador unico del estudiante
- Se valida la relacion con un curso existente
- El sistema almacena nombre, apellido y atributos basicos

#### HU-06 Editar estudiante
Como administrador, quiero actualizar datos de un estudiante para mantener la informacion vigente.

Criterios de aceptacion:
- Se pueden modificar campos permitidos
- Los cambios quedan persistidos inmediatamente

### E3. Asistencia diaria

#### HU-07 Registrar asistencia
Como inspector o usuario autorizado, quiero registrar la hora de ingreso de un estudiante para controlar asistencia diaria.

Criterios de aceptacion:
- Se guarda fecha y hora de ingreso
- El sistema marca automaticamente si existe atraso
- No se duplica el registro del mismo estudiante en el mismo dia

#### HU-08 Justificar atraso
Como usuario autorizado, quiero marcar un atraso como justificado para reflejar la situacion real del estudiante.

Criterios de aceptacion:
- El estado de justificacion se puede modificar
- El historial conserva el registro original

#### HU-09 Consultar atrasos
Como usuario operativo, quiero revisar atrasos por estudiante o curso para hacer seguimiento.

Criterios de aceptacion:
- Se filtra por curso o estudiante
- Los atrasos se muestran en orden temporal descendente

### E4. Salidas anticipadas

#### HU-10 Registrar salida anticipada
Como inspector o usuario autorizado, quiero registrar una salida anticipada para dejar evidencia del retiro previo de un estudiante.

Criterios de aceptacion:
- Se registra fecha, hora y motivo
- Se identifica si la salida es de caracter medico
- Se guarda quien autorizo la salida
- No se permite mas de una salida por estudiante en el mismo dia

#### HU-11 Consultar salidas anticipadas
Como usuario operativo, quiero consultar salidas anticipadas por curso o estudiante para obtener trazabilidad completa.

Criterios de aceptacion:
- Se puede filtrar por curso, estudiante o fecha
- La informacion muestra el detalle de autorizacion

#### HU-12 Actualizar salida anticipada
Como usuario autorizado, quiero corregir una salida anticipada para mantener la consistencia del dato.

Criterios de aceptacion:
- Se pueden editar campos permitidos
- Los cambios quedan auditables

### E5. Consulta y seguimiento

#### HU-13 Ver panel resumen
Como usuario directivo, quiero ver un resumen operativo para evaluar rapidamente la situacion del dia.

Criterios de aceptacion:
- El panel muestra indicadores clave
- La informacion se actualiza con los datos registrados

#### HU-14 Navegar por curso
Como usuario operativo, quiero abrir un curso y ver su estado diario para tomar decisiones rapidas.

Criterios de aceptacion:
- Se listan estudiantes asociados
- Se visualizan atrasos y salidas del dia

### E6. Administracion y auditoria

#### HU-15 Gestionar usuarios
Como administrador, quiero administrar usuarios y roles para controlar el acceso al sistema.

Criterios de aceptacion:
- Se pueden crear, editar y eliminar usuarios
- Cada usuario tiene un rol definido

#### HU-16 Revisar trazabilidad
Como supervisor, quiero revisar quien realizo una accion para respaldar auditorias internas.

Criterios de aceptacion:
- El sistema registra autor y fecha de operaciones relevantes
- La informacion es consultable posteriormente

## 3. Priorizacion sugerida

### Alta
- Iniciar sesion
- Crear curso
- Crear estudiante
- Registrar asistencia
- Registrar salida anticipada
- Consultar atrasos

### Media
- Justificar atraso
- Consultar salidas anticipadas
- Ver panel resumen
- Gestionar usuarios

### Baja
- Actualizar salida anticipada
- Trazabilidad avanzada
- Funciones de reporte ampliadas

## 4. Definicion de terminado para historias

Una historia se considera terminada cuando:

- Tiene criterios de aceptacion claros
- Puede probarse con un flujo verificable
- Tiene validaciones minimas definidas
- No rompe el modelo de datos ni la seguridad
- Queda documentada y trazable en el backlog
