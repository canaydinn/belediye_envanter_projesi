// api/src/controllers/roles.controller.js
const knex = require('../config/knex');

/**
 * GET /api/roles
 * Tüm rolleri listeler
 */
exports.getAll = async (req, res) => {
  try {
    const roles = await knex('roles')
      .select('id', 'name', 'description')
      .orderBy('id', 'asc');

    return res.json(roles);
  } catch (err) {
    console.error('Roles getAll hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * GET /api/roles/:id
 * Tek bir rolü getirir
 */
exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz rol ID' });
    }

    const role = await knex('roles')
      .select('id', 'name', 'description')
      .where({ id })
      .first();

    if (!role) return res.status(404).json({ message: 'Rol bulunamadı' });
    return res.json(role);
  } catch (err) {
    console.error('Roles getById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
