// src/middleware/role.middleware.js
module.exports.requireRole = (roles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Bu işlem için yetkiniz bulunmamaktadır.'
      });
    }
    next();
  };
};
