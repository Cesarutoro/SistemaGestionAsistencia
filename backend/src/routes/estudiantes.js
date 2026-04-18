const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { logAudit } = require('../utils/audit');
const { requirePermission, requireModuleWrite } = require('../middleware/auth');

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

function normalizarNuevoEstudiante(body) {
    const rut = typeof body.rut === 'string' ? body.rut.trim() : '';
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : '';
    const sexo = typeof body.sexo === 'string' ? body.sexo.trim() : '';
    const cursoIdRaw = body.curso_id;
    const cursoId = Number.parseInt(cursoIdRaw, 10);

    const errores = [];

    if (!rut) errores.push('rut es obligatorio');
    if (!nombre) errores.push('nombre es obligatorio');
    if (!apellido) errores.push('apellido es obligatorio');
    if (!Number.isInteger(cursoId) || cursoId <= 0) errores.push('curso_id es obligatorio');

    return {
        datos: { rut, nombre, apellido, curso_id: cursoId, sexo: sexo || null },
        errores,
    };
}

// Listar todos los estudiantes con su curso
router.get('/', requirePermission('estudiantes', 'atrasos', 'salidas-anticipadas'), async (req, res) => {
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
router.post('/', requireModuleWrite('estudiantes'), async (req, res) => {
    const { datos, errores } = normalizarNuevoEstudiante(req.body);

    if (errores.length > 0) {
        return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
    }

    const { rut, nombre, apellido, curso_id, sexo } = datos;

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
router.put('/bulk-update-curso', requireModuleWrite('estudiantes'), async (req, res) => {
    const { estudiante_ids, curso_id } = req.body;
    if (!estudiante_ids || !Array.isArray(estudiante_ids) || estudiante_ids.length === 0 || !curso_id) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    try {
        // Construir placeholders dinámicos para IN (?, ?, ...)
        const placeholders = estudiante_ids.map(() => '?').join(', ');
        await pool.query(
            `UPDATE estudiantes SET curso_id = ? WHERE id IN (${placeholders})`,
            [curso_id, ...estudiante_ids]
        );
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
