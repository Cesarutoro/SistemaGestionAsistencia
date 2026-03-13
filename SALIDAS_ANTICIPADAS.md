# API de Salidas Anticipadas

## Descripción

Módulo para registrar y gestionar salidas anticipadas de estudiantes autorizadas, particularmente para casos médicos. Permite registrar la hora de salida autorizada, el motivo y observaciones.

## Características

- ✅ Validación exhaustiva de datos de entrada
- ✅ Registro de hora de salida autorizada
- ✅ Identificación de motivos médicos
- ✅ Auditoría de autorización
- ✅ Pruebas unitarias completas (34 tests)
- ✅ Manejo de errores robusto

## Tabla de Base de Datos

```sql
CREATE TABLE salidas_anticipadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_salida TIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  es_medico TINYINT(1) DEFAULT 1,
  autorizado_por INT,
  autorizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE,
  FOREIGN KEY (autorizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE KEY unique_salida_anticipada (estudiante_id, fecha)
);
```

## Endpoints

### 1. Registrar nueva salida anticipada

**POST** `/api/salidas-anticipadas`

Registra una nueva salida anticipada autorizada para un estudiante.

#### Request Body

```json
{
  "estudiante_id": 1,
  "fecha": "2024-01-15",
  "hora_salida": "14:30",
  "motivo": "Cita médica con el dentista",
  "es_medico": true,
  "observaciones": "Requiere acompañamiento de un adulto"
}
```

#### Validaciones

- `estudiante_id`: Número entero positivo, requerido
- `fecha`: Formato YYYY-MM-DD, no puede ser futura, requerida
- `hora_salida`: Formato HH:MM o HH:MM:SS, mínimo 08:00, requerida
- `motivo`: String de 3-255 caracteres, requerido
- `es_medico`: Booleano o 0/1, opcional (default: true)
- `observaciones`: String de máximo 255 caracteres, opcional

#### Response 201

```json
{
  "mensaje": "Salida anticipada registrada correctamente",
  "id": 5,
  "datos": {
    "estudiante_id": 1,
    "fecha": "2024-01-15",
    "hora_salida": "14:30:00",
    "motivo": "Cita médica con el dentista",
    "es_medico": true
  }
}
```

#### Response 400 (Error de Validación)

```json
{
  "error": "Datos inválidos",
  "errores": [
    "estudiante_id inválido o no proporcionado",
    "fecha inválida o en el futuro (formato: YYYY-MM-DD)"
  ]
}
```

---

### 2. Obtener salidas anticipadas de un estudiante

**GET** `/api/salidas-anticipadas/estudiante/:estudianteId`

Obtiene todas las salidas anticipadas de un estudiante, opcionalmente filtrado por fecha.

#### Query Parameters

- `fecha` (opcional): Formato YYYY-MM-DD para filtrar por una fecha específica

#### Ejemplos

```
GET /api/salidas-anticipadas/estudiante/1
GET /api/salidas-anticipadas/estudiante/1?fecha=2024-01-15
```

#### Response 200

```json
[
  {
    "id": 5,
    "estudiante_id": 1,
    "fecha": "2024-01-15",
    "hora_salida": "14:30:00",
    "motivo": "Cita médica con el dentista",
    "es_medico": 1,
    "autorizado_en": "2024-01-15 10:30:45",
    "observaciones": "Requiere acompañamiento"
  },
  {
    "id": 6,
    "estudiante_id": 1,
    "fecha": "2024-01-20",
    "hora_salida": "15:00:00",
    "motivo": "Consulta oftalmológica",
    "es_medico": 1,
    "autorizado_en": "2024-01-20 08:45:30",
    "observaciones": null
  }
]
```

---

### 3. Obtener salidas anticipadas de un curso

**GET** `/api/salidas-anticipadas/curso/:cursoId`

Obtiene todas las salidas anticipadas registradas para un curso en una fecha específica.

#### Query Parameters

- `fecha` (opcional): Formato YYYY-MM-DD. Si no se proporciona, usa la fecha actual.

#### Ejemplos

```
GET /api/salidas-anticipadas/curso/3
GET /api/salidas-anticipadas/curso/3?fecha=2024-01-15
```

#### Response 200

```json
[
  {
    "id": 5,
    "estudiante_id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12.345.678-K",
    "fecha": "2024-01-15",
    "hora_salida": "14:30:00",
    "motivo": "Cita médica",
    "es_medico": 1,
    "autorizado_en": "2024-01-15 10:30:45",
    "observaciones": null
  },
  {
    "id": 7,
    "estudiante_id": 2,
    "nombre": "María",
    "apellido": "González",
    "rut": "23.456.789-L",
    "fecha": "2024-01-15",
    "hora_salida": "15:00:00",
    "motivo": "Problema dental",
    "es_medico": 1,
    "autorizado_en": "2024-01-15 11:15:20",
    "observaciones": null
  }
]
```

---

### 4. Obtener detalle de una salida anticipada

**GET** `/api/salidas-anticipadas/:id`

Obtiene los detalles de una salida anticipada específica.

#### Response 200

```json
{
  "id": 5,
  "estudiante_id": 1,
  "fecha": "2024-01-15",
  "hora_salida": "14:30:00",
  "motivo": "Cita médica con el dentista",
  "es_medico": 1,
  "autorizado_en": "2024-01-15 10:30:45",
  "observaciones": "Requiere acompañamiento"
}
```

#### Response 404

```json
{
  "error": "Salida anticipada no encontrada"
}
```

---

### 5. Actualizar salida anticipada

**PUT** `/api/salidas-anticipadas/:id`

Actualiza los datos de una salida anticipada registrada.

#### Request Body (todos los campos opcionales)

```json
{
  "hora_salida": "15:00",
  "motivo": "Cita médica actualizada",
  "es_medico": true,
  "observaciones": "Nueva observación"
}
```

#### Response 200

```json
{
  "mensaje": "Salida anticipada actualizada correctamente",
  "id": 5
}
```

---

### 6. Eliminar salida anticipada por ID

**DELETE** `/api/salidas-anticipadas/:id`

Elimina una salida anticipada específica.

#### Response 200

```json
{
  "mensaje": "Salida anticipada eliminada correctamente"
}
```

#### Response 404

```json
{
  "error": "Salida anticipada no encontrada"
}
```

---

### 7. Eliminar salida anticipada por estudiante y fecha

**DELETE** `/api/salidas-anticipadas/estudiante/:estudianteId/fecha/:fecha`

Elimina la salida anticipada de un estudiante en una fecha específica.

#### Parámetros

- `estudianteId`: ID del estudiante
- `fecha`: Formato YYYY-MM-DD

#### Ejemplo

```
DELETE /api/salidas-anticipadas/estudiante/1/fecha/2024-01-15
```

#### Response 200

```json
{
  "mensaje": "Salida anticipada eliminada correctamente"
}
```

---

## Utilidades (earlyExit.js)

El módulo `src/utils/earlyExit.js` proporciona funciones de validación reutilizables:

### Funciones Disponibles

```javascript
// Validar hora (HH:MM o HH:MM:SS)
validarHoraSalida(hora) → boolean

// Validar fecha (YYYY-MM-DD, no futuro)
validarFecha(fecha) → boolean

// Validar motivo (3-255 caracteres)
validarMotivo(motivo) → boolean

// Validar booleano es_medico
validarEsMedico(esMedico) → boolean

// Normalizar hora a HH:MM:SS
normalizarHora(hora) → string

// Validar completo una salida anticipada
validarSalidaAnticipada(datos) → { valido: boolean, errores: string[] }

// Normalizar datos de entrada
normalizarDatos(datos) → object

// Verificar que hora sea válida para salida (>= 08:00)
esHoraSalidaValida(horaSalida, horaMinima) → boolean
```

## Pruebas Unitarias

Se incluyen 34 pruebas unitarias exhaustivas que cubren:

- ✅ Validación de horas
- ✅ Validación de fechas
- ✅ Validación de motivos
- ✅ Validación de booleanos
- ✅ Normalización de datos
- ✅ Flujos completos de validación
- ✅ Manejo de errores múltiples

Ejecutar pruebas:

```bash
cd backend
npm test -- tests/earlyExit.test.js
```

## Ejemplos de Uso

### Ejemplo 1: Registrar salida por motivo médico

```bash
curl -X POST http://localhost:4000/api/salidas-anticipadas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "estudiante_id": 1,
    "fecha": "2024-01-15",
    "hora_salida": "14:30",
    "motivo": "Cita con pediatra",
    "es_medico": true,
    "observaciones": "Requiere acompañamiento"
  }'
```

### Ejemplo 2: Obtener todas las salidas de un estudiante

```bash
curl http://localhost:4000/api/salidas-anticipadas/estudiante/1 \
  -H "Authorization: Bearer {token}"
```

### Ejemplo 3: Obtener salidas de un curso en una fecha

```bash
curl "http://localhost:4000/api/salidas-anticipadas/curso/3?fecha=2024-01-15" \
  -H "Authorization: Bearer {token}"
```

### Ejemplo 4: Actualizar salida

```bash
curl -X PUT http://localhost:4000/api/salidas-anticipadas/5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "hora_salida": "15:00",
    "observaciones": "Cambio de horario autorizado"
  }'
```

## Consideraciones de Seguridad

- Todas las rutas están protegidas con autenticación JWT
- Se valida exhaustivamente toda entrada del usuario
- Se registra quién autoriza cada salida (via `autorizado_por`)
- Se usa `UNIQUE KEY` para prevenir duplicados por estudiante/fecha
- Las fechas futuras son rechazadas automáticamente

## Notas de Implementación

- La hora mínima para una salida es las 08:00 (configurable)
- Solo se permite una salida anticipada por estudiante por día
- Los tiempos se normalizan a formato HH:MM:SS en la BD
- Los motivos se limpian de espacios en blanco al guardar
- Las observaciones son opcionales pero se recomiendan para trazabilidad
