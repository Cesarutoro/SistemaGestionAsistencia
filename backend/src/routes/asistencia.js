const express = require('express');
const router = express.Router();
const pool = require('../db');
const XLSX = require('xlsx');

// Listar asistencia por curso y fecha
router.get('/curso/:cursoId', async (req, res) => {
    const { cursoId } = req.params;
    const { fecha } = req.query; // YYYY-MM-DD
    const dateToSearch = fecha || new Date().toISOString().split('T')[0];

    try {
        const [rows] = await pool.query(`
            SELECT e.id as estudiante_id, e.nombre, e.apellido, e.rut, a.hora_ingreso, a.es_atraso, a.id as asistencia_id
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
        // Lógica de atraso: si es después de las 08:00 AM
        const limiteAtraso = '08:00:00';
        const es_atraso = hora_ingreso > limiteAtraso ? 1 : 0;

        const [result] = await pool.query(
            'INSERT INTO asistencia (estudiante_id, fecha, hora_ingreso, es_atraso) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE hora_ingreso=?, es_atraso=?',
            [estudiante_id, fecha, hora_ingreso, es_atraso, hora_ingreso, es_atraso]
        );
        
        res.json({ message: 'Asistencia registrada', es_atraso, id: result.insertId || null });
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

// Ver atrasos de un estudiante
router.get('/atrasos/:estudianteId', async (req, res) => {
    const { estudianteId } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT fecha, hora_ingreso FROM asistencia WHERE estudiante_id = ? AND es_atraso = 1 ORDER BY fecha DESC',
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
                DATE_FORMAT(a.fecha, '%d/%m/%Y') as Fecha, 
                TIME_FORMAT(a.hora_ingreso, '%H:%i') as Hora
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE e.curso_id = ? AND a.es_atraso = 1
            ORDER BY a.fecha DESC, e.apellido ASC
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
                DATE_FORMAT(a.fecha, '%d/%m/%Y') as Fecha, 
                TIME_FORMAT(a.hora_ingreso, '%H:%i') as Hora
            FROM estudiantes e
            JOIN asistencia a ON e.id = a.estudiante_id
            JOIN cursos c ON e.curso_id = c.id
            WHERE a.es_atraso = 1
            ORDER BY c.nombre ASC, a.fecha DESC, e.apellido ASC
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

module.exports = router;
