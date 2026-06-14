Módulo de Notificaciones Automáticas — Guía de Despliegue y Pruebas

Este documento detalla la configuración y el proceso de pruebas para el sistema de alertas por correo electrónico de Salidas Anticipadas y Atrasos Escolares en el entorno de desarrollo local, utilizando la infraestructura de la API de Resend.

🔐 1. Configuración del Entorno (.env)

    ⚠️ Ubicación Obligatoria: Las variables deben declararse exclusivamente en el archivo .env ubicado en la raíz principal del proyecto (SistemaGestionAsistencia/.env), no dentro de la subcarpeta del backend.

Añada las siguientes líneas al final de su archivo de configuración local:
Fragmento de código

# ====== CONFIGURACIÓN MÓDULO DE NOTIFICACIONES ======
ENVIAR_CORREOS_REALES=false
CORREO_TEST_DESARROLLO=testing.notificaciones.atrasos@gmail.com
RESEND_API_KEY="""SOLICITAR_API_KEY_DE_TESTING_AL_EQUIPO"""
NOTIFICACION_ATRASO_INMEDIATA=true

Nota: Mientras ENVIAR_CORREOS_REALES se mantenga en false, el sistema interceptará de forma segura el flujo y desviará automáticamente todos los correos hacia el buzón de control (testing.notificaciones.atrasos@gmail.com), evitando el envío accidental de alertas a las bandejas personales de apoderados reales.

🏗️ 2. Arquitectura y Archivos del Módulo

El sistema de notificaciones opera de manera asíncrona en segundo plano (background worker) para no añadir latencia a las respuestas HTTP. Su lógica se distribuye en tres puntos clave del Backend:

    backend/src/utils/notificationService.js: Centraliza la inicialización del cliente de Resend y exporta las funciones core notificarApoderadoSalida(datos) y notificarApoderadoAtraso(datos) con las maquetas de diseño institucional.

    backend/src/routes/salidas-anticipadas.js: Activa la notificación de salida en la ruta POST / inmediatamente después de registrar la salida anticipada en la base de datos de manera exitosa.

    backend/src/routes/asistencia.js: Activa la notificación de atraso en la ruta POST / condicionado a si la hora de ingreso registrada constituye un retraso evaluado por el sistema.

🚀 3. Guía de Pruebas Paso a Paso (Postman)

Siga este orden lógico en Postman para comprobar de forma integrada el correcto funcionamiento del circuito de notificaciones:
Paso 1: Sincronizar Rama e Instalar Dependencias

Actualice sus cambios e instale el SDK oficial de Resend ejecutando en su terminal:
Bash

git pull origin <nombre-de-rama>
cd backend
npm install

Paso 2: Autenticación del Operador

Dado que los módulos de asistencia requieren verificación de sesión, debe obtener un Token JWT válido antes de realizar las pruebas:

    Método: POST

    URL: http://localhost:4000/api/auth/login

    Payload (JSON Body): Credenciales de una cuenta local activa (Inspector, Director o Administrador).

    Acción: Copie el string completo de la propiedad "token" devuelto en la respuesta.

Paso 3: Testear Alerta de Salida Anticipada

    Método: POST

    URL: http://localhost:4000/api/salidas-anticipadas

    Headers / Auth: Seleccione la pestaña Authorization, escoja el tipo Bearer Token y pegue el token copiado en el paso anterior.

    Body (raw JSON): Asegure el envío de un estudiante_id que exista en sus tablas locales.

JSON

{
  "estudiante_id": 1,
  "fecha": "2026-06-15",
  "hora_salida": "12:30",
  "motivo": "Retiro autorizado por control médico",
  "es_medico": true,
  "observaciones": "Prueba de integración de correo de salida"
}

Paso 4: Testear Alerta de Atraso Escolar

    Método: POST

    URL: http://localhost:4000/api/asistencia

    Headers / Auth: Mantenga el mismo token de autorización Bearer activo en las cabeceras.

    Body (raw JSON): Ingrese una hora de entrada que supere el límite horario establecido (ej. posterior a las 08:00:00).

JSON

{
  "estudiante_id": 1,
  "fecha": "2026-06-15",
  "hora_ingreso": "08:20:00"
}

📬 4. Verificación de Resultados

    Logs en Consola: Al gatillar los métodos POST desde Postman, la terminal del servidor Node.js imprimirá en segundo plano mensajes de éxito parecidos a: ✨ Notificación enviada con éxito. Destinatario final: testing.notificaciones.atrasos@gmail.com.

    Revisión del Buzón Virtual: Acceda al correo electrónico de desarrollo corporativo del proyecto.

    Tratamiento de Filtros Antispam: Debido al uso del dominio genérico Sandbox de cortesía (onboarding@resend.dev) en redes locales (localhost), los correos llegarán a la carpeta de Spam. Debe hacer clic en el botón "Parece seguro" o "No es Spam" dentro de Gmail para habilitar la visualización del diseño HTML y constatar el traspaso de datos dinámicos.