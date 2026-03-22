# Requisitos del Producto

## 1. Requisitos funcionales

### RF-01 Autenticacion
El sistema debe autenticar usuarios mediante credenciales validas.

### RF-02 Control de acceso
El sistema debe restringir el acceso a funciones segun el rol del usuario.

### RF-03 Gestion de cursos
El sistema debe permitir crear, consultar, editar y eliminar cursos, con control de integridad.

### RF-04 Gestion de estudiantes
El sistema debe permitir crear, consultar, editar y eliminar estudiantes, asociandolos a un curso.

### RF-05 Registro de asistencia
El sistema debe permitir registrar la hora de ingreso de un estudiante por dia.

### RF-06 Deteccion de atrasos
El sistema debe clasificar automaticamente un ingreso como atraso cuando corresponda.

### RF-07 Justificacion de atrasos
El sistema debe permitir justificar un atraso registrado.

### RF-08 Registro de salidas anticipadas
El sistema debe permitir registrar la salida anticipada de un estudiante con motivo, hora y autorizacion.

### RF-09 Consultas operativas
El sistema debe permitir consultar asistencia, atrasos y salidas por fecha, curso o estudiante.

### RF-10 Panel de control
El sistema debe ofrecer un resumen operativo para toma de decisiones.

### RF-11 Auditoria basica
El sistema debe conservar informacion relevante de quien ejecuto una accion y cuando.

## 2. Requisitos no funcionales

### RNF-01 Seguridad
La aplicacion debe proteger el acceso a informacion sensible mediante autenticacion y autorizacion.

### RNF-02 Integridad
Los datos deben mantener consistencia referencial entre cursos, estudiantes y eventos diarios.

### RNF-03 Trazabilidad
Las operaciones criticas deben conservar historial suficiente para auditoria interna.

### RNF-04 Usabilidad
La interfaz debe permitir que usuarios no tecnicos ejecuten tareas frecuentes con pocos pasos.

### RNF-05 Rendimiento
Las consultas frecuentes por curso o estudiante deben responder con tiempos aptos para operacion diaria.

### RNF-06 Escalabilidad
La arquitectura debe permitir agregar nuevos modulos sin reescribir el nucleo del sistema.

### RNF-07 Disponibilidad
El sistema debe ser utilizable durante la jornada escolar, con manejo claro de errores.

### RNF-08 Mantenibilidad
El codigo y la documentacion deben estar organizados por dominio funcional.

## 3. Reglas de negocio

### RN-01 Unicidad de curso
No puede existir mas de un curso con el mismo nombre.

### RN-02 Unicidad de estudiante
Cada estudiante debe identificarse con un documento unico.

### RN-03 Un evento por dia
Un estudiante no debe tener mas de un registro principal de asistencia o salida anticipada por dia.

### RN-04 Salida anticipada con autorizacion
Toda salida anticipada debe quedar asociada a una autorizacion interna.

### RN-05 Horario valido
Las marcas de asistencia y salida deben corresponder a una jornada escolar valida.

### RN-06 Consistencia temporal
No se deben aceptar fechas futuras para eventos historicos de jornada.

## 4. Requisitos de informacion

El sistema debe almacenar como minimo:

- Identificacion del curso
- Identificacion del estudiante
- Fecha del evento
- Hora del evento
- Tipo de evento
- Motivo o justificacion cuando aplique
- Usuario que registra o autoriza
- Fecha y hora de auditoria

## 5. Requisitos de integracion futura

- Exportacion de reportes en XLSX o PDF
- Notificaciones a apoderados
- Integracion con sistemas de comunicacion escolar
- Consolidacion de indicadores de asistencia

## 6. Matriz de prioridad

| Requisito | Prioridad | Observacion |
| --- | --- | --- |
| RF-01 | Alta | Base del acceso al sistema |
| RF-03 | Alta | Soporte a estructura academica |
| RF-04 | Alta | Base del registro diario |
| RF-05 | Alta | Funcion operativa esencial |
| RF-08 | Alta | Diferenciador funcional |
| RF-09 | Alta | Necesario para seguimiento |
| RF-10 | Media | Valor para supervision |
| RF-11 | Media | Soporte a auditoria |
| RNF-01 | Alta | Critico para el producto |
| RNF-02 | Alta | Garantiza calidad del dato |
| RNF-04 | Media | Importante para adopcion |
