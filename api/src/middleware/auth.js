const { verifyToken } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Oturum bulunamadı' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role_id }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş oturum' });
  }
};
