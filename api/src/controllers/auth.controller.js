// api/src/controllers/auth.controller.js
const knex = require('../config/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// POST /api/auth/login
async function login (req, res){
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Eposta ve şifre zorunludur' });
    }

    const user = await knex('users')
      .where({ email })
      .first();

    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ message: 'Kullanıcı pasif durumda' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Hatalı şifre' });
    }

    // Çok belediyeli yapı için municipality_id de token'a dahil
    const payload = {
      id: user.id,
      role_id: user.role_id,
      role:user.role,
      municipality_id: user.municipality_id,
      username: user.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '12h',
    });

    // Geliştirme ortamı için cookie ayarları
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // prod'da true yapılmalı (HTTPS)
      sameSite: 'lax',
    });

    return res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        municipality_id: user.municipality_id || null,
      },
    });
  } catch (err) {
    console.error('auth.login hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
// POST /api/auth/signup
async function signup (req, res) {
  try {
    const {
      username: rawUsername,
      email: rawEmail,
      password,
      full_name,
      role_id,
      municipality_id,
    } = req.body;

    const username = rawUsername?.trim();
    const email = rawEmail?.trim().toLowerCase();

    if (!username || !password || !municipality_id) {
      return res.status(400).json({
        message:
          'username, password ve municipality_id alanları kayıt için zorunludur',
      });
    }

    const municipality = await knex('municipalities')
      .where({ id: municipality_id, is_active: true })
      .first();

    if (!municipality) {
      return res
        .status(400)
        .json({ message: 'Geçerli ve aktif bir belediye bulunamadı' });
    }

    const existsQuery = knex('users').where({ username });
    if (email) {
      existsQuery.orWhere({ email });
    }

    const exists = await existsQuery.first();

    if (exists) {
      return res
        .status(400)
        .json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [createdUser] = await knex('users')
      .insert({
        username,
        email,
        full_name,
        role_id: role_id || 5, // default: standart kullanıcı
        municipality_id,
        password_hash,
        is_active: true,
      })
      .returning([
        'id',
        'username',
        'email',
        'full_name',
        'role_id',
        'municipality_id',
        'is_active',
      ]);

    return res.status(201).json({
      message: 'Kayıt işlemi başarılı',
      user: createdUser,
    });
  } catch (err) {
    console.error('auth.signup hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// GET /api/auth/me
async function me (req, res){
  // auth middleware'de req.user set ediliyor
  if (!req.user) {
    return res.status(401).json({ message: 'Oturum bulunamadı' });
  }

  return res.json({
    user: req.user,
  });
};

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Çıkış yapıldı' });
};
// api/src/controllers/auth.controller.js (içine ek)

async function municipalitySignup(req, res) {
  const trx = await knex.transaction();
  try {
    const {
      code,
      municipality_name,
      province,
      district,
      tax_number,
      municipality_address,
      contact_email,
      contact_phone,
      contact_person,
      license_start_date,
      license_end_date,
      quota_end_date,
      admin_username,
      admin_full_name,
      admin_email,
      admin_password,
    } = req.body;

    // Basit zorunlu alan kontrolü
    if (!municipality_name || !code || !province || !district || !admin_email || !admin_password) {
      await trx.rollback();
      return res.status(400).json({ message: 'Zorunlu alanlar eksik' });
    }

    const username = admin_username || admin_email?.split('@')[0];

    if (!username) {
      await trx.rollback();
      return res.status(400).json({ message: 'Yönetici kullanıcı adı veya e-posta gerekli' });
    }

    // Aynı email ile kullanıcı var mı?
    const existingUser = await trx('users').where({ email: admin_email }).first();
    if (existingUser) {
      await trx.rollback();
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
    }

    const existingMunicipality = await trx('municipalities').where({ code }).first();
    if (existingMunicipality) {
      await trx.rollback();
      return res.status(400).json({ message: 'Bu belediye kodu zaten kayıtlı' });
    }

    // Municipality oluştur
    const [municipality] = await trx('municipalities')
      .insert({
        code,
        name: municipality_name,
        province,
        district,
        tax_number: tax_number || null,
        address: municipality_address || null,
        contact_email: contact_email || admin_email || null,
        contact_phone: contact_phone || null,
        contact_person: contact_person || admin_full_name || null,
        status: 'pending',
        is_active: false,
        license_start_date: license_start_date || null,
        license_end_date: license_end_date || null,
        quota_end_date: quota_end_date || null,
      })
      .returning('*');

    // Şifre hash vs. (bcrypt kullanıyorsan)
    const passwordHash = await bcrypt.hash(admin_password, 10);

    // İlk admin kullanıcı
    const [adminUser] = await trx('users')
      .insert({
        full_name: admin_full_name || contact_person || municipality_name,
        username,
        email: admin_email,
        password_hash: passwordHash,
        role_id: 1,
        municipality_id: municipality.id,
        is_active: false,
      })
      .returning('*');

    await trx.commit();

    return res.status(201).json({
      message: 'Başvurunuz alındı, superadmin onayladıktan sonra giriş yapabilirsiniz.',
    });
  } catch (err) {
    await trx.rollback();
    console.error('auth.municipalitySignup hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};


// POST /api/auth/change-password
async function changePassword (req, res) {
  try {
    const userId = req.user?.id;
    const { current_password, new_password } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Oturum bulunamadı' });
    }

    if (!current_password || !new_password) {
      return res
        .status(400)
        .json({ message: 'Eski ve yeni şifre alanları zorunludur' });
    }

    const user = await knex('users').where({ id: userId }).first();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Geçerli şifre hatalı' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await knex('users').where({ id: userId }).update({
      password_hash,
      updated_at: knex.fn.now(),
    });

    return res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    console.error('auth.changePassword hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// POST /api/auth/request-password-reset
async function requestPasswordReset  (req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'E-posta zorunludur' });
    }

    const user = await knex('users').where({ email }).first();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const resetToken = jwt.sign(
      { id: user.id, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Normalde e-posta ile gönderilir; burada yanıt ile dönüyoruz
    return res.json({
      message: 'Parola sıfırlama bağlantısı oluşturuldu',
      reset_token: resetToken,
    });
  } catch (err) {
    console.error('auth.requestPasswordReset hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// POST /api/auth/reset-password
async function resetPassword(req, res){
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res
        .status(400)
        .json({ message: 'token ve new_password zorunludur' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({ message: 'Geçersiz veya süresi dolmuş parola sıfırlama isteği' });
    }

    if (payload.type !== 'password_reset') {
      return res.status(400).json({ message: 'Token tipi geçersiz' });
    }

    const user = await knex('users').where({ id: payload.id }).first();

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await knex('users').where({ id: payload.id }).update({
      password_hash,
      updated_at: knex.fn.now(),
    });

    return res.json({ message: 'Parola güncellendi' });
  } catch (err) {
    console.error('auth.resetPassword hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// POST /api/auth/refresh
async function refreshToken (req, res) {
  try {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers['authorization'];
    let token = cookieToken;

    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({ message: 'Oturum bulunamadı' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    } catch (err) {
      return res.status(401).json({ message: 'Token doğrulanamadı' });
    }

    const user = await knex('users')
      .where({ id: decoded.id })
      .select('id', 'username', 'role_id', 'municipality_id', 'is_active')
      .first();

    if (!user || user.is_active === false) {
      return res.status(401).json({ message: 'Kullanıcı pasif veya bulunamadı' });
    }

    const newPayload = {
      id: user.id,
      role_id: user.role_id,
      municipality_id: user.municipality_id,
      username: user.username,
    };

    const newToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: '12h' });

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return res.json({
      message: 'Token yenilendi',
      token: newToken,
      user: newPayload,
    });
  } catch (err) {
    console.error('auth.refreshToken hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

module.exports = {
  login,
  signup,
  me,
  logout,
  municipalitySignup,
  changePassword,
  requestPasswordReset,
  resetPassword,
  refreshToken,
};