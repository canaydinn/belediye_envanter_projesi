// api/src/controllers/departments.controller.js
const knex = require('../config/knex');

// Tüm müdürlükleri listele
exports.getAll = async (req, res) => {
  try {
    const departments = await knex('departments')
      .select('id', 'code', 'name', 'manager_user_id');

    res.json(departments);
  } catch (err) {
    console.error('Departments getAll hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Tek bir müdürlüğü getir
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await knex('departments')
      .select('id', 'code', 'name', 'manager_user_id')
      .where({ id })
      .first();

    if (!department) {
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    res.json(department);
  } catch (err) {
    console.error('Departments getById hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Yeni müdürlük ekle
exports.create = async (req, res) => {
  try {
    const { code, name, manager_user_id } = req.body;

    const [inserted] = await knex('departments')
      .insert({ code, name, manager_user_id: manager_user_id || null })
      .returning(['id', 'code', 'name', 'manager_user_id']);

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Departments create hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Müdürlük güncelle
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, manager_user_id } = req.body;

    const [updated] = await knex('departments')
      .where({ id })
      .update(
        { code, name, manager_user_id: manager_user_id || null },
        ['id', 'code', 'name', 'manager_user_id'],
      );

    if (!updated) {
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Departments update hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Müdürlük sil
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const affected = await knex('departments').where({ id }).del();

    if (!affected) {
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    res.json({ message: 'Birim silindi' });
  } catch (err) {
    console.error('Departments delete hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
