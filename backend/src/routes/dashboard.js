const express = require("express");
const router = express.Router();
const pool = require("../db");

const getTodayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().split("T")[0];
};

router.get("/resumen", async (req, res) => {
  const fechaBase = req.query.fecha || getTodayLocal();

  try {
    const [[totalEstudiantesRow]] = await pool.query(
      "SELECT COUNT(*) AS total_estudiantes FROM estudiantes",
    );

    const [[atrasosHoyRow]] = await pool.query(
      "SELECT COUNT(*) AS atrasos_hoy FROM asistencia WHERE fecha = ? AND es_atraso = 1",
      [fechaBase],
    );

    const [estudiantesSemanaRows] = await pool.query(
      `SELECT
        e.id AS estudiante_id,
        e.nombre,
        e.apellido,
        e.rut,
        c.nombre AS curso_nombre,
        COUNT(*) AS total_atrasos
      FROM asistencia a
      JOIN estudiantes e ON e.id = a.estudiante_id
      JOIN cursos c ON c.id = e.curso_id
      WHERE a.es_atraso = 1
        AND YEARWEEK(a.fecha, 1) = YEARWEEK(?, 1)
      GROUP BY e.id, e.nombre, e.apellido, e.rut, c.nombre
      HAVING COUNT(*) >= 3
      ORDER BY total_atrasos DESC, e.apellido ASC, e.nombre ASC`,
      [fechaBase],
    );

    const [rankingSemanaRows] = await pool.query(
      `SELECT
        c.id AS curso_id,
        c.nombre AS curso_nombre,
        COUNT(*) AS total_atrasos
      FROM asistencia a
      JOIN estudiantes e ON e.id = a.estudiante_id
      JOIN cursos c ON c.id = e.curso_id
      WHERE a.es_atraso = 1
        AND YEARWEEK(a.fecha, 1) = YEARWEEK(?, 1)
      GROUP BY c.id, c.nombre
      ORDER BY total_atrasos DESC, c.nombre ASC`,
      [fechaBase],
    );

    const [rankingMesRows] = await pool.query(
      `SELECT
        c.id AS curso_id,
        c.nombre AS curso_nombre,
        COUNT(*) AS total_atrasos
      FROM asistencia a
      JOIN estudiantes e ON e.id = a.estudiante_id
      JOIN cursos c ON c.id = e.curso_id
      WHERE a.es_atraso = 1
        AND YEAR(a.fecha) = YEAR(?)
        AND MONTH(a.fecha) = MONTH(?)
      GROUP BY c.id, c.nombre
      ORDER BY total_atrasos DESC, c.nombre ASC`,
      [fechaBase, fechaBase],
    );

    res.json({
      fecha: fechaBase,
      total_estudiantes: Number(totalEstudiantesRow.total_estudiantes || 0),
      atrasos_hoy: Number(atrasosHoyRow.atrasos_hoy || 0),
      estudiantes_3mas_atrasos_semana: estudiantesSemanaRows,
      ranking_cursos_semana: rankingSemanaRows,
      ranking_cursos_mes: rankingMesRows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
