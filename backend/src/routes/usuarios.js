const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { requireRole } = require('../middleware/auth');

// Todas las rutas aquí requieren rol de 'admin'
router.use(requireRole('admin'));

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY nombre ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear un nuevo usuario
router.post('/', async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    try {
        const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [rows] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?) RETURNING id',
            [nombre, email, password_hash, rol]
        );
        res.status(201).json({ 
            id: rows[0].id, 
            nombre, email, rol 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Editar un usuario
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password, rol, activo } = req.body;

    try {
        let queryStr = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ?';
        let params = [nombre, email, rol, !!activo];

        if (password && password.trim() !== '') {
            const password_hash = await bcrypt.hash(password, 10);
            queryStr += ', password_hash = ?';
            params.push(password_hash);
        }

        queryStr += ' WHERE id = ?';
        params.push(id);

        await pool.query(queryStr, params);
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar un usuario (o desactivar)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const currentUserId = req.user.id; // Asumiendo que el middleware auth añade el id del usuario

    // Evitar que el admin se borre a sí mismo
    if (parseInt(id) === currentUserId) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    try {
        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
