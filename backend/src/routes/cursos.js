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

module.exports = router;
