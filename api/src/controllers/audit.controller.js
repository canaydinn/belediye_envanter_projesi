// api/controllers/audit.controller.js
const knex = require('../db/knex');

// Tablo adını kendi migration’ındaki isimle eşleştir:
// Örn: 'audits', 'audit_logs' vs.
const TABLE_NAME = 'audit_logs';

// Ortak yardımcı
const sendServerError = (res, err, place) => {
  console.error(`Audit controller error [${place}]:`, err);
  res.status(500).json({ message: 'Sunucu hatası', detail: place });
};

// Tüm audit kayıtları
const getAuditLogs = async (req, res) => {
  try {
    const logs = await knex(TABLE_NAME)
      .select('*')
      .orderBy('created_at', 'desc');
    res.json(logs);
  } catch (err) {
    sendServerError(res, err, 'getAuditLogs');
  }
};

// ID ile tek kayıt
const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await knex(TABLE_NAME)
      .where({ id })
      .first();

    if (!log) {
      return res.status(404).json({ message: 'Kayıt bulunamadı' });
    }

    res.json(log);
  } catch (err) {
    sendServerError(res, err, 'getAuditLogById');
  }
};

// Yeni audit kaydı oluştur
const createAuditLog = async (req, res) => {
  try {
    const data = req.body;

    // İstersen burada zorunlu alan kontrolü yap:
    // const { action, entity_type, entity_id, user_id } = data;

    const [created] = await knex(TABLE_NAME)
      .insert(data)
      .returning('*'); // SQLite kullanıyorsan returning çalışmıyorsa, .returning'i kaldır

    res.status(201).json(created || { success: true });
  } catch (err) {
    sendServerError(res, err, 'createAuditLog');
  }
};

// Audit kaydı güncelle
const updateAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updatedRows = await knex(TABLE_NAME)
      .where({ id })
      .update(data)
      .returning('*');

    const updated = Array.isArray(updatedRows) ? updatedRows[0] : null;

    if (!updated && !updatedRows) {
      return res.status(404).json({ message: 'Kayıt bulunamadı' });
    }

    res.json(updated || { success: true });
  } catch (err) {
    sendServerError(res, err, 'updateAuditLog');
  }
};

// Audit kaydı sil
const deleteAuditLog = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCount = await knex(TABLE_NAME)
      .where({ id })
      .del();

    if (!deletedCount) {
      return res.status(404).json({ message: 'Kayıt bulunamadı' });
    }

    res.json({ success: true });
  } catch (err) {
    sendServerError(res, err, 'deleteAuditLog');
  }
};

/**
 * Farklı isimlendirmelerle route dosyasına uyum sağlamak için
 * aynı fonksiyonlara birden fazla alias veriyorum.
 * Böylece audit.routes.js içinde hangi isim kullanıldıysa büyük ihtimalle karşılığı olur.
 */
module.exports = {
  // Log listeleri
  getAuditLogs,
  getAudits: getAuditLogs,

  // Tekil kayıt
  getAuditLogById,
  getAuditById: getAuditLogById,

  // Oluşturma
  createAuditLog,
  createAudit: createAuditLog,

  // Güncelleme
  updateAuditLog,
  updateAudit: updateAuditLog,

  // Silme
  deleteAuditLog,
  deleteAudit: deleteAuditLog,
};
