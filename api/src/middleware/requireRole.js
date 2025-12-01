module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Oturum bulunamadı' });
    }

    // Şimdilik role_id üzerinden kontrol ediyoruz (1: admin, 2: taşınır kayıt, vb.)
    if (!allowedRoles.includes(req.user.role_id)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    next();
  };
};
