const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireRole } = require('../middleware/auth');

// Todas las rutas aquí requieren rol de 'admin'
router.use(requireRole('admin'));

// Listar todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY nombre ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un nuevo usuario
router.post('/', async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        // Verificar si el email ya existe
        const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
            [nombre, email, passwordHash, rol]
        );

        res.status(201).json({ 
            message: 'Usuario creado exitosamente',
            id: result.insertId,
            nombre,
            email,
            rol
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un usuario
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, rol, activo, password } = req.body;

    try {
        let query = 'UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ?';
        const params = [nombre, email, rol, activo];

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            query += ', password_hash = ?';
            params.push(passwordHash);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await pool.query(query, params);
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un usuario (o desactivar)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    // Evitar que el admin se borre a sí mismo
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    try {
        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
