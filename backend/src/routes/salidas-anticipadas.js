const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  validarSalidaAnticipada,
  normalizarDatos,
  esHoraSalidaValida,
} = require("../utils/earlyExit");

/**
 * GET /api/salidas-anticipadas/estudiante/:estudianteId
 * Obtiene todas las salidas anticipadas de un estudiante
 */
router.get("/estudiante/:estudianteId", async (req, res) => {
  const { estudianteId } = req.params;
  const { fecha } = req.query; // Opcional: filtrar por fecha específica

  try {
    let query = `
            SELECT id, estudiante_id, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, 
                   hora_salida, motivo, es_medico, 
                   DATE_FORMAT(autorizado_en, '%Y-%m-%d %H:%i:%s') as autorizado_en,
                   observaciones
            FROM salidas_anticipadas
            WHERE estudiante_id = ?
        `;
    const params = [estudianteId];

    if (fecha) {
      query += " AND fecha = ?";
      params.push(fecha);
    }

    query += " ORDER BY fecha DESC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/salidas-anticipadas/curso/:cursoId
 * Obtiene todas las salidas anticipadas de un curso en una fecha
 */
router.get("/curso/:cursoId", async (req, res) => {
  const { cursoId } = req.params;
  const { fecha } = req.query;

  // Usar fecha local si no se provee
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const dateToSearch = fecha || localToday;

  try {
    const [rows] = await pool.query(
      `
            SELECT sa.id, sa.estudiante_id, e.nombre, e.apellido, e.rut,
                   DATE_FORMAT(sa.fecha, '%Y-%m-%d') as fecha,
                   sa.hora_salida, sa.motivo, sa.es_medico,
                   DATE_FORMAT(sa.autorizado_en, '%Y-%m-%d %H:%i:%s') as autorizado_en,
                   sa.observaciones
            FROM salidas_anticipadas sa
            JOIN estudiantes e ON sa.estudiante_id = e.id
            WHERE e.curso_id = ? AND sa.fecha = ?
            ORDER BY e.apellido ASC
        `,
      [cursoId, dateToSearch],
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/salidas-anticipadas/:id
 * Obtiene los detalles de una salida anticipada específica
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
            SELECT id, estudiante_id, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
                   hora_salida, motivo, es_medico,
                   DATE_FORMAT(autorizado_en, '%Y-%m-%d %H:%i:%s') as autorizado_en,
                   observaciones
            FROM salidas_anticipadas
            WHERE id = ?
        `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Salida anticipada no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/salidas-anticipadas
 * Registra una nueva salida anticipada autorizada
 */
router.post("/", async (req, res) => {
  const {
    estudiante_id,
    fecha,
    hora_salida,
    motivo,
    es_medico,
    observaciones,
  } = req.body;

  // Validar entrada
  const datosNormalizados = normalizarDatos(req.body);
  const validacion = validarSalidaAnticipada(datosNormalizados);

  if (!validacion.valido) {
    return res.status(400).json({
      error: "Datos inválidos",
      errores: validacion.errores,
    });
  }

  // Validar que la hora sea razonable
  if (!esHoraSalidaValida(datosNormalizados.hora_salida)) {
    return res.status(400).json({
      error: "Hora de salida inválida",
      mensaje: "La salida debe ser después de las 08:00",
    });
  }

  try {
    // Verificar que el estudiante existe
    const [estudiante] = await pool.query(
      "SELECT id FROM estudiantes WHERE id = ?",
      [datosNormalizados.estudiante_id],
    );

    if (estudiante.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    // Registrar la salida anticipada
    const [result] = await pool.query(
      `INSERT INTO salidas_anticipadas 
             (estudiante_id, fecha, hora_salida, motivo, es_medico, autorizado_por, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             hora_salida = VALUES(hora_salida),
             motivo = VALUES(motivo),
             es_medico = VALUES(es_medico),
             observaciones = VALUES(observaciones),
             autorizado_en = CURRENT_TIMESTAMP`,
      [
        datosNormalizados.estudiante_id,
        datosNormalizados.fecha,
        datosNormalizados.hora_salida,
        datosNormalizados.motivo,
        datosNormalizados.es_medico,
        req.user ? req.user.id : null,
        datosNormalizados.observaciones,
      ],
    );

    res.status(201).json({
      mensaje: "Salida anticipada registrada correctamente",
      id: result.insertId || null,
      datos: {
        estudiante_id: datosNormalizados.estudiante_id,
        fecha: datosNormalizados.fecha,
        hora_salida: datosNormalizados.hora_salida,
        motivo: datosNormalizados.motivo,
        es_medico: !!datosNormalizados.es_medico,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/salidas-anticipadas/:id
 * Actualiza una salida anticipada registrada
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { hora_salida, motivo, es_medico, observaciones } = req.body;

  try {
    // Verificar que existe
    const [salida] = await pool.query(
      "SELECT * FROM salidas_anticipadas WHERE id = ?",
      [id],
    );

    if (salida.length === 0) {
      return res.status(404).json({ error: "Salida anticipada no encontrada" });
    }

    // Preparar datos a actualizar (solo si se proporcionan)
    const datosActualizar = {
      hora_salida: hora_salida || salida[0].hora_salida,
      motivo: motivo || salida[0].motivo,
      es_medico: es_medico !== undefined ? es_medico : salida[0].es_medico,
      observaciones:
        observaciones !== undefined ? observaciones : salida[0].observaciones,
    };

    // Validar los nuevos datos
    const datosNormalizados = normalizarDatos({
      estudiante_id: salida[0].estudiante_id,
      fecha: salida[0].fecha.toISOString().split("T")[0],
      ...datosActualizar,
    });

    const validacion = validarSalidaAnticipada(datosNormalizados);
    if (!validacion.valido) {
      return res.status(400).json({
        error: "Datos inválidos",
        errores: validacion.errores,
      });
    }

    // Actualizar
    await pool.query(
      `UPDATE salidas_anticipadas
             SET hora_salida = ?, motivo = ?, es_medico = ?, observaciones = ?
             WHERE id = ?`,
      [
        datosNormalizados.hora_salida,
        datosNormalizados.motivo,
        datosNormalizados.es_medico,
        datosNormalizados.observaciones,
        id,
      ],
    );

    res.json({
      mensaje: "Salida anticipada actualizada correctamente",
      id: id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/salidas-anticipadas/:id
 * Elimina una salida anticipada registrada
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM salidas_anticipadas WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Salida anticipada no encontrada" });
    }

    res.json({ mensaje: "Salida anticipada eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/salidas-anticipadas/estudiante/:estudianteId/fecha/:fecha
 * Elimina la salida anticipada de un estudiante para una fecha específica
 */
router.delete("/estudiante/:estudianteId/fecha/:fecha", async (req, res) => {
  const { estudianteId, fecha } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM salidas_anticipadas WHERE estudiante_id = ? AND fecha = ?",
      [estudianteId, fecha],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Salida anticipada no encontrada" });
    }

    res.json({ mensaje: "Salida anticipada eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
