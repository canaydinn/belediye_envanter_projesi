// controllers/uploads.controller.js
const FileUpload = require('../models/FileUpload');
const fs = require('fs');
const path = require('path');

exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const { type, entity, entityId } = req.body;

    if (!file) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Herhangi bir dosya yüklenmedi.'
      });
    }

    // Production'da (Vercel) memory storage kullanılıyor, file.buffer var
    // Development'ta disk storage kullanılıyor, file.path var
    const isMemoryStorage = process.env.NODE_ENV === 'production' || file.buffer;
    
    const doc = await FileUpload.create({
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: isMemoryStorage ? null : file.path, // Memory storage'da path yok
      buffer: isMemoryStorage ? file.buffer : null, // Sadece memory storage'da
      type: type || null,
      linkedTo: entity && entityId ? { entity, id: entityId } : null,
      uploadedBy: req.user.id
    });

    return res.json({
      id: doc._id,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      size: doc.size,
      url: `/api/uploads/${doc._id}`,
      type: doc.type,
      linkedTo: doc.linkedTo
    });
  } catch (err) {
    console.error('UPLOAD_FILE_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Dosya yüklenirken bir hata oluştu.'
    });
  }
};

exports.getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    const doc = await FileUpload.findById(fileId);

    if (!doc) {
      return res.status(404).json({
        error: 'FILE_NOT_FOUND',
        message: 'Dosya bulunamadı.'
      });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${doc.fileName}"`
    );

    // Production'da (memory storage) buffer'dan oku
    // Development'ta (disk storage) dosyadan oku
    if (doc.buffer) {
      // Memory storage - buffer'dan gönder
      res.send(doc.buffer);
    } else if (doc.path) {
      // Disk storage - dosyadan oku
      const filePath = path.resolve(doc.path);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'FILE_NOT_FOUND',
          message: 'Dosya bulunamadı.'
        });
      }
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } else {
      return res.status(404).json({
        error: 'FILE_NOT_FOUND',
        message: 'Dosya verisi bulunamadı.'
      });
    }
  } catch (err) {
    console.error('GET_FILE_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Dosya getirilirken bir hata oluştu.'
    });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const doc = await FileUpload.findById(fileId);
    if (!doc) {
      return res.status(404).json({
        error: 'FILE_NOT_FOUND',
        message: 'Dosya bulunamadı.'
      });
    }

    // Sadece disk storage kullanılıyorsa dosyayı sil
    // Memory storage'da dosya zaten veritabanında
    if (doc.path && !doc.buffer) {
      const filePath = path.resolve(doc.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await FileUpload.deleteOne({ _id: fileId });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_FILE_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Dosya silinirken bir hata oluştu.'
    });
  }
};
