const knex = require('../config/knex');
const bcrypt = require('bcryptjs');
const parseCount = (row) => Number(row?.total ?? row?.count ?? 0);
exports.getAll = async (req, res) => {
  try {
const municipalityId = req.tenantMunicipalityId ?? req.user?.municipality_id ?? null;

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
      });

    res.json(users);
  } catch (err) {
    console.error('getAll users hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
     const municipalityId = req.tenantMunicipalityId ?? req.user?.municipality_id ?? null;
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
exports.getSummaryStats = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId ?? req.user?.municipality_id ?? null;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const todayStart = knex.raw("DATE_TRUNC('day', NOW())");

    const [
      totalUsersRow,
      activeUsersRow,
      todayLoginsRow,
      adminRoleRow,
      managerRoleRow,
      userRoleRow,
    ] = await Promise.all([
      knex('users').where({ municipality_id: municipalityId }).whereNull('deleted_at').count({ total: 'id' }).first(),
      knex('users')
        .where({ municipality_id: municipalityId, is_active: true })
        .whereNull('deleted_at')
        .count({ total: 'id' })
        .first(),
      knex('users')
        .where({ municipality_id: municipalityId })
        .whereNull('deleted_at')
        .whereNotNull('last_login_at')
        .andWhere('last_login_at', '>=', todayStart)
        .count({ total: 'id' })
        .first(),
      knex('users')
        .where({ municipality_id: municipalityId, role_id: 1 })
        .whereNull('deleted_at')
        .count({ total: 'id' })
        .first(),
      knex('users')
        .where({ municipality_id: municipalityId, role_id: 4 })
        .whereNull('deleted_at')
        .count({ total: 'id' })
        .first(),
      knex('users')
        .where({ municipality_id: municipalityId, role_id: 5 })
        .whereNull('deleted_at')
        .count({ total: 'id' })
        .first(),
    ]);

    return res.json({
      totals: {
        users: parseCount(totalUsersRow),
        activeUsers: parseCount(activeUsersRow),
        todayLogins: parseCount(todayLoginsRow),
      },
      roles: {
        admin: parseCount(adminRoleRow),
        manager: parseCount(managerRoleRow),
        user: parseCount(userRoleRow),
      },
    });
  } catch (err) {
    console.error('getSummaryStats hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getTodayLogins = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId ?? req.user?.municipality_id ?? null;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 5;
    const todayStart = knex.raw("DATE_TRUNC('day', NOW())");

    const rows = await knex('users as u')
      .leftJoin('departments as d', function () {
        this.on('d.manager_user_id', '=', 'u.id').andOn('d.municipality_id', '=', 'u.municipality_id');
      })
      .where('u.municipality_id', municipalityId)
      .whereNull('u.deleted_at')
      .whereNotNull('u.last_login_at')
      .andWhere('u.last_login_at', '>=', todayStart)
      .select(
        'u.id',
        'u.full_name',
        'u.email',
        'u.role_id',
        'u.is_active',
        'u.last_login_at',
        'd.id as department_id',
        'd.name as department_name'
      )
      .orderBy('u.last_login_at', 'desc')
      .limit(limit);

    return res.json(rows);
  } catch (err) {
    console.error('getTodayLogins hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getDetailedList = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId ?? req.user?.municipality_id ?? null;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const users = await knex('users as u')
      .leftJoin('roles as r', 'u.role_id', 'r.id')
      .leftJoin('departments as d', function () {
        this.on('d.manager_user_id', '=', 'u.id').andOn('d.municipality_id', '=', 'u.municipality_id');
      })
      .where('u.municipality_id', municipalityId)
      .whereNull('u.deleted_at')
      .select(
        'u.id',
        'u.full_name',
        'u.email',
        'u.role_id',
        'u.is_active',
        'u.last_login_at',
        'u.created_at',
        'r.name as role_name',
        'd.id as department_id',
        'd.name as department_name'
      )
      .orderBy('u.created_at', 'desc');

    return res.json(users);
  } catch (err) {
    console.error('getDetailedList hatası:', err);
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
    
    if (exists) {
      if (exists.username === username) {
        return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
      if (exists.email === email) {
        return res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
      }
      return res.status(409).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' });
    }

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
    console.error('Hata detayları - code:', err.code, 'constraint:', err.constraint, 'table:', err.table);
    
    // Veritabanı constraint hatalarını kontrol et
    if (err.code === '23505') { // PostgreSQL unique constraint violation
      const constraintName = err.constraint || '';
      const tableName = err.table || '';
      
      // Primary key hatası - sequence sorunu olabilir, otomatik düzelt
      // users tablosu ve pkey constraint kontrolü
      const isPrimaryKeyError = constraintName === 'users_pkey' || 
                                 (constraintName.includes('pkey') && tableName === 'users') ||
                                 (constraintName.includes('pkey') && !tableName && err.detail && err.detail.includes('Key (id)'));
      
      if (isPrimaryKeyError) {
        try {
          console.log('users sequence hatası tespit edildi, düzeltiliyor...');
          console.log('Constraint:', constraintName, 'Table:', tableName, 'Detail:', err.detail);
          
          // Sequence'i mevcut max ID'ye göre güncelle
          // Önce sequence adını kontrol et - bigIncrements için users_id_seq olmalı
          await knex.raw(
            "SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);"
          );
          console.log('users sequence düzeltildi.');
          
          // Kullanıcıya tekrar denemesini söyle
          return res.status(409).json({
            message: 'ID sequence hatası tespit edildi ve düzeltildi. Lütfen formu tekrar gönderin.',
            ...(process.env.NODE_ENV !== 'production' && {
              error: err.message,
              code: err.code,
              detail: 'Sequence otomatik olarak düzeltildi. Formu tekrar gönderebilirsiniz.'
            })
          });
        } catch (fixErr) {
          console.error('Sequence düzeltme hatası:', fixErr);
          return res.status(500).json({
            message: 'ID sequence hatası. Lütfen sistem yöneticisine başvurun.',
            ...(process.env.NODE_ENV !== 'production' && {
              error: err.message,
              fixError: fixErr.message
            })
          });
        }
      }
      
      if (constraintName.includes('username') || constraintName.includes('users_username')) {
        return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
      if (constraintName.includes('email') || constraintName.includes('users_email')) {
        return res.status(409).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
      }
      return res.status(409).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' });
    }
    
    // Foreign key constraint hatası
    if (err.code === '23503') { // PostgreSQL foreign key constraint violation
      if (err.constraint && err.constraint.includes('role_id')) {
        return res.status(400).json({ message: 'Geçersiz rol ID' });
      }
      if (err.constraint && err.constraint.includes('municipality_id')) {
        return res.status(400).json({ message: 'Geçersiz belediye ID' });
      }
      return res.status(400).json({ message: 'Geçersiz referans değeri' });
    }
    
    // Not null constraint hatası
    if (err.code === '23502') { // PostgreSQL not null constraint violation
      return res.status(400).json({ message: 'Zorunlu alanlar eksik' });
    }
    
    res.status(500).json({ 
      message: 'Sunucu hatası',
      ...(process.env.NODE_ENV !== 'production' && { error: err.message })
    });
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
