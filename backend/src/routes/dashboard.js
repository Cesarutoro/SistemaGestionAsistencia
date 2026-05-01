const express = require("express");
const router = express.Router();
const pool = require("../db");
const NodeCache = require("node-cache");
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } = require("date-fns");
const { requirePermission } = require('../middleware/auth');

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

router.use(requirePermission('dashboard'));

const getTodayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().split("T")[0];
};

router.get("/tendencia-semanal", async (req, res) => {
  const fechaBaseStr = req.query?.fecha || getTodayLocal();
  const fechaBase = new Date(fechaBaseStr + 'T12:00:00');
  const finSemana = format(endOfWeek(fechaBase, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const inicioSemana = new Date(new Date(finSemana).getTime() - 6 * 86400000).toISOString().split('T')[0];

  try {
    const [rows] = await pool.query(`
      SELECT TO_CHAR(a.fecha, 'YYYY-MM-DD') AS dia, COUNT(*) AS total
      FROM asistencia a
      WHERE a.es_atraso = TRUE
        AND a.fecha >= ? AND a.fecha <= ?
      GROUP BY a.fecha
      ORDER BY a.fecha ASC
    `, [inicioSemana, finSemana]);

    const todosLosDias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(new Date(inicioSemana).getTime() + i * 86400000);
      const diaStr = d.toISOString().split('T')[0];
      const encontrado = rows.find(r => r.dia === diaStr);
      todosLosDias.push({
        dia: diaStr,
        diaSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()],
        total: encontrado ? Number(encontrado.total) : 0,
      });
    }

    res.json({ dias: todosLosDias });
  } catch (error) {
    console.error('Error en tendencia semanal:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/resumen", async (req, res) => {
  const fechaBaseStr = req.query?.fecha || getTodayLocal();
  const cacheKey = `resumen_${fechaBaseStr}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const fechaBase = new Date(fechaBaseStr + 'T12:00:00');

  const ayerStr = new Date(fechaBase.getTime() - 86400000).toISOString().split('T')[0];

  // Calculamos rangos en Node.js para que Postgres use los índices (SARGable queries)
  const inicioSemana = format(startOfWeek(fechaBase, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const finSemana = format(endOfWeek(fechaBase, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const inicioMes = format(startOfMonth(fechaBase), 'yyyy-MM-dd');
  const finMes = format(endOfMonth(fechaBase), 'yyyy-MM-dd');

  try {
    const [
      [totalEstRows],
      [atrasosHoyRows],
      [atrasosAyerRows],
      [estudiantesSemanaRows],
      [rankingSemanaRows],
      [rankingMesRows]
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total_estudiantes FROM estudiantes"),
      pool.query("SELECT COUNT(*) AS atrasos_hoy FROM asistencia WHERE fecha = ? AND es_atraso = TRUE", [fechaBaseStr]),
      pool.query("SELECT COUNT(*) AS atrasos_ayer FROM asistencia WHERE fecha = ? AND es_atraso = TRUE", [ayerStr]),
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

    const atrasosHoy = Number(atrasosHoyRows[0]?.atrasos_hoy || 0);
    const atrasosAyer = Number(atrasosAyerRows[0]?.atrasos_ayer || 0);

    const result = {
      fecha: fechaBaseStr,
      total_estudiantes: Number(totalEstRows[0]?.total_estudiantes || 0),
      atrasos_hoy: atrasosHoy,
      atrasos_ayer: atrasosAyer,
      tendencia_atrasos: atrasosAyer > 0 ? ((atrasosHoy - atrasosAyer) / atrasosAyer * 100).toFixed(1) : (atrasosHoy > 0 ? 100 : 0),
      estudiantes_3mas_atrasos_semana: estudiantesSemanaRows,
      ranking_cursos_semana: rankingSemanaRows,
      ranking_cursos_mes: rankingMesRows,
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
