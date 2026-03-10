const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos los cursos
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cursos ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un curso
router.post('/', async (req, res) => {
    const { nombre } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO cursos (nombre) VALUES (?)', [nombre]);
        res.json({ id: result.insertId, nombre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un curso
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
        await pool.query('UPDATE cursos SET nombre = ? WHERE id = ?', [nombre, id]);
        res.json({ message: 'Curso actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un curso
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [students] = await pool.query('SELECT id FROM estudiantes WHERE curso_id = ? LIMIT 1', [id]);
        if (students.length > 0) {
            return res.status(400).json({ error: 'No se puede eliminar un curso que tiene estudiantes registrados' });
        }
        await pool.query('DELETE FROM cursos WHERE id = ?', [id]);
        res.json({ message: 'Curso eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
