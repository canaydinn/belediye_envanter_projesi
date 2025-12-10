const knex = require('../config/knex');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
const municipalityId = req.user?.municipality_id ?? null;

    const users = await knex('users')
      .select(
        'id',
        'username',
        'email',
        'full_name',
        'role_id',
        'municipality_id',
        'is_active',
        'phone',
        'email_verified_at'
      )
      .whereNull('deleted_at')
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      });    res.json(users);
  } catch (err) {
    console.error('getAll users hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await knex('users')
      .select(
        'id',
        'username',
        'email',
        'full_name',
        'role_id',
        'municipality_id',
        'is_active',
        'phone',
        'email_verified_at'
      )
      .where({ id })
      .whereNull('deleted_at')
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      })
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
const {
      username,
      email,
      password,
      full_name,
      role_id,
      municipality_id,
      phone,
      is_active = true,
      email_verified,
    } = req.body;

    if (!username || !email || !password || !full_name || !role_id) {
      return res.status(400).json({ message: 'Kullanıcı adı, e-posta, şifre, ad soyad ve rol zorunludur' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Şifre en az 8 karakter olmalıdır' });
    }

    const enforcedMunicipalityId = req.user?.municipality_id ?? municipality_id ?? null;
    if (req.user?.municipality_id && municipality_id && Number(municipality_id) !== Number(req.user.municipality_id)) {
      return res.status(403).json({ message: 'Farklı bir belediye için kullanıcı oluşturamazsınız' });
    }

    const exists = await knex('users')
      .where({ username })
      .orWhere({ email })
      .first();
    

    const password_hash = await bcrypt.hash(password, 10);
  const emailVerifiedAt = email_verified ? new Date().toISOString() : null;
    const [inserted] = await knex('users')
      .insert({
        username,
        email,
        full_name,
        role_id,
        municipality_id: enforcedMunicipalityId,
        phone: phone || null,
        password_hash,
        is_active,
        email_verified_at: emailVerifiedAt,
        created_by: req.user?.id || null,
        updated_by: req.user?.id || null,
      })
.returning([
        'id',
        'username',
        'email',
        'full_name',
        'role_id',
        'municipality_id',
        'is_active',
        'phone',
        'email_verified_at',
      ]);
    res.status(201).json(inserted);
  } catch (err) {
    console.error('create user hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
 const { email, full_name, role_id, is_active, municipality_id, phone, email_verified } = req.body;
    const municipalityId = req.user?.municipality_id ?? null;

    const enforcedMunicipalityId = municipalityId ?? municipality_id ?? null;
    if (municipalityId && municipality_id && Number(municipality_id) !== Number(municipalityId)) {
      return res.status(403).json({ message: 'Farklı bir belediye için işlem yapılamaz' });
    }

    const updatePayload = {
      email,
      full_name,
      role_id,
      is_active,
      municipality_id: enforcedMunicipalityId,
      phone: phone || null,
      updated_by: req.user?.id || null,
      updated_at: knex.fn.now(),
    };

    if (email_verified !== undefined) {
      updatePayload.email_verified_at = email_verified ? new Date().toISOString() : null;
    }
    const [updated] = await knex('users')
      .where({ id })
      .whereNull('deleted_at')
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      })
      .update(updatePayload, [
        'id',
        'username',
        'email',
        'full_name',
        'role_id',
        'municipality_id',
        'is_active',
        'phone',
        'email_verified_at',
      ]);

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
const municipalityId = req.user?.municipality_id ?? null;

    const affected = await knex('users')
      .where({ id })
      .whereNull('deleted_at')
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      })
      .update({ deleted_at: knex.fn.now(), updated_by: req.user?.id || null });
    if (!affected) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı silindi' });
  } catch (err) {
    console.error('delete user hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
