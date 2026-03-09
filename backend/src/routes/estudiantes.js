const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// Listar todos los estudiantes con su curso
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT e.*, c.nombre as curso_nombre 
            FROM estudiantes e 
            JOIN cursos c ON e.curso_id = c.id 
            ORDER BY c.nombre ASC, e.apellido ASC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un estudiante
router.post('/', async (req, res) => {
    const { rut, nombre, apellido, curso_id, sexo } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO estudiantes (rut, nombre, apellido, curso_id, sexo) VALUES (?, ?, ?, ?, ?)',
            [rut, nombre, apellido, curso_id, sexo]
        );
        res.status(201).json({ id: result.insertId, rut, nombre, apellido, curso_id, sexo });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un estudiante
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { rut, nombre, apellido, curso_id, sexo } = req.body;
    try {
        await pool.query(
            'UPDATE estudiantes SET rut=?, nombre=?, apellido=?, curso_id=?, sexo=? WHERE id=?',
            [rut, nombre, apellido, curso_id, sexo, id]
        );
        res.json({ message: 'Estudiante actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un estudiante
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM estudiantes WHERE id = ?', [id]);
        res.json({ message: 'Estudiante eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Subir Excel de estudiantes
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    const filePath = req.file.path;
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Tomamos la primera hoja por defecto o iteramos
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Procesar datos (esto es un ejemplo, se debe ajustar al formato del Excel subido)
        for (const row of data) {
            const { rut, nombre, apellido, curso, sexo } = row;
            
            // Buscar o crear curso
            const [cursoRows] = await pool.query('SELECT id FROM cursos WHERE nombre = ?', [curso]);
            let cursoId;
            if (cursoRows.length > 0) {
                cursoId = cursoRows[0].id;
            } else {
                const [newCurso] = await pool.query('INSERT INTO cursos (nombre) VALUES (?)', [curso]);
                cursoId = newCurso.insertId;
            }

            await pool.query(
                'INSERT INTO estudiantes (rut, nombre, apellido, curso_id, sexo) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre=?, apellido=?, curso_id=?, sexo=?',
                [rut, nombre, apellido, cursoId, sexo, nombre, apellido, cursoId, sexo]
            );
        }

        res.json({ message: 'Excel procesado con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});

module.exports = router;
