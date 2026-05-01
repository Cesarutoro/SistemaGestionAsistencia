const express = require('express');
const router = express.Router();
const pool = require('../db');
const NodeCache = require('node-cache');
const { requireRole } = require('../middleware/auth');

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const getTodayLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().split('T')[0];
};

router.get('/', async (req, res) => {
  const cached = cache.get('activos');
  if (cached) return res.json(cached);

  try {
    const hoy = getTodayLocal();
    const [rows] = await pool.query(`
      SELECT id, titulo, mensaje, tipo, activo_desde, activo_hasta, created_at
      FROM anuncios
      WHERE activo_desde <= ? AND (activo_hasta IS NULL OR activo_hasta >= ?)
      ORDER BY created_at DESC
    `, [hoy, hoy]);
    cache.set('activos', rows);
    res.json(rows);
  } catch (error) {
    console.error('[anuncios] GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/todos', requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, titulo, mensaje, tipo, activo_desde, activo_hasta, created_at
      FROM anuncios
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { titulo, mensaje, tipo, activo_desde, activo_hasta } = req.body;
  if (!titulo || !mensaje) {
    return res.status(400).json({ error: 'Título y mensaje son obligatorios' });
  }
  const tiposValidos = ['info', 'warning', 'maintenance'];
  const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'info';
  try {
    const [rows] = await pool.query(
      `INSERT INTO anuncios (titulo, mensaje, tipo, activo_desde, activo_hasta)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [titulo, mensaje, tipoFinal, activo_desde || getTodayLocal(), activo_hasta || null]
    );
    res.status(201).json({ id: rows[0].id, titulo, mensaje, tipo: tipoFinal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { titulo, mensaje, tipo, activo_desde, activo_hasta } = req.body;
  try {
    await pool.query(
      `UPDATE anuncios SET titulo = COALESCE(?, titulo), mensaje = COALESCE(?, mensaje),
       tipo = COALESCE(?, tipo), activo_desde = COALESCE(?, activo_desde),
       activo_hasta = COALESCE(?, activo_hasta)
       WHERE id = ?`,
      [titulo || null, mensaje || null, tipo || null, activo_desde || null, activo_hasta || null, id]
    );
    res.json({ message: 'Anuncio actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM anuncios WHERE id = ?', [id]);
    res.json({ message: 'Anuncio eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
