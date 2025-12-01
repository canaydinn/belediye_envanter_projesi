const express = require('express');
const router = express.Router();

const qrcodeController = require('../controllers/qrcode.controller');
const { requireAuth } = require('../../src/middleware/auth.middleware');
const { requireRole } = require('../../src/middleware/role.middleware');

// Envanter QR kodu (image olarak)
router.get('/inventory/:id', requireAuth, qrcodeController.generateInventoryQrCode);

// Toplu QR kod üretimi (zip link dönebilir)
router.post('/batch', requireAuth, requireRole(['admin', 'department_manager']), qrcodeController.generateBatchQrCodes);

// Mobil/terminal taraması sonrası envanter bulma
// POST /api/qrcode/scan
router.post('/scan', qrcodeController.scanCodeAndResolveInventory);

module.exports = router;
