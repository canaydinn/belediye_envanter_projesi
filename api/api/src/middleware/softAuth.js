// api/src/middleware/softAuth.js
const jwt = require('jsonwebtoken');
const knex = require('../config/knex');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

module.exports = async function softAuth(req, res, next) {
  try {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;

    let token = cookieToken;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return res.status(401).json({ message: 'Oturum bulunamadı' });
    }

    // Süresi dolmuş olsa bile decode et
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });

    // DB’den güncel kullanıcıyı çek
    const user = await knex('users')
      .select('id', 'username', 'email', 'role_id', 'municipality_id', 'is_active')
      .where({ id: decoded.id })
      .first();

    if (!user || user.is_active === false) {
      return res.status(401).json({ message: 'Kullanıcı pasif veya bulunamadı' });
    }

    // Standart: refresh dahil her yerde req.user kullanılsın
    req.user = user;
    req.tokenPayload = decoded; // istersen debug/ek kontrol için

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token doğrulanamadı' });
  }
};
