// api/routes/audit.routes.js
const express = require('express');
const router = express.Router();

// Controller’ı obje olarak alıyoruz
const auditController = require('../controllers/audit.controller');

// Listeleme
router.get('/', auditController.getAuditLogs);         // DİKKAT: Parantez yok

// Tek kayıt
router.get('/:id', auditController.getAuditLogById);

// Oluşturma
router.post('/', auditController.createAuditLog);

// Güncelleme
router.put('/:id', auditController.updateAuditLog);

// Silme
router.delete('/:id', auditController.deleteAuditLog);

module.exports = router;
