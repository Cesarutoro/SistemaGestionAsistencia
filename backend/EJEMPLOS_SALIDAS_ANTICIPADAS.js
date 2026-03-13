/**
 * EJEMPLOS DE USO: Módulo de Salidas Anticipadas
 *
 * Este archivo muestra casos de uso reales del módulo de salidas anticipadas
 * implementado en el sistema de gestión de estudiantes.
 */

// ============================================================================
// CASO 1: Registrar salida por cita médica de emergencia
// ============================================================================

// Escenario: Un estudiante necesita salir antes porque tiene cita médica urgente

const caso1 = {
  metodo: "POST",
  endpoint: "/api/salidas-anticipadas",
  datos: {
    estudiante_id: 1,
    fecha: "2024-01-15",
    hora_salida: "14:30",
    motivo: "Cita con pediatra - Dolor de garganta",
    es_medico: true,
    observaciones: "Requiere acompañamiento de padre/madre. Cita confirmada",
  },
  respuestaEsperada: {
    status: 201,
    body: {
      mensaje: "Salida anticipada registrada correctamente",
      id: 5,
      datos: {
        estudiante_id: 1,
        fecha: "2024-01-15",
        hora_salida: "14:30:00",
        motivo: "Cita con pediatra - Dolor de garganta",
        es_medico: true,
      },
    },
  },
};

// ============================================================================
// CASO 2: Registrar salida por tratamiento dental
// ============================================================================

const caso2 = {
  metodo: "POST",
  endpoint: "/api/salidas-anticipadas",
  datos: {
    estudiante_id: 2,
    fecha: "2024-01-16",
    hora_salida: "15:00",
    motivo: "Consulta ortodóntica",
    es_medico: true,
    observaciones: "Cita programada previamente",
  },
  notas:
    "Para este caso, el docente registra la salida antes de que el estudiante se vaya",
};

// ============================================================================
// CASO 3: Consultar todas las salidas de un estudiante
// ============================================================================

const caso3 = {
  metodo: "GET",
  endpoint: "/api/salidas-anticipadas/estudiante/1",
  notas: "Obtiene todas las salidas anticipadas registradas para el estudiante",
  respuestaEsperada: {
    status: 200,
    body: [
      {
        id: 5,
        estudiante_id: 1,
        fecha: "2024-01-15",
        hora_salida: "14:30:00",
        motivo: "Cita con pediatra - Dolor de garganta",
        es_medico: 1,
        autorizado_en: "2024-01-15 10:30:45",
        observaciones: "Requiere acompañamiento",
      },
      {
        id: 8,
        estudiante_id: 1,
        fecha: "2024-01-20",
        hora_salida: "14:00:00",
        motivo: "Consulta oftalmológica",
        es_medico: 1,
        autorizado_en: "2024-01-20 09:15:30",
        observaciones: null,
      },
    ],
  },
};

// ============================================================================
// CASO 4: Consultar salidas de un curso en una fecha específica
// ============================================================================

const caso4 = {
  metodo: "GET",
  endpoint: "/api/salidas-anticipadas/curso/3?fecha=2024-01-15",
  descripcion:
    "Docente de 3ro Básico consulta quién tiene salida anticipada para hoy",
  respuestaEsperada: {
    status: 200,
    body: [
      {
        id: 5,
        estudiante_id: 1,
        nombre: "Juan",
        apellido: "Pérez",
        rut: "12.345.678-K",
        fecha: "2024-01-15",
        hora_salida: "14:30:00",
        motivo: "Cita con pediatra",
        es_medico: 1,
        autorizado_en: "2024-01-15 10:30:45",
        observaciones: null,
      },
      {
        id: 7,
        estudiante_id: 3,
        nombre: "María",
        apellido: "González",
        rut: "23.456.789-L",
        fecha: "2024-01-15",
        hora_salida: "15:00:00",
        motivo: "Problema dental urgente",
        es_medico: 1,
        autorizado_en: "2024-01-15 11:45:20",
        observaciones: null,
      },
    ],
  },
  casoUso:
    "El docente sabe que Juan debe salir a las 14:30 y María a las 15:00",
};

// ============================================================================
// CASO 5: Actualizar hora de salida
// ============================================================================

const caso5 = {
  metodo: "PUT",
  endpoint: "/api/salidas-anticipadas/5",
  descripcion: "La cita del estudiante fue reprogramada, se actualiza la hora",
  datos: {
    hora_salida: "15:30",
  },
  respuestaEsperada: {
    status: 200,
    body: {
      mensaje: "Salida anticipada actualizada correctamente",
      id: 5,
    },
  },
};

// ============================================================================
// CASO 6: Registrar salida por tratamiento médico (no es cita)
// ============================================================================

const caso6 = {
  metodo: "POST",
  endpoint: "/api/salidas-anticipadas",
  datos: {
    estudiante_id: 4,
    fecha: "2024-01-17",
    hora_salida: "13:00",
    motivo: "Sesión de fonoaudiología",
    es_medico: true,
    observaciones: "Tratamiento continuo programado semanalmente",
  },
  casoUso: "Estudiante con tratamiento regular debe salir antes",
};

// ============================================================================
// CASO 7: Registrar salida por otro motivo (no médico)
// ============================================================================

const caso7 = {
  metodo: "POST",
  endpoint: "/api/salidas-anticipadas",
  datos: {
    estudiante_id: 5,
    fecha: "2024-01-18",
    hora_salida: "14:00",
    motivo: "Asunto familiar urgente",
    es_medico: false,
    observaciones: "Autorizado por apoderado",
  },
  notas: "es_medico se configura a false para asuntos no médicos",
};

// ============================================================================
// CASO 8: Intentar registrar con datos inválidos
// ============================================================================

const caso8_error1 = {
  metodo: "POST",
  endpoint: "/api/salidas-anticipadas",
  datos: {
    estudiante_id: 1,
    fecha: "2025-12-31", // FUTURO - INVÁLIDO
    hora_salida: "14:30",
    motivo: "Cita médica",
  },
  respuestaEsperada: {
    status: 400,
    body: {
      error: "Datos inválidos",
      errores: ["fecha inválida o en el futuro (formato: YYYY-MM-DD)"],
    },
  },
};

const caso8_error2 = {
  metodo: "POST",
  endpoint: "/api/salidas-anticipadas",
  datos: {
    estudiante_id: 1,
    fecha: "2024-01-15",
    hora_salida: "07:00", // ANTES DE 08:00 - INVÁLIDO
    motivo: "Cita médica",
  },
  respuestaEsperada: {
    status: 400,
    body: {
      error: "Hora de salida inválida",
      mensaje: "La salida debe ser después de las 08:00",
    },
  },
};

const caso8_error3 = {
  metodo: "POST",
  endpoint: "/api/salidas-anticipadas",
  datos: {
    estudiante_id: 1,
    fecha: "2024-01-15",
    hora_salida: "14:30",
    motivo: "ab", // DEMASIADO CORTO - INVÁLIDO
  },
  respuestaEsperada: {
    status: 400,
    body: {
      error: "Datos inválidos",
      errores: ["motivo inválido (mínimo 3 caracteres, máximo 255)"],
    },
  },
};

// ============================================================================
// CASO 9: Eliminar salida anticipada
// ============================================================================

const caso9 = {
  metodo: "DELETE",
  endpoint: "/api/salidas-anticipadas/5",
  descripcion: "Se cancela una salida porque la cita fue reprogramada",
  respuestaEsperada: {
    status: 200,
    body: {
      mensaje: "Salida anticipada eliminada correctamente",
    },
  },
};

// ============================================================================
// CASO 10: Flujo completo de un día escolar
// ============================================================================

const casoCompleto = {
  descripcion: "Flujo típico de un docente durante un día de clases",
  pasos: [
    {
      momento: "08:00 - Inicio de clases",
      accion: "Docente revisa salidas anticipadas del día",
      endpoint: "GET /api/salidas-anticipadas/curso/3",
      proposito: "Saber cuál es la estructura del día",
    },
    {
      momento: "10:30 - En clases",
      accion: "Director autoriza salida de Juan (cita médica)",
      endpoint: "POST /api/salidas-anticipadas",
      datos: {
        estudiante_id: 1,
        fecha: "2024-01-15",
        hora_salida: "14:30",
        motivo: "Cita con pediatra",
        es_medico: true,
      },
    },
    {
      momento: "14:25 - Antes de la salida",
      accion: "Docente confirma que Juan tiene autorización",
      endpoint: "GET /api/salidas-anticipadas/estudiante/1?fecha=2024-01-15",
      proposito: "Verificar la salida",
    },
    {
      momento: "14:30",
      accion: "Juan se retira del colegio",
    },
    {
      momento: "15:00 - Después de clases",
      accion: "Si hay cambios, se actualiza la información",
      endpoint: "PUT /api/salidas-anticipadas/5",
      proposito: "Actualizar registros",
    },
  ],
};

// ============================================================================
// RESUMEN DE VALIDACIONES
// ============================================================================

const validaciones = {
  estudiante_id: {
    tipo: "número",
    restricciones: ["requerido", "positivo", "debe existir en BD"],
    ejemplosValidos: [1, 2, 3, 10],
    ejemplosInvalidos: [0, -1, "texto", null],
  },
  fecha: {
    tipo: "string YYYY-MM-DD",
    restricciones: ["requerido", "no puede ser futuro", "formato específico"],
    ejemplosValidos: ["2024-01-15", "2023-12-25"],
    ejemplosInvalidos: ["2025-01-15", "15-01-2024", "2024/01/15"],
  },
  hora_salida: {
    tipo: "string HH:MM o HH:MM:SS",
    restricciones: ["requerido", "mínimo 08:00", "máximo 23:59"],
    ejemplosValidos: ["14:30", "14:30:00", "08:00"],
    ejemplosInvalidos: ["07:59", "24:00", "14:60", "invalid"],
  },
  motivo: {
    tipo: "string",
    restricciones: ["requerido", "3-255 caracteres", "no espacios en blanco"],
    ejemplosValidos: [
      "Cita médica",
      "Consulta dental",
      "Tratamiento fonoaudiología",
    ],
    ejemplosInvalidos: ["ab", "", "muy largo..."],
  },
  es_medico: {
    tipo: "boolean o 0/1",
    restricciones: ["opcional", "default: true/1"],
    ejemplosValidos: [true, false, 1, 0],
    ejemplosInvalidos: ["true", 2, -1],
  },
  observaciones: {
    tipo: "string",
    restricciones: ["opcional", "máximo 255 caracteres"],
    ejemplosValidos: ["Requiere acompañamiento", "Cita confirmada", null],
    ejemplosInvalidos: ["muy largo..."],
  },
};

module.exports = {
  caso1,
  caso2,
  caso3,
  caso4,
  caso5,
  caso6,
  caso7,
  caso8_error1,
  caso8_error2,
  caso8_error3,
  caso9,
  casoCompleto,
  validaciones,
};
