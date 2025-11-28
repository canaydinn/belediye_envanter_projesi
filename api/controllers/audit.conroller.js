// controllers/audit.controller.js
const AuditLog = require('../models/AuditLog');

exports.listAuditLogs = async (req, res) => {
  try {
    const {
      userId,
      entity,
      entityId,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (entity) query.entity = entity;
    if (entityId) query.entityId = entityId;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      AuditLog.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ timestamp: -1 }),
      AuditLog.countDocuments(query)
    ]);

    return res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (err) {
    console.error('LIST_AUDIT_LOGS_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Log kayıtları alınırken bir hata oluştu.'
    });
  }
};
