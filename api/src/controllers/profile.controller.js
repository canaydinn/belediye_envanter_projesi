const bcrypt = require('bcrypt');
const knex = require('../config/knex');

const buildProfileQuery = (userId, municipalityId) => {
  const query = knex('users as u')
    .leftJoin('roles as r', 'u.role_id', 'r.id')
    .leftJoin('municipalities as m', 'u.municipality_id', 'm.id')
    .where('u.id', userId)
    .whereNull('u.deleted_at')
    .select(
      'u.id',
      'u.username',
      'u.email',
      'u.full_name',
      'u.phone',
      'u.role_id',
      'u.municipality_id',
      'u.is_active',
      'u.email_verified_at',
      'u.last_login_at',
      'u.last_login_ip',
      'u.created_at',
      'u.updated_at',
      knex.raw('COALESCE(r.name, ?) as role_name', ['Rol bilgisi yok']),
      knex.raw('COALESCE(m.name, ?) as municipality_name', ['Belediye belirtilmemiş'])
    );

  if (municipalityId) {
    query.andWhere('u.municipality_id', municipalityId);
  }

  return query;
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const municipalityId = req.tenantMunicipalityId ?? null;

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    const profile = await buildProfileQuery(userId, municipalityId).first();

    if (!profile) {
      return res.status(404).json({ message: 'Profil bulunamadı' });
    }

    return res.json({ profile });
  } catch (error) {
    console.error('profile.getProfile hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const municipalityId = req.tenantMunicipalityId ?? null;
    const { full_name, email, phone, username } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    if (!full_name || !email || !username) {
      return res.status(400).json({ message: 'Ad soyad, kullanıcı adı ve e-posta zorunludur' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();
    const trimmedFullName = String(full_name).trim();

    const existingUser = await knex('users')
      .where({ id: userId })
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      })
      .whereNull('deleted_at')
      .first();

    if (!existingUser) {
      return res.status(404).json({ message: 'Profil bulunamadı' });
    }

    const duplicateEmail = await knex('users')
      .where({ email: normalizedEmail })
      .whereNull('deleted_at')
      .whereNot({ id: userId })
      .first();

    if (duplicateEmail) {
      return res.status(400).json({ message: 'Bu e-posta adresi kullanımda' });
    }

    const duplicateUsername = await knex('users')
      .where({ username: normalizedUsername })
      .whereNull('deleted_at')
      .whereNot({ id: userId })
      .first();

    if (duplicateUsername) {
      return res.status(400).json({ message: 'Bu kullanıcı adı kullanımda' });
    }

    await knex('users')
      .where({ id: userId })
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      })
      .update({
        full_name: trimmedFullName,
        email: normalizedEmail,
        username: normalizedUsername,
        phone: phone ? String(phone).trim() : null,
        updated_by: req.user?.id || null,
        updated_at: knex.fn.now(),
      });

    const updatedProfile = await buildProfileQuery(userId, municipalityId).first();

    return res.json({
      message: 'Profil güncellendi',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('profile.updateProfile hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const municipalityId = req.tenantMunicipalityId ?? null;
    const { current_password, new_password } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: 'Kullanıcı oturumu bulunamadı' });
    }

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Mevcut ve yeni şifre alanları zorunludur' });
    }

    if (String(new_password).length < 8) {
      return res.status(400).json({ message: 'Yeni şifre en az 8 karakter olmalıdır' });
    }

    const user = await knex('users')
      .where({ id: userId })
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      })
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return res.status(404).json({ message: 'Profil bulunamadı' });
    }

    const isCurrentValid = await bcrypt.compare(String(current_password), user.password_hash);
    if (!isCurrentValid) {
      return res.status(400).json({ message: 'Mevcut şifre geçersiz' });
    }

    const newPasswordHash = await bcrypt.hash(String(new_password), 10);

    await knex('users')
      .where({ id: userId })
      .modify((queryBuilder) => {
        if (municipalityId) {
          queryBuilder.andWhere({ municipality_id: municipalityId });
        }
      })
      .update({
        password_hash: newPasswordHash,
        updated_by: req.user?.id || null,
        updated_at: knex.fn.now(),
      });

    return res.json({ message: 'Şifre güncellendi' });
  } catch (error) {
    console.error('profile.updatePassword hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};