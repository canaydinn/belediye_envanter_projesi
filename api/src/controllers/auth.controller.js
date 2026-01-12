// api/src/controllers/auth.controller.js
const knex = require('../config/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ROLES = require('../constants/roles');

const IS_PROD = process.env.NODE_ENV === 'production';

// In production, JWT_SECRET must be explicitly provided – never fall back to a default
if (IS_PROD && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// In non-production environments, a dev default is allowed for convenience
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Cookie ayarları: Prod ortamında HTTPS + daha sıkı ayar
const buildAuthCookieOptions = () => {
  // Eğer frontend ayrı domain/port ise ve cross-site gerekiyorsa:
  // sameSite: 'none' + secure: true gerekir.
  // Tek domain / aynı site ise 'lax' daha güvenli ve pratiktir.
  const sameSite = IS_PROD ? 'lax' : 'lax';

  return {
    httpOnly: true,
    secure: IS_PROD, // prod => true
    sameSite,
    // maxAge: 12 * 60 * 60 * 1000, // istersen cookie TTL
  };
};

const signAccessToken = (user) => {
  const payload = {
    id: user.id,
    role_id: user.role_id,
    municipality_id: user.municipality_id || null,
    username: user.username,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
};

// POST /api/auth/login
async function login(req, res) {
  try {
    // Debug: DB connection bilgilerini logla (production'da da görünür)
    console.log('🔍 Login attempt - DB Config Check:', {
      hasConnectionString: !!process.env.SUPABASE_DB_CONNECTION_STRING,
      host: process.env.SUPABASE_DB_HOST || 'NOT SET',
      user: process.env.SUPABASE_DB_USER || 'NOT SET',
      database: process.env.SUPABASE_DB_NAME || 'NOT SET',
      hasPassword: !!process.env.SUPABASE_DB_PASSWORD,
      nodeEnv: process.env.NODE_ENV
    });
    
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Eposta ve şifre zorunludur' });
    }

    const user = await knex('users')
      .where({ email })
      .select(
        'id',
        'username',
        'email',
        'full_name',
        'password_hash',
        'role_id',
        'municipality_id',
        'is_active'
      )
      .first();

    // Enum sızmasını azalt: kullanıcı yoksa da aynı mesaj
    if (!user || user.is_active === false) {
      return res.status(401).json({ message: 'Eposta veya şifre hatalı' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Eposta veya şifre hatalı' });
    }

    const token = signAccessToken(user);

    res.cookie('token', token, buildAuthCookieOptions());

    // Cookie kullandığın için token'ı response body'de döndürmüyoruz
    return res.json({
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role_id: user.role_id,
        municipality_id: user.municipality_id || null,
      },
    });
  } catch (err) {
    console.error('❌ auth.login hatası:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      hostname: err.hostname,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Database bağlantı hatası için özel mesaj
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      console.error('❌ Database bağlantı hatası tespit edildi!');
      return res.status(500).json({ 
        message: 'Veritabanı bağlantı hatası. Lütfen yöneticiye başvurun.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    // Knex query hatası
    if (err.message && err.message.includes('timeout')) {
      console.error('❌ Database query timeout hatası!');
      return res.status(500).json({ 
        message: 'Veritabanı sorgusu zaman aşımına uğradı.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    return res.status(500).json({ 
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// POST /api/auth/signup (Public)
async function signup(req, res) {
  try {
    const rawUsername = req.body?.username;
    const rawEmail = req.body?.email;

    const username = rawUsername?.trim();
    const email = rawEmail?.trim()?.toLowerCase();
    const password = req.body?.password;
    const full_name = req.body?.full_name || null;
    const municipality_id = req.body?.municipality_id;

    if (!username || !email || !password || !municipality_id) {
      return res.status(400).json({
        message: 'username, email, password ve municipality_id alanları zorunludur',
      });
    }

    // Belediye aktif mi?
    const municipality = await knex('municipalities')
      .where({ id: municipality_id, is_active: true })
      .first();

    if (!municipality) {
      return res.status(400).json({ message: 'Geçerli ve aktif bir belediye bulunamadı' });
    }

    // username / email tekilliği
    const exists = await knex('users')
      .where({ username })
      .orWhere({ email })
      .first();

    if (exists) {
      return res.status(400).json({ message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // 🚫 role_id client’tan alınmaz (privilege escalation kapalı)
    const role_id = ROLES.USER ?? 5;

    const [createdUser] = await knex('users')
      .insert({
        username,
        email,
        full_name,
        role_id,
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
}

// GET /api/auth/me
async function me(req, res) {
  if (!req.user) return res.status(401).json({ message: 'Oturum bulunamadı' });
  return res.json({ user: req.user });
}

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie('token', buildAuthCookieOptions());
  return res.json({ message: 'Çıkış yapıldı' });
}

// POST /api/auth/municipality-signup (Public)
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
    } = req.body || {};

    if (
      !municipality_name ||
      !code ||
      !province ||
      !district ||
      !admin_email ||
      !admin_password
    ) {
      await trx.rollback();
      return res.status(400).json({ message: 'Zorunlu alanlar eksik' });
    }

    const normalizedAdminEmail = String(admin_email).trim().toLowerCase();
    const username = (admin_username || normalizedAdminEmail.split('@')[0] || '').trim();

    if (!username) {
      await trx.rollback();
      return res.status(400).json({ message: 'Yönetici kullanıcı adı veya e-posta gerekli' });
    }

    // Aynı email ile kullanıcı var mı?
    const existingUser = await trx('users').where({ email: normalizedAdminEmail }).first();
    if (existingUser) {
      await trx.rollback();
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
    }

    // Municipality code tekil mi?
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
        contact_email: contact_email || normalizedAdminEmail || null,
        contact_phone: contact_phone || null,
        contact_person: contact_person || admin_full_name || null,
        status: 'pending',
        is_active: false,
        license_start_date: license_start_date || null,
        license_end_date: license_end_date || null,
        quota_end_date: quota_end_date || null,
      })
      .returning('*');

    const passwordHash = await bcrypt.hash(admin_password, 10);

    // ✅ İlk admin kullanıcı: SUPERADMIN değil, ADMIN
    const adminRoleId = ROLES.ADMIN;

    if (!adminRoleId) {
      await trx.rollback();
      return res.status(500).json({
        message: 'Rol tanımı eksik: ROLES.ADMIN bulunamadı',
      });
    }

    await trx('users').insert({
      full_name: admin_full_name || contact_person || municipality_name,
      username,
      email: normalizedAdminEmail,
      password_hash: passwordHash,
      role_id: adminRoleId,
      municipality_id: municipality.id,
      is_active: false, // onay sonrası true
    });

    await trx.commit();

    return res.status(201).json({
      message: 'Başvurunuz alındı. Onaylandıktan sonra giriş yapabilirsiniz.',
    });
  } catch (err) {
    await trx.rollback();
    console.error('auth.municipalitySignup hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
}

// POST /api/auth/change-password (Protected)
async function changePassword(req, res) {
  try {
    const userId = req.user?.id;
    const { current_password, new_password } = req.body || {};

    if (!userId) return res.status(401).json({ message: 'Oturum bulunamadı' });

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Eski ve yeni şifre alanları zorunludur' });
    }

    // Basit policy (istersen güçlendir)
    if (String(new_password).length < 8) {
      return res.status(400).json({ message: 'Yeni şifre en az 8 karakter olmalıdır' });
    }

    const user = await knex('users').where({ id: userId }).first();
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Geçerli şifre hatalı' });

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
}

// POST /api/auth/request-password-reset (Public)
async function requestPasswordReset(req, res) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'E-posta zorunludur' });

    const user = await knex('users').where({ email }).first();

    // Enum sızmasını önle: kullanıcı yoksa da aynı yanıt
    // Prod senaryoda token response ile dönmez; e-posta ile gönderilir.
    if (!user) {
      return res.json({
        message: 'Eğer hesap mevcutsa parola sıfırlama bağlantısı gönderilecektir.',
      });
    }

    const resetToken = jwt.sign(
      { id: user.id, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: burada mail gönderim servisine bağlanmalı.
    // Dev ortamında kolaylık için token döndürülebilir:
    if (!IS_PROD) {
      return res.json({
        message: 'Parola sıfırlama bağlantısı oluşturuldu (dev)',
        reset_token: resetToken,
      });
    }

    return res.json({
      message: 'Eğer hesap mevcutsa parola sıfırlama bağlantısı gönderilecektir.',
    });
  } catch (err) {
    console.error('auth.requestPasswordReset hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
}

// POST /api/auth/reset-password (Public)
async function resetPassword(req, res) {
  try {
    const { token, new_password } = req.body || {};
    if (!token || !new_password) {
      return res.status(400).json({ message: 'token ve new_password zorunludur' });
    }

    if (String(new_password).length < 8) {
      return res.status(400).json({ message: 'Yeni şifre en az 8 karakter olmalıdır' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş istek' });
    }

    if (payload.type !== 'password_reset') {
      return res.status(400).json({ message: 'Token tipi geçersiz' });
    }

    const user = await knex('users').where({ id: payload.id }).first();
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

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
}

// POST /api/auth/refresh (Protected via softAuth)
async function refreshToken(req, res) {
  try {
    // Route: softAuth zaten req.user ve req.tokenPayload set ediyor olmalı.
    // (Sende softAuth sürümü bu şekildeydi.)
    const user = req.user;
    if (!user || user.is_active === false) {
      return res.status(401).json({ message: 'Oturum bulunamadı' });
    }

    const newToken = signAccessToken(user);
    res.cookie('token', newToken, buildAuthCookieOptions());

    return res.json({
      message: 'Token yenilendi',
      user: {
        id: user.id,
        role_id: user.role_id,
        municipality_id: user.municipality_id || null,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('auth.refreshToken hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
}

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
