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
            SELECT e.id, e.nombre, e.apellido, e.curso_id, c.nombre as curso_nombre 
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
        const [rows] = await pool.query(
            'INSERT INTO estudiantes (rut, nombre, apellido, curso_id, sexo) VALUES (?, ?, ?, ?, ?) RETURNING id',
            [rut, nombre, apellido, curso_id, sexo]
        );
        res.status(201).json({ id: rows[0].id, rut, nombre, apellido, curso_id, sexo });
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

// Actualizar curso masivamente
router.put('/bulk-update-curso', async (req, res) => {
    const { estudiante_ids, curso_id } = req.body;
    if (!estudiante_ids || !Array.isArray(estudiante_ids) || !curso_id) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        // En Postgres para usar IN con un array se usa ANY(?)
        await pool.query(
            'UPDATE estudiantes SET curso_id = ? WHERE id = ANY(?)',
            [curso_id, estudiante_ids]
        );
        res.json({ message: `${estudiante_ids.length} estudiantes actualizados correctamente` });
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
        const sheetName = workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        for (const row of data) {
            const { rut, nombre, apellido, curso, sexo } = row;
            
            // Buscar o crear curso
            const [cursoRows] = await pool.query('SELECT id FROM cursos WHERE nombre = ?', [curso]);
            let cursoId;
            if (cursoRows.length > 0) {
                cursoId = cursoRows[0].id;
            } else {
                const [newCursoRows] = await pool.query('INSERT INTO cursos (nombre) VALUES (?) RETURNING id', [curso]);
                cursoId = newCursoRows[0].id;
            }

            await pool.query(
                `INSERT INTO estudiantes (rut, nombre, apellido, curso_id, sexo) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON CONFLICT (rut) DO UPDATE SET 
                 nombre = EXCLUDED.nombre, 
                 apellido = EXCLUDED.apellido, 
                 curso_id = EXCLUDED.curso_id, 
                 sexo = EXCLUDED.sexo`,
                [rut, nombre, apellido, cursoId, sexo]
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
