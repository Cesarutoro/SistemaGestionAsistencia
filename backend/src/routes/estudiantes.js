const express = require('express');
const router = express.Router();
const pool = require('../db');
const NodeCache = require('node-cache');
const multer = require('multer');

const cache = new NodeCache({ stdTTL: 30, checkperiod: 60 });
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { logAudit } = require('../utils/audit');
const { requirePermission, requireModuleWrite } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024, // máximo 5 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
        ];
        const allowedExts = ['.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx o .xls)'));
        }
    },
});

// Listar estudiantes con paginación y búsqueda
router.get('/', requirePermission('estudiantes', 'atrasos', 'salidas-anticipadas'), async (req, res) => {
    try {
        const rawLimit = req.query?.limit;
        const hasPagination = rawLimit !== undefined && rawLimit !== '';
        const page = Math.max(1, parseInt(req.query?.page) || 1);
        const limit = hasPagination ? Math.min(200, Math.max(1, parseInt(rawLimit))) : 0;
        const search = typeof req.query?.search === 'string' ? req.query.search.trim() : '';

        // Cache simple: solo para consultas SIN paginación ni búsqueda
        if (!hasPagination && !search) {
            const cached = cache.get('todos');
            if (cached) return res.json(cached);
        }

        let whereClause = '';
        const params = [];
        if (search) {
            whereClause = ' AND (e.nombre ILIKE ? OR e.apellido ILIKE ? OR e.rut ILIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (hasPagination) {
            const offset = (page - 1) * limit;
            const [countRows] = await pool.query(`
                SELECT COUNT(*) AS total FROM estudiantes e WHERE 1=1${whereClause}
            `, params);
            const total = Number(countRows[0]?.total || 0);

            const [rows] = await pool.query(`
                SELECT e.id, e.nombre, e.apellido, e.curso_id, c.nombre as curso_nombre, e.rut
                FROM estudiantes e
                JOIN cursos c ON e.curso_id = c.id
                WHERE 1=1${whereClause}
                ORDER BY c.nombre ASC, e.apellido ASC
                LIMIT ? OFFSET ?
            `, [...params, limit, offset]);
            return res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
        }

        const [rows] = await pool.query(`
            SELECT e.id, e.nombre, e.apellido, e.curso_id, c.nombre as curso_nombre, e.rut
            FROM estudiantes e
            JOIN cursos c ON e.curso_id = c.id
            WHERE 1=1${whereClause}
            ORDER BY c.nombre ASC, e.apellido ASC
        `, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un estudiante
router.post('/', requireModuleWrite('estudiantes'), validate('crearEstudiante'), async (req, res) => {
    const { rut, nombre, apellido, curso_id, sexo } = req.body;

    try {
        const [rows] = await pool.query(
            'INSERT INTO estudiantes (rut, nombre, apellido, curso_id, sexo) VALUES (?, ?, ?, ?, ?) RETURNING id',
            [rut, nombre, apellido, curso_id, sexo]
        );
        const id = rows[0]?.id;
        await logAudit({
            usuarioId: req.user?.id,
            accion: 'CREAR_ESTUDIANTE',
            entidad: 'estudiantes',
            entidadId: id,
            detalle: { rut, nombre, apellido, curso_id, sexo },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        cache.del('todos');
        res.status(201).json({ id, rut, nombre, apellido, curso_id, sexo });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un estudiante con ese RUT' });
        }

        if (error.code === '23503') {
            return res.status(400).json({ error: 'El curso seleccionado no existe' });
        }

        res.status(500).json({ error: error.message });
    }
});

// Actualizar curso masivamente — debe ir ANTES de /:id para que Express no lo trate como id
router.put('/bulk-update-curso', requireModuleWrite('estudiantes'), validate('bulkUpdateCurso'), async (req, res) => {
    const { estudiante_ids, curso_id } = req.body;
    try {
        // Construir placeholders dinámicos para IN (?, ?, ...)
        const placeholders = estudiante_ids.map(() => '?').join(', ');
        await pool.query(
            `UPDATE estudiantes SET curso_id = ? WHERE id IN (${placeholders})`,
            [curso_id, ...estudiante_ids]
        );
        cache.del('todos');
        res.json({ message: `${estudiante_ids.length} estudiantes actualizados correctamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un estudiante
router.put('/:id', requireModuleWrite('estudiantes'), async (req, res) => {
    const { id } = req.params;
    const { rut, nombre, apellido, curso_id, sexo } = req.body;
    try {
        await pool.query(
            'UPDATE estudiantes SET rut=?, nombre=?, apellido=?, curso_id=?, sexo=? WHERE id=?',
            [rut, nombre, apellido, curso_id, sexo, id]
        );
        await logAudit({
            usuarioId: req.user?.id,
            accion: 'EDITAR_ESTUDIANTE',
            entidad: 'estudiantes',
            entidadId: parseInt(id),
            detalle: { rut, nombre, apellido, curso_id, sexo },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        cache.del('todos');
        res.json({ message: 'Estudiante actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un estudiante
router.delete('/:id', requireModuleWrite('estudiantes'), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM estudiantes WHERE id = ?', [id]);
        await logAudit({
            usuarioId: req.user?.id,
            accion: 'ELIMINAR_ESTUDIANTE',
            entidad: 'estudiantes',
            entidadId: parseInt(id),
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        cache.del('todos');
        res.json({ message: 'Estudiante eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Subir Excel de estudiantes
router.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, requireModuleWrite('estudiantes'), async (req, res) => {
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

        cache.del('todos');
        res.json({ message: 'Excel procesado con éxito' });
        await logAudit({
            usuarioId: req.user?.id,
            accion: 'IMPORTAR_ESTUDIANTES_EXCEL',
            entidad: 'estudiantes',
            detalle: { filas: data.length },
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});

module.exports = router;
