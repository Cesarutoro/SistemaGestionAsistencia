const express = require("express");
const router = express.Router();
const pool = require("../db");
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } = require("date-fns");
const { requirePermission } = require('../middleware/auth');

router.use(requirePermission('dashboard'));

const getTodayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().split("T")[0];
};

router.get("/resumen", async (req, res) => {
  const fechaBaseStr = req.query.fecha || getTodayLocal();
  const fechaBase = new Date(fechaBaseStr + 'T12:00:00'); // Forzamos mediodía para evitar problemas de zona horaria

  // Calculamos rangos en Node.js para que Postgres use los índices (SARGable queries)
  const inicioSemana = format(startOfWeek(fechaBase, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const finSemana = format(endOfWeek(fechaBase, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const inicioMes = format(startOfMonth(fechaBase), 'yyyy-MM-dd');
  const finMes = format(endOfMonth(fechaBase), 'yyyy-MM-dd');

  try {
    const [
      [totalEstRows],
      [atrasosHoyRows],
      [estudiantesSemanaRows],
      [rankingSemanaRows],
      [rankingMesRows]
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total_estudiantes FROM estudiantes"),
      pool.query("SELECT COUNT(*) AS atrasos_hoy FROM asistencia WHERE fecha = ? AND es_atraso = TRUE", [fechaBaseStr]),
      pool.query(`
        SELECT e.id AS estudiante_id, e.nombre, e.apellido, e.rut, c.nombre AS curso_nombre, COUNT(*) AS total_atrasos
        FROM asistencia a
        JOIN estudiantes e ON e.id = a.estudiante_id
        JOIN cursos c ON c.id = e.curso_id
        WHERE a.es_atraso = TRUE 
          AND a.fecha >= ? AND a.fecha <= ?
        GROUP BY e.id, e.nombre, e.apellido, e.rut, c.nombre
        HAVING COUNT(*) >= 3
        ORDER BY total_atrasos DESC, e.apellido ASC, e.nombre ASC`, [inicioSemana, finSemana]),
      pool.query(`
        SELECT c.id AS curso_id, c.nombre AS curso_nombre, COUNT(*) AS total_atrasos
        FROM asistencia a
        JOIN estudiantes e ON e.id = a.estudiante_id
        JOIN cursos c ON c.id = e.curso_id
        WHERE a.es_atraso = TRUE 
          AND a.fecha >= ? AND a.fecha <= ?
        GROUP BY c.id, c.nombre
        ORDER BY total_atrasos DESC, c.nombre ASC`, [inicioSemana, finSemana]),
      pool.query(`
        SELECT c.id AS curso_id, c.nombre AS curso_nombre, COUNT(*) AS total_atrasos
        FROM asistencia a
        JOIN estudiantes e ON e.id = a.estudiante_id
        JOIN cursos c ON c.id = e.curso_id
        WHERE a.es_atraso = TRUE 
          AND a.fecha >= ? AND a.fecha <= ?
        GROUP BY c.id, c.nombre
        ORDER BY total_atrasos DESC, c.nombre ASC`, [inicioMes, finMes])
    ]);

    res.json({
      fecha: fechaBaseStr,
      total_estudiantes: Number(totalEstRows[0]?.total_estudiantes || 0),
      atrasos_hoy: Number(atrasosHoyRows[0]?.atrasos_hoy || 0),
      estudiantes_3mas_atrasos_semana: estudiantesSemanaRows,
      ranking_cursos_semana: rankingSemanaRows,
      ranking_cursos_mes: rankingMesRows,
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
