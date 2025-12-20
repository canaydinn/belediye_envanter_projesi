const express = require('express');
const router = express.Router();

const qrcodeController = require('../controllers/qrcode.controller');

// Envanter QR kodu (image olarak)
router.get('/inventory/:id', qrcodeController.generateInventoryQrCode);

// Toplu QR kod üretimi (zip link dönebilir)
router.post('/batch',  qrcodeController.generateBatchQrCodes);

// Mobil/terminal taraması sonrası envanter bulma
// POST /api/qrcode/scan
router.post('/scan', qrcodeController.scanCodeAndResolveInventory);

module.exports = router;
