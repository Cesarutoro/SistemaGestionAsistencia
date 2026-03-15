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
  const { fecha } = req.query; 

  try {
    let query = `
            SELECT id, estudiante_id, TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, 
                   hora_salida, motivo, es_medico, 
                   TO_CHAR(autorizado_en, 'YYYY-MM-DD HH24:MI:SS') as autorizado_en,
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
                   TO_CHAR(sa.fecha, 'YYYY-MM-DD') as fecha,
                   sa.hora_salida, sa.motivo, sa.es_medico,
                   TO_CHAR(sa.autorizado_en, 'YYYY-MM-DD HH24:MI:SS') as autorizado_en,
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
            SELECT id, estudiante_id, TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
                   hora_salida, motivo, es_medico,
                   TO_CHAR(autorizado_en, 'YYYY-MM-DD HH24:MI:SS') as autorizado_en,
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
  const datosNormalizados = normalizarDatos(req.body);
  const validacion = validarSalidaAnticipada(datosNormalizados);

  if (!validacion.valido) {
    return res.status(400).json({
      error: "Datos inválidos",
      errores: validacion.errores,
    });
  }

  if (!esHoraSalidaValida(datosNormalizados.hora_salida)) {
    return res.status(400).json({
      error: "Hora de salida inválida",
      mensaje: "La salida debe ser después de las 08:00",
    });
  }

  try {
    const [estudiante] = await pool.query(
      "SELECT id FROM estudiantes WHERE id = ?",
      [datosNormalizados.estudiante_id],
    );

    if (estudiante.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const [rows] = await pool.query(
      `INSERT INTO salidas_anticipadas 
             (estudiante_id, fecha, hora_salida, motivo, es_medico, autorizado_por, observaciones)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (estudiante_id, fecha) 
             DO UPDATE SET 
             hora_salida = EXCLUDED.hora_salida,
             motivo = EXCLUDED.motivo,
             es_medico = EXCLUDED.es_medico,
             observaciones = EXCLUDED.observaciones,
             autorizado_en = CURRENT_TIMESTAMP
             RETURNING id`,
      [
        datosNormalizados.estudiante_id,
        datosNormalizados.fecha,
        datosNormalizados.hora_salida,
        datosNormalizados.motivo,
        !!datosNormalizados.es_medico,
        req.user ? req.user.id : null,
        datosNormalizados.observaciones,
      ],
    );

    res.status(201).json({
      mensaje: "Salida anticipada registrada correctamente",
      id: rows.insertId,
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
    const [salidaRows] = await pool.query(
      "SELECT * FROM salidas_anticipadas WHERE id = ?",
      [id],
    );
    const salida = salidaRows[0];

    if (!salida) {
      return res.status(404).json({ error: "Salida anticipada no encontrada" });
    }

    const datosActualizar = {
      hora_salida: hora_salida || salida.hora_salida,
      motivo: motivo || salida.motivo,
      es_medico: es_medico !== undefined ? es_medico : salida.es_medico,
      observaciones:
        observaciones !== undefined ? observaciones : salida.observaciones,
    };

    const datosNormalizados = normalizarDatos({
      estudiante_id: salida.estudiante_id,
      fecha: salida.fecha.toISOString().split("T")[0],
      ...datosActualizar,
    });

    const validacion = validarSalidaAnticipada(datosNormalizados);
    if (!validacion.valido) {
      return res.status(400).json({
        error: "Datos inválidos",
        errores: validacion.errores,
      });
    }

    await pool.query(
      `UPDATE salidas_anticipadas
             SET hora_salida = ?, motivo = ?, es_medico = ?, observaciones = ?
             WHERE id = ?`,
      [
        datosNormalizados.hora_salida,
        datosNormalizados.motivo,
        !!datosNormalizados.es_medico,
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
 * DELETE /api/salidas-anticipadas/estudiante/:estudianteId/fecha/:fecha
 * Debe ir ANTES de /:id para que Express no lo trate como id="estudiante"
 */
router.delete("/estudiante/:estudianteId/fecha/:fecha", async (req, res) => {
  const { estudianteId, fecha } = req.params;
  try {
    const [rows] = await pool.query(
      "DELETE FROM salidas_anticipadas WHERE estudiante_id = ? AND fecha = ?",
      [estudianteId, fecha],
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({ error: "Salida anticipada no encontrada" });
    }

    res.json({ mensaje: "Salida anticipada eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/salidas-anticipadas/:id
 * Debe ir DESPUÉS de la ruta específica /estudiante/:estudianteId/fecha/:fecha
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "DELETE FROM salidas_anticipadas WHERE id = ?",
      [id],
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({ error: "Salida anticipada no encontrada" });
    }

    res.json({ mensaje: "Salida anticipada eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
