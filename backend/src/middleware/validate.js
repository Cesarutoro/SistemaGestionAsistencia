const { z } = require("zod");

const schemas = {
  login: z.object({
    email: z.string().email("Email inválido").max(255),
    password: z.string().min(1, "Contraseña requerida").max(255),
  }),

  crearEstudiante: z.object({
    rut: z.string().min(1, "RUT es obligatorio").max(20),
    nombre: z.string().min(1, "Nombre es obligatorio").max(100),
    apellido: z.string().min(1, "Apellido es obligatorio").max(100),
    sexo: z.string().max(10).optional().default(""),
    curso_id: z.number().int().positive("curso_id debe ser un número positivo"),
  }),

  actualizarEstudiante: z.object({
    rut: z.string().min(1, "RUT es obligatorio").max(20).optional(),
    nombre: z.string().min(1, "Nombre es obligatorio").max(100).optional(),
    apellido: z.string().min(1, "Apellido es obligatorio").max(100).optional(),
    sexo: z.string().max(10).optional(),
    curso_id: z.number().int().positive().optional(),
  }),

  crearCurso: z.object({
    nombre: z.string().min(1, "Nombre del curso es obligatorio").max(50),
  }),

  actualizarCurso: z.object({
    nombre: z.string().min(1, "Nombre del curso es obligatorio").max(50),
  }),

  marcarAsistencia: z.object({
    estudiante_id: z.number().int().positive(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD"),
    hora_ingreso: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora debe ser HH:MM o HH:MM:SS"),
  }),

  justificarAtraso: z.object({
    justificado: z.boolean(),
    justificacion_descripcion: z.string().max(500).nullable().optional(),
  }),

  editarHora: z.object({
    hora_ingreso: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Hora debe ser HH:MM o HH:MM:SS"),
  }),

  crearSalidaAnticipada: z.object({
    estudiante_id: z.number().int().positive(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD"),
    hora_salida: z.string().regex(/^\d{2}:\d{2}$/, "Hora debe ser HH:MM"),
    motivo: z.string().min(3, "Motivo debe tener al menos 3 caracteres").max(255),
    es_medico: z.boolean().optional().default(true),
    observaciones: z.string().max(500).nullable().optional(),
  }),

  crearUsuario: z.object({
    nombre: z.string().min(1, "Nombre es obligatorio").max(100),
    email: z.string().email("Email inválido").max(255),
    password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres").max(255),
    rol: z.enum(["admin", "director", "inspector"]),
    permisos: z.record(z.boolean()).optional(),
  }),

  bulkUpdateCurso: z.object({
    estudiante_ids: z.array(z.number().int().positive()).min(1, "Debe incluir al menos un estudiante"),
    curso_id: z.number().int().positive("curso_id debe ser un número positivo"),
  }),
};

function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();

    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errores = result.error.issues.map((i) => i.message);
      return res.status(400).json({ error: "Datos inválidos", detalles: errores });
    }

    req.body = result.data;
    next();
  };
}

module.exports = { validate, schemas };
