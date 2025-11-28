// controllers/qrcode.controller.js
const QRCode = require('qrcode');
const Inventory = require('../models/Inventory');

exports.generateInventoryQrCode = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Envanter bulunamadı.'
      });
    }

    const text = item.assetTag || item._id.toString();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${item._id}_qr.png"`
    );

    // QR kodu doğrudan response stream'e yaz
    QRCode.toFileStream(res, text);
  } catch (err) {
    console.error('QR_CODE_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'QR kod üretilirken bir hata oluştu.'
    });
  }
};

exports.generateBatchQrCodes = async (req, res) => {
  try {
    const { inventoryIds } = req.body;

    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'En az bir envanter ID gönderilmelidir.'
      });
    }

    // Gerçek hayatta burada zip dosyası üretip storage’a atarsın.
    // Şimdilik demo amaçlı sahte bir URL döndürüyoruz.
    return res.json({
      downloadUrl: 'https://example.com/qrcodes/batch/abc123.zip',
      count: inventoryIds.length
    });
  } catch (err) {
    console.error('BATCH_QR_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Toplu QR kod üretimi sırasında bir hata oluştu.'
    });
  }
};

exports.scanCodeAndResolveInventory = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'code alanı zorunludur.'
      });
    }

    const item = await Inventory.findOne({
      $or: [{ assetTag: code }, { serialNumber: code }]
    });

    if (!item) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Bu QR kod ile eşleşen envanter bulunamadı.'
      });
    }

    return res.json({
      inventory: item
    });
  } catch (err) {
    console.error('QR_SCAN_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Kod çözülürken bir hata oluştu.'
    });
  }
};
