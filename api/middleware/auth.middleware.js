// src/middleware/auth.middleware.js
module.exports.requireAuth = (req, res, next) => {
  // JWT doğrulama & user'ı req.user'a koyma
  // başarısızsa 401 dön
  next();
};
