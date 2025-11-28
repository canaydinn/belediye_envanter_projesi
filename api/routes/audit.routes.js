const express = require('express');
const router = express.Router();

const auditController = require('../controllers/audit.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(requireAuth);
router.use(requireRole(['admin']));

// GET /api/audit
// Query: ?userId=&entity=&entityId=&page=&limit=
router.get('/', auditController.listAuditLogs);

module.exports = router;
