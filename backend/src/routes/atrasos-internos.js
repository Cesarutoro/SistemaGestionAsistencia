const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  validarAtrasoInterno,
  normalizarDatos,
} = require("../utils/internalDelay");
const { requirePermission, requireModuleWrite } = require("../middleware/auth");

router.get("/estudiante/:estudianteId", requirePermission("atrasos-internos"), async (req, res) => {
  const { estudianteId } = req.params;
  const { fecha } = req.query;

  try {
    let query = `
      SELECT id, estudiante_id, TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
             tipo, minutos_atraso, observaciones,
             TO_CHAR(registrado_en, 'YYYY-MM-DD HH24:MI:SS') as registrado_en
      FROM atrasos_internos
      WHERE estudiante_id = ?
    `;
    const params = [estudianteId];

    if (fecha) {
      query += " AND fecha = ?";
      params.push(fecha);
    }

    query += " ORDER BY fecha DESC, tipo ASC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/curso/:cursoId", requirePermission("atrasos-internos"), async (req, res) => {
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
        SELECT ai.id, ai.estudiante_id, e.nombre, e.apellido, e.rut,
               TO_CHAR(ai.fecha, 'YYYY-MM-DD') as fecha,
               ai.tipo, ai.minutos_atraso, ai.observaciones,
               TO_CHAR(ai.registrado_en, 'YYYY-MM-DD HH24:MI:SS') as registrado_en
        FROM atrasos_internos ai
        JOIN estudiantes e ON ai.estudiante_id = e.id
        WHERE e.curso_id = ? AND ai.fecha = ?
        ORDER BY e.apellido ASC, ai.tipo ASC
      `,
      [cursoId, dateToSearch],
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", requirePermission("atrasos-internos"), async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
        SELECT id, estudiante_id, TO_CHAR(fecha, 'YYYY-MM-DD') as fecha,
               tipo, minutos_atraso, observaciones,
               TO_CHAR(registrado_en, 'YYYY-MM-DD HH24:MI:SS') as registrado_en
        FROM atrasos_internos
        WHERE id = ?
      `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Atraso interno no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", requireModuleWrite("atrasos-internos"), async (req, res) => {
  const datosNormalizados = normalizarDatos(req.body);
  const validacion = validarAtrasoInterno(datosNormalizados);

  if (!validacion.valido) {
    return res.status(400).json({
      error: "Datos inválidos",
      errores: validacion.errores,
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
      `INSERT INTO atrasos_internos
         (estudiante_id, fecha, tipo, minutos_atraso, observaciones, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (estudiante_id, fecha, tipo)
       DO UPDATE SET
         minutos_atraso = EXCLUDED.minutos_atraso,
         observaciones = EXCLUDED.observaciones,
         registrado_por = EXCLUDED.registrado_por,
         registrado_en = CURRENT_TIMESTAMP
       RETURNING id`,
      [
        datosNormalizados.estudiante_id,
        datosNormalizados.fecha,
        datosNormalizados.tipo,
        datosNormalizados.minutos_atraso,
        datosNormalizados.observaciones,
        req.user ? req.user.id : null,
      ],
    );

    res.status(201).json({
      mensaje: "Atraso interno registrado correctamente",
      id: rows.insertId,
      datos: datosNormalizados,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", requireModuleWrite("atrasos-internos"), async (req, res) => {
  const { id } = req.params;
  const { tipo, minutos_atraso, observaciones } = req.body;

  try {
    const [atrasoRows] = await pool.query(
      "SELECT * FROM atrasos_internos WHERE id = ?",
      [id],
    );
    const atraso = atrasoRows[0];

    if (!atraso) {
      return res.status(404).json({ error: "Atraso interno no encontrado" });
    }

    const fechaStr =
      typeof atraso.fecha === "string"
        ? atraso.fecha.slice(0, 10)
        : atraso.fecha.toISOString().split("T")[0];

    const datosNormalizados = normalizarDatos({
      estudiante_id: atraso.estudiante_id,
      fecha: fechaStr,
      tipo: tipo !== undefined ? tipo : atraso.tipo,
      minutos_atraso:
        minutos_atraso !== undefined ? minutos_atraso : atraso.minutos_atraso,
      observaciones:
        observaciones !== undefined ? observaciones : atraso.observaciones,
    });

    const validacion = validarAtrasoInterno(datosNormalizados);
    if (!validacion.valido) {
      return res.status(400).json({
        error: "Datos inválidos",
        errores: validacion.errores,
      });
    }

    await pool.query(
      `UPDATE atrasos_internos
       SET tipo = ?, minutos_atraso = ?, observaciones = ?
       WHERE id = ?`,
      [
        datosNormalizados.tipo,
        datosNormalizados.minutos_atraso,
        datosNormalizados.observaciones,
        id,
      ],
    );

    res.json({
      mensaje: "Atraso interno actualizado correctamente",
      id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", requireModuleWrite("atrasos-internos"), async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      "DELETE FROM atrasos_internos WHERE id = ?",
      [id],
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({ error: "Atraso interno no encontrado" });
    }

    res.json({ mensaje: "Atraso interno eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
