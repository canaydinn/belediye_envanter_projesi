const knex = require('../config/knex');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const users = await knex('users').select('id', 'username', 'email', 'full_name', 'role_id', 'is_active');
    res.json(users);
  } catch (err) {
    console.error('getAll users hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await knex('users')
      .select('id', 'username', 'email', 'full_name', 'role_id', 'is_active')
      .where({ id })
      .first();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (err) {
    console.error('getById user hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, email, password, full_name, role_id } = req.body;

    const exists = await knex('users').where({ username }).orWhere({ email }).first();
    if (exists) {
      return res.status(400).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [inserted] = await knex('users')
      .insert({
        username,
        email,
        full_name,
        role_id,
        password_hash,
        is_active: true,
      })
      .returning(['id', 'username', 'email', 'full_name', 'role_id', 'is_active']);

    res.status(201).json(inserted);
  } catch (err) {
    console.error('create user hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, role_id, is_active } = req.body;

    const [updated] = await knex('users')
      .where({ id })
      .update(
        {
          email,
          full_name,
          role_id,
          is_active,
        },
        ['id', 'username', 'email', 'full_name', 'role_id', 'is_active']
      );

    if (!updated) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json(updated);
  } catch (err) {
    console.error('update user hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await knex('users').where({ id }).del();

    if (!affected) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı silindi' });
  } catch (err) {
    console.error('delete user hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
