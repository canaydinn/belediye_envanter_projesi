// controllers/qrcode.controller.js
const QRCode = require('qrcode');
const JSZip = require('jszip');
const knex = require('../config/knex');

const TABLE = 'inventory_items';

exports.generateInventoryQrCode = async (req, res) => {
  try {
    const { id } = req.params;

    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Belediye kapsamı bulunamadı'
      });
    }

    const itemId = Number(id);
    if (!Number.isInteger(itemId)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz envanter ID'
      });
    }

    const item = await knex(TABLE)
      .where({ id: itemId, municipality_id: municipalityId })
      .first();

    if (!item) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Envanter bulunamadı.'
      });
    }

    const text = item.asset_tag || item.id.toString();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${item.id}_qr.png"`
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

    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Belediye kapsamı bulunamadı'
      });
    }

    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'En az bir envanter ID gönderilmelidir.'
      });
    }

    // Envanter ID'lerini sayıya çevir ve geçerliliğini kontrol et
    const validIds = inventoryIds
      .map(id => Number(id))
      .filter(id => Number.isInteger(id) && id > 0);

    if (validIds.length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Geçerli envanter ID\'leri gönderilmelidir.'
      });
    }

    // Belediye kapsamındaki envanterleri getir
    const items = await knex(TABLE)
      .whereIn('id', validIds)
      .where('municipality_id', municipalityId)
      .select('id', 'asset_tag', 'name');

    if (items.length === 0) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Belirtilen envanter kayıtları bulunamadı veya bu belediyeye ait değil.'
      });
    }

    // ZIP dosyası oluştur
    const zip = new JSZip();

    // Her envanter için QR kod üret ve ZIP'e ekle
    const qrPromises = items.map(async (item) => {
      const qrText = item.asset_tag || item.id.toString();
      const fileName = `${item.id}_${qrText.replace(/[^a-zA-Z0-9]/g, '_')}_qr.png`;
      
      try {
        // QR kod PNG olarak buffer'a üret
        const qrBuffer = await QRCode.toBuffer(qrText, {
          type: 'png',
          width: 300,
          margin: 1
        });
        
        // ZIP'e ekle
        zip.file(fileName, qrBuffer);
      } catch (qrErr) {
        console.error(`QR kod üretim hatası (ID: ${item.id}):`, qrErr);
        // Hata olsa bile diğer QR kodları üretmeye devam et
      }
    });

    await Promise.all(qrPromises);

    // ZIP dosyasını buffer'a çevir
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Response header'larını ayarla
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qrcodes_batch_${timestamp}.zip"`
    );
    res.setHeader('Content-Length', zipBuffer.length);

    // ZIP dosyasını gönder
    res.send(zipBuffer);
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

    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Belediye kapsamı bulunamadı'
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'code alanı zorunludur.'
      });
    }

    const item = await knex(TABLE)
      .where({ municipality_id: municipalityId })
      .where((builder) => {
        builder
          .where('asset_tag', code)
          .orWhere('serial_number', code);
      })
      .first();

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
