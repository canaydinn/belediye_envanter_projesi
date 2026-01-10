// api/src/routes/audit.routes.js
const express = require('express');
const router = express.Router();

const auditController = require('../controllers/audit.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// Audit ekranı genelde admin’e özel olmalı
router.get('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL), auditController.getAuditLogs);
router.get('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL), auditController.getAuditLogById);

// Audit log insert'i normalde UI'a açılmaz; gerekiyorsa admin ile sınırla
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), auditController.createAuditLog);

// Append-only: kapalı
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), auditController.updateAuditLog);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), auditController.deleteAuditLog);

module.exports = router;
