const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requirePermission, requireModuleWrite } = require('../middleware/auth');

// Obtener todos los cursos
router.get('/', requirePermission('cursos', 'asistencia', 'atrasos', 'salidas-anticipadas', 'estudiantes'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cursos ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear un nuevo curso
router.post('/', requireModuleWrite('cursos'), async (req, res) => {
    const { nombre } = req.body;
    try {
        const [rows] = await pool.query('INSERT INTO cursos (nombre) VALUES (?) RETURNING id', [nombre]);
        res.json({ id: rows[0].id, nombre });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Editar un curso
router.put('/:id', requireModuleWrite('cursos'), async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        await pool.query('UPDATE cursos SET nombre = ? WHERE id = ?', [nombre, id]);
        res.json({ message: 'Curso actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar un curso
router.delete('/:id', requireModuleWrite('cursos'), async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar si hay estudiantes antes de eliminar
        const [students] = await pool.query('SELECT id FROM estudiantes WHERE curso_id = ? LIMIT 1', [id]);
        if (students.length > 0) {
            return res.status(400).json({ error: 'No se puede eliminar un curso que tiene estudiantes registrados' });
        }
        await pool.query('DELETE FROM cursos WHERE id = ?', [id]);
        res.json({ message: 'Curso eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
