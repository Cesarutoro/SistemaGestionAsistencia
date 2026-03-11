const express = require('express');
const router = express.Router();
const pool = require('../db');
const XLSX = require('xlsx');
const { verificarAtraso } = require('../utils/attendance');

// Listar asistencia por curso y fecha
router.get('/curso/:cursoId', async (req, res) => {
    const { cursoId } = req.params;
    const { fecha } = req.query; // YYYY-MM-DD
    // Usar fecha local si no se provee
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
    const dateToSearch = fecha || localToday;

    try {
        const [rows] = await pool.query(`
            SELECT e.id as estudiante_id, e.nombre, e.apellido, e.rut, a.hora_ingreso, a.es_atraso, a.justificado, a.id as asistencia_id
            FROM estudiantes e
            LEFT JOIN asistencia a ON e.id = a.estudiante_id AND a.fecha = ?
            WHERE e.curso_id = ?
            ORDER BY e.apellido ASC
        `, [dateToSearch, cursoId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Marcar asistencia (Ingreso)
router.post('/', async (req, res) => {
    const { estudiante_id, fecha, hora_ingreso } = req.body; 
    // fecha: YYYY-MM-DD, hora_ingreso: HH:MM:SS
    
    try {
        // Lógica de atraso usando utilidad
        const es_atraso = verificarAtraso(hora_ingreso);

        const [result] = await pool.query(
            'INSERT INTO asistencia (estudiante_id, fecha, hora_ingreso, es_atraso) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE hora_ingreso=?, es_atraso=?',
            [estudiante_id, fecha, hora_ingreso, es_atraso, hora_ingreso, es_atraso]
        );
        
        res.json({ message: 'Asistencia registrada', es_atraso, id: result.insertId || null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Justificar atraso
router.put('/:id/justificar', async (req, res) => {
    const { id } = req.params;
    const { justificado } = req.body;
    try {
        await pool.query('UPDATE asistencia SET justificado = ? WHERE id = ?', [justificado ? 1 : 0, id]);
        res.json({ message: 'Estado de justificación actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deshacer asistencia
router.delete('/:estudianteId/:fecha', async (req, res) => {
    const { estudianteId, fecha } = req.params;
    try {
        await pool.query('DELETE FROM asistencia WHERE estudiante_id = ? AND fecha = ?', [estudianteId, fecha]);
        res.json({ message: 'Asistencia eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ver atrasos de todos los cursos
router.get('/atrasos/curso', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.id, DATE_FORMAT(a.fecha, '%Y-%m-%d') as fecha, a.hora_ingreso, a.justificado, e.nombre, e.apellido, c.nombre as curso_nombre
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_id = e.id
            JOIN cursos c ON e.curso_id = c.id
            WHERE a.es_atraso = 1
            ORDER BY a.fecha DESC, e.apellido ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ver atrasos de un curso específico
router.get('/atrasos/curso/:cursoId', async (req, res) => {
    const { cursoId } = req.params;
    try {
        let query = `
            SELECT a.id, DATE_FORMAT(a.fecha, '%Y-%m-%d') as fecha, a.hora_ingreso, a.justificado, e.nombre, e.apellido, c.nombre as curso_nombre
            FROM asistencia a
            JOIN estudiantes e ON a.estudiante_id = e.id
            JOIN cursos c ON e.curso_id = c.id
            WHERE a.es_atraso = 1
        `;
        const params = [];
        
        if (cursoId) {
            query += ' AND e.curso_id = ?';
            params.push(cursoId);
        }
        
        query += ' ORDER BY a.fecha DESC, e.apellido ASC';
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ver atrasos de un estudiante
router.get('/atrasos/:estudianteId', async (req, res) => {
    const { estudianteId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT id, DATE_FORMAT(fecha, "%Y-%m-%d") as fecha, hora_ingreso, justificado FROM asistencia WHERE estudiante_id = ? AND es_atraso = 1 ORDER BY fecha DESC',
            [estudianteId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exportar atrasos por curso
router.get('/export/curso/:cursoId', async (req, res) => {
    const { cursoId } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.nombre as Curso,
                e.rut as RUT, 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                CASE DAYOFWEEK(a.fecha)
                    WHEN 1 THEN 'Domingo'
                    WHEN 2 THEN 'Lunes'
                    WHEN 3 THEN 'Martes'
                    WHEN 4 THEN 'Miércoles'
                    WHEN 5 THEN 'Jueves'
                    WHEN 6 THEN 'Viernes'
                    WHEN 7 THEN 'Sábado'
                END as Día,
                DATE_FORMAT(a.fecha, '%d/%m/%Y') as Fecha, 
                TIME_FORMAT(a.hora_ingreso, '%H:%i') as Hora,
                IF(a.justificado = 1, 'SÍ', 'NO') as Justificado
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE e.curso_id = ? AND a.es_atraso = 1
            ORDER BY e.apellido ASC, e.nombre ASC, a.fecha DESC
        `, [cursoId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay atrasos registrados para este curso' });
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Atrasos");
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        const cursoNombre = rows[0].Curso.replace(/[^a-zA-Z0-9]/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Atrasos_${cursoNombre}.xlsx`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exportar todos los atrasos
router.get('/export/todos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.nombre as Curso,
                e.rut as RUT, 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                CASE DAYOFWEEK(a.fecha)
                    WHEN 1 THEN 'Domingo'
                    WHEN 2 THEN 'Lunes'
                    WHEN 3 THEN 'Martes'
                    WHEN 4 THEN 'Miércoles'
                    WHEN 5 THEN 'Jueves'
                    WHEN 6 THEN 'Viernes'
                    WHEN 7 THEN 'Sábado'
                END as Día,
                DATE_FORMAT(a.fecha, '%d/%m/%Y') as Fecha, 
                TIME_FORMAT(a.hora_ingreso, '%H:%i') as Hora,
                IF(a.justificado = 1, 'SÍ', 'NO') as Justificado
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE a.es_atraso = 1
            ORDER BY c.nombre ASC, e.apellido ASC, e.nombre ASC, a.fecha DESC
        `);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay atrasos registrados' });
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Atrasos Totales");
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Atrasos_Totales.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exportar resumen de frecuencia de atrasos
router.get('/export/resumen', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.nombre as Curso,
                e.rut as RUT, 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                COUNT(a.id) as 'Total_Atrasos'
            FROM estudiantes e
            JOIN cursos c ON e.curso_id = c.id
            LEFT JOIN asistencia a ON e.id = a.estudiante_id AND a.es_atraso = 1
            GROUP BY e.id, c.nombre, e.rut, e.apellido, e.nombre
            HAVING COUNT(a.id) > 0
            ORDER BY c.nombre ASC, COUNT(a.id) DESC
        `);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay atrasos registrados' });
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Resumen");
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Resumen_Atrasos.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Exportar atrasos de un estudiante específico (Breakdown)
router.get('/export/estudiante/:estudianteId', async (req, res) => {
    const { estudianteId } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT 
                e.apellido as Apellidos, 
                e.nombre as Nombres, 
                c.nombre as Curso,
                CASE DAYOFWEEK(a.fecha)
                    WHEN 1 THEN 'Domingo'
                    WHEN 2 THEN 'Lunes'
                    WHEN 3 THEN 'Martes'
                    WHEN 4 THEN 'Miércoles'
                    WHEN 5 THEN 'Jueves'
                    WHEN 6 THEN 'Viernes'
                    WHEN 7 THEN 'Sábado'
                END as Día,
                DATE_FORMAT(a.fecha, '%d/%m/%Y') as Fecha, 
                TIME_FORMAT(a.hora_ingreso, '%H:%i') as Hora,
                IF(a.justificado = 1, 'SÍ', 'NO') as Justificado
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE e.id = ? AND a.es_atraso = 1
            ORDER BY a.fecha DESC
        `, [estudianteId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No hay atrasos registrados para este estudiante' });
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "Desglose Atrasos");
        
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        const nombreEst = `${rows[0].Apellidos}_${rows[0].Nombres}`.replace(/[^a-zA-Z0-9]/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Atrasos_${nombreEst}.xlsx`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
