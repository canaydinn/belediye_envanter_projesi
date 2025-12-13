// api/src/middleware/auth.js

// JWT doğrulama işlemleri için jsonwebtoken kullanılır
const jwt = require('jsonwebtoken');

// Kullanıcıyı token’dan sonra DB’den tekrar çekmek için knex
const knex = require('../config/knex');

// JWT imza anahtarı
// Üretimde mutlaka .env üzerinden gelmeli
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

/**
 * AUTH MIDDLEWARE
 * --------------------------------------------------
 * Bu middleware şunları garanti eder:
 * 1) İstek bir kullanıcıdan mı geliyor?
 * 2) Token geçerli mi?
 * 3) Kullanıcı hâlâ aktif mi?
 * 4) Kullanıcının rolü ve belediyesi güncel mi?
 *
 * Başarılı olursa:
 *   → req.user set edilir
 *   → sistemdeki TEK doğruluk kaynağı req.user olur
 */
module.exports = async function auth(req, res, next) {
  try {
    // 1️⃣ Token’ı iki farklı kaynaktan okumaya çalış:
    // - HttpOnly cookie (web uygulamaları)
    // - Authorization: Bearer <token> (mobil, Postman, servisler)
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;

    // Öncelik cookie token’dadır
    let token = cookieToken;

    // Cookie yoksa Authorization header kontrol edilir
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7); // "Bearer " kısmı atılır
    }

    // 2️⃣ Token hiç yoksa → kullanıcı oturum açmamış demektir
    if (!token) {
      return res.status(401).json({ message: 'Oturum bulunamadı' });
    }

    // 3️⃣ Token doğrulanır
    // - İmza kontrol edilir
    // - Süre (exp) kontrol edilir
    // - Payload decode edilir
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4️⃣ Token içindeki ID ile kullanıcıyı DB’den tekrar çek
    // ⚠️ Token’a KÖRÜ KÖRÜNE güvenilmez
    // Çünkü:
    // - Kullanıcı pasif yapılmış olabilir
    // - Rolü değişmiş olabilir
    // - Belediye bilgisi değişmiş olabilir
    const user = await knex('users')
      .select(
        'id',
        'username',
        'email',
        'role_id',
        'municipality_id',
        'is_active'
      )
      .where({ id: decoded.id })
      .first();

    // 5️⃣ Kullanıcı yoksa veya pasifse erişimi kes
    if (!user || user.is_active === false) {
      return res.status(401).json({
        message: 'Kullanıcı pasif veya bulunamadı'
      });
    }

    // 6️⃣ Kullanıcıyı request’e bağla
    // 🔐 Bundan sonra sistemde TEK GERÇEK budur
    // Controller ve diğer middleware’ler SADECE burayı kullanır
    req.user = user;

    // 7️⃣ Yetkilendirme / tenant kontrolü / controller’a geç
    next();
  } catch (err) {
    // Token:
    // - Süresi dolmuş
    // - Bozulmuş
    // - Sahte
    // - Yanlış secret ile imzalanmış olabilir
    return res.status(401).json({
      message: 'Geçersiz veya süresi dolmuş token'
    });
  }
};
