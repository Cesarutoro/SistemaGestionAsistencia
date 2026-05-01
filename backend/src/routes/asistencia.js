const express = require("express");
const router = express.Router();
const pool = require("../db");
const XLSX = require("xlsx");
const { verificarAtraso } = require("../utils/attendance");
const { requirePermission, requireModuleWrite } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Listar asistencia por curso y fecha
router.get("/curso/:cursoId", requirePermission('asistencia'), async (req, res) => {
  const { cursoId } = req.params;
  const { fecha } = req.query; // YYYY-MM-DD
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - offset * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const dateToSearch = fecha || localToday;

  try {
    const [rows] = await pool.query(
      `
            SELECT e.id as estudiante_id, e.nombre, e.apellido, e.rut, a.hora_ingreso, a.es_atraso, a.justificado, a.id as asistencia_id
            FROM estudiantes e
            LEFT JOIN asistencia a ON e.id = a.estudiante_id AND a.fecha = ?
            WHERE e.curso_id = ?
            ORDER BY e.apellido ASC
        `,
      [dateToSearch, cursoId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar asistencia (Ingreso)
router.post("/", requireModuleWrite('asistencia'), validate('marcarAsistencia'), async (req, res) => {
  const { estudiante_id, fecha, hora_ingreso } = req.body;
  try {
    const es_atraso = verificarAtraso(hora_ingreso);

    const [rows] = await pool.query(
      `INSERT INTO asistencia (estudiante_id, fecha, hora_ingreso, es_atraso) 
             VALUES (?, ?, ?, ?) 
             ON CONFLICT (estudiante_id, fecha) 
             DO UPDATE SET hora_ingreso = EXCLUDED.hora_ingreso, es_atraso = EXCLUDED.es_atraso
             RETURNING id`,
      [estudiante_id, fecha, hora_ingreso, es_atraso],
    );

    res.json({
      message: "Asistencia registrada",
      es_atraso,
      id: rows[0]?.id || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Justificar atraso
router.put("/:id/justificar", requireModuleWrite('asistencia'), validate('justificarAtraso'), async (req, res) => {
  const { id } = req.params;
  const { justificado, justificacion_descripcion } = req.body;
  const isJustificado = !!justificado;
  const descripcionLimpia =
    isJustificado && typeof justificacion_descripcion === "string"
      ? justificacion_descripcion.trim() || null
      : null;
  try {
    await pool.query(
      "UPDATE asistencia SET justificado = ?, justificacion_descripcion = ? WHERE id = ?",
      [
        isJustificado,
        descripcionLimpia,
        id,
      ],
    );
    res.json({ message: "Estado de justificación actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Editar hora de ingreso de un atraso
router.put("/:id/hora", requireModuleWrite('asistencia'), validate('editarHora'), async (req, res) => {
  const { id } = req.params;
  const { hora_ingreso } = req.body;
  if (!hora_ingreso) {
    return res.status(400).json({ error: "Debe proveer una hora_ingreso" });
  }
  try {
    const horaConSegundos =
      hora_ingreso.length === 5 ? hora_ingreso + ":00" : hora_ingreso;
    const es_atraso = verificarAtraso(horaConSegundos);
    await pool.query(
      "UPDATE asistencia SET hora_ingreso = ?, es_atraso = ? WHERE id = ?",
      [horaConSegundos, es_atraso, id],
    );
    res.json({ message: "Hora de ingreso actualizada", es_atraso });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deshacer asistencia
router.delete("/:estudianteId/:fecha", requireModuleWrite('asistencia'), async (req, res) => {
  const { estudianteId, fecha } = req.params;
  try {
    await pool.query(
      "DELETE FROM asistencia WHERE estudiante_id = ? AND fecha = ?",
      [estudianteId, fecha],
    );
    res.json({ message: "Asistencia eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ver atrasos de todos los cursos (con paginación opcional)
router.get("/atrasos/curso", requirePermission('atrasos'), async (req, res) => {
  try {
    const rawLimit = req.query?.limit;
    const hasPagination = rawLimit !== undefined && rawLimit !== '';
    const page = Math.max(1, parseInt(req.query?.page) || 1);
    const limit = hasPagination ? Math.min(200, Math.max(1, parseInt(rawLimit))) : 0;

    if (hasPagination) {
      const offset = (page - 1) * limit;
      const [countRows] = await pool.query(`
        SELECT COUNT(*) AS total FROM asistencia a
        JOIN estudiantes e ON a.estudiante_id = e.id
        JOIN cursos c ON e.curso_id = c.id
        WHERE a.es_atraso = TRUE
      `);
      const total = Number(countRows[0]?.total || 0);

      const [rows] = await pool.query(`
        SELECT a.id, TO_CHAR(a.fecha, 'YYYY-MM-DD') as fecha, a.hora_ingreso, a.justificado, a.justificacion_descripcion, e.nombre, e.apellido, e.rut, c.nombre as curso_nombre
        FROM asistencia a
        JOIN estudiantes e ON a.estudiante_id = e.id
        JOIN cursos c ON e.curso_id = c.id
        WHERE a.es_atraso = TRUE
        ORDER BY a.fecha DESC, e.apellido ASC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
      return res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    const [rows] = await pool.query(`
            SELECT a.id, TO_CHAR(a.fecha, 'YYYY-MM-DD') as fecha, a.hora_ingreso, a.justificado, a.justificacion_descripcion, e.nombre, e.apellido, c.nombre as curso_nombre
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_id = e.id
            JOIN cursos c ON e.curso_id = c.id
            WHERE a.es_atraso = TRUE
            ORDER BY a.fecha DESC, e.apellido ASC
        `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ver atrasos de un curso específico (con paginación opcional)
router.get("/atrasos/curso/:cursoId", requirePermission('atrasos'), async (req, res) => {
  const { cursoId } = req.params;
  try {
    const rawLimit = req.query?.limit;
    const hasPagination = rawLimit !== undefined && rawLimit !== '';
    const page = Math.max(1, parseInt(req.query?.page) || 1);
    const limit = hasPagination ? Math.min(200, Math.max(1, parseInt(rawLimit))) : 0;

    let whereClause = 'WHERE a.es_atraso = TRUE';
    const params = [];

    if (cursoId && cursoId !== "undefined") {
      whereClause += ' AND e.curso_id = ?';
      params.push(cursoId);
    }

    if (hasPagination) {
      const offset = (page - 1) * limit;
      const [countRows] = await pool.query(`
        SELECT COUNT(*) AS total FROM asistencia a
        JOIN estudiantes e ON a.estudiante_id = e.id
        JOIN cursos c ON e.curso_id = c.id
        ${whereClause}
      `, params);
      const total = Number(countRows[0]?.total || 0);

      const [rows] = await pool.query(`
        SELECT a.id, TO_CHAR(a.fecha, 'YYYY-MM-DD') as fecha, a.hora_ingreso, a.justificado, a.justificacion_descripcion, e.nombre, e.apellido, e.rut, c.nombre as curso_nombre
        FROM asistencia a
        JOIN estudiantes e ON a.estudiante_id = e.id
        JOIN cursos c ON e.curso_id = c.id
        ${whereClause}
        ORDER BY a.fecha DESC, e.apellido ASC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);
      return res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    let query = `
            SELECT a.id, TO_CHAR(a.fecha, 'YYYY-MM-DD') as fecha, a.hora_ingreso, a.justificado, a.justificacion_descripcion, e.nombre, e.apellido, c.nombre as curso_nombre
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_id = e.id
            JOIN cursos c ON e.curso_id = c.id
            ${whereClause}
        `;

    query += " ORDER BY a.fecha DESC, e.apellido ASC";

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ver atrasos de un estudiante
router.get("/atrasos/:estudianteId", requirePermission('atrasos'), async (req, res) => {
  const { estudianteId } = req.params;
  try {
    const [rows] = await pool.query(
      `
            SELECT a.id, TO_CHAR(a.fecha, 'YYYY-MM-DD') as fecha, a.hora_ingreso, a.justificado, a.justificacion_descripcion,
                   e.nombre, e.apellido, c.nombre as curso_nombre
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_id = e.id
            JOIN cursos c ON e.curso_id = c.id
            WHERE a.estudiante_id = ? AND a.es_atraso = TRUE 
            ORDER BY a.fecha DESC
        `,
      [estudianteId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar atrasos por curso
router.get("/export/curso/:cursoId", requirePermission('atrasos'), async (req, res) => {
  const { cursoId } = req.params;
  try {
    const [rows] = await pool.query(
      `
            SELECT 
                c.nombre as Curso,
                e.rut as RUT, 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                CASE EXTRACT(DOW FROM a.fecha)
                    WHEN 0 THEN 'Domingo'
                    WHEN 1 THEN 'Lunes'
                    WHEN 2 THEN 'Martes'
                    WHEN 3 THEN 'Miércoles'
                    WHEN 4 THEN 'Jueves'
                    WHEN 5 THEN 'Viernes'
                    WHEN 6 THEN 'Sábado'
                END as Día,
                TO_CHAR(a.fecha, 'DD/MM/YYYY') as Fecha, 
                TO_CHAR(a.hora_ingreso, 'HH24:MI') as Hora,
                CASE WHEN a.justificado THEN 'SÍ' ELSE 'NO' END as Justificado
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE e.curso_id = ? AND a.es_atraso = TRUE
            ORDER BY e.apellido ASC, e.nombre ASC, a.fecha DESC
        `,
      [cursoId],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay atrasos registrados para este curso" });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Atrasos");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const cursoNombre = String(rows?.[0]?.curso ?? "Curso").replace(
      /[^a-zA-Z0-9]/g,
      "_",
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Atrasos_${cursoNombre}.xlsx`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar todos los atrasos
router.get("/export/todos", requirePermission('atrasos'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT 
                c.nombre as Curso,
                e.rut as RUT, 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                CASE EXTRACT(DOW FROM a.fecha)
                    WHEN 0 THEN 'Domingo'
                    WHEN 1 THEN 'Lunes'
                    WHEN 2 THEN 'Martes'
                    WHEN 3 THEN 'Miércoles'
                    WHEN 4 THEN 'Jueves'
                    WHEN 5 THEN 'Viernes'
                    WHEN 6 THEN 'Sábado'
                END as Día,
                TO_CHAR(a.fecha, 'DD/MM/YYYY') as Fecha, 
                TO_CHAR(a.hora_ingreso, 'HH24:MI') as Hora,
                CASE WHEN a.justificado THEN 'SÍ' ELSE 'NO' END as Justificado
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE a.es_atraso = TRUE
            ORDER BY c.nombre ASC, e.apellido ASC, e.nombre ASC, a.fecha DESC
        `);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No hay atrasos registrados" });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Atrasos Totales");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Atrasos_Totales.xlsx",
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar resumen de frecuencia de atrasos
router.get("/export/resumen", requirePermission('atrasos'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
            SELECT 
                c.nombre as Curso,
                e.rut as RUT, 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                COUNT(a.id) as Total_Atrasos
            FROM estudiantes e
            JOIN cursos c ON e.curso_id = c.id
            LEFT JOIN asistencia a ON e.id = a.estudiante_id AND a.es_atraso = TRUE
            GROUP BY e.id, c.nombre, e.rut, e.apellido, e.nombre
            HAVING COUNT(a.id) > 0
            ORDER BY c.nombre ASC, COUNT(a.id) DESC
        `);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No hay atrasos registrados" });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Resumen");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Resumen_Atrasos.xlsx",
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exportar atrasos de un estudiante específico (Breakdown)
router.get("/export/estudiante/:estudianteId", requirePermission('atrasos'), async (req, res) => {
  const { estudianteId } = req.params;
  try {
    const [rows] = await pool.query(
      `
            SELECT 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                c.nombre as Curso,
                CASE EXTRACT(DOW FROM a.fecha)
                    WHEN 0 THEN 'Domingo'
                    WHEN 1 THEN 'Lunes'
                    WHEN 2 THEN 'Martes'
                    WHEN 3 THEN 'Miércoles'
                    WHEN 4 THEN 'Jueves'
                    WHEN 5 THEN 'Viernes'
                    WHEN 6 THEN 'Sábado'
                END as Día,
                TO_CHAR(a.fecha, 'DD/MM/YYYY') as Fecha, 
                TO_CHAR(a.hora_ingreso, 'HH24:MI') as Hora,
                CASE WHEN a.justificado THEN 'SÍ' ELSE 'NO' END as Justificado
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE e.id = ? AND a.es_atraso = TRUE
            ORDER BY a.fecha DESC
        `,
      [estudianteId],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No hay atrasos registrados para este estudiante" });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Desglose Atrasos");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const nombreEst =
      `${String(rows?.[0]?.apellidos ?? "Estudiante")}_${String(rows?.[0]?.nombres ?? "")}`.replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Atrasos_${nombreEst}.xlsx`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
