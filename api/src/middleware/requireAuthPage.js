const jwt = require('jsonwebtoken');

module.exports = function requireAuthPage(req, res, next) {
  try {
    if (req.path === '/login.html') return next();
    if (req.path.startsWith('/assets/')) return next();

    const token = req.cookies?.token; // ✅ cookie adı: token
    if (!token) return res.redirect('/admin/login.html');

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    req.user = payload;

    const superAdminOnly = ['/super-admin-dashboard.html'];
    if (superAdminOnly.includes(req.path) && payload.role_id !== 1) {
      return res.status(403).send('Bu sayfa için yetkiniz yok.');
    }

    return next();
  } catch (err) {
    return res.redirect('/admin/login.html');
  }
};
