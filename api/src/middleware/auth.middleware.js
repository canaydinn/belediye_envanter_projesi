// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

// Kimlik doğrulama: Token var mı, geçerli mi?
function requireAuth(req, res, next) {
  // Hem header'dan, hem cookie'den bak
  const authHeader = req.headers['authorization'] || req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Yetkisiz erişim: Token bulunamadı' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded içinde { id, role_id, ... } bekliyoruz
    req.user = decoded;
    next();
  } catch (err) {
    console.error('requireAuth hata:', err);
    return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
  }
}

// Sadece süper admin (role_id = 5) erişsin
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role_id !== 5) {
    return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireSuperAdmin,
};
