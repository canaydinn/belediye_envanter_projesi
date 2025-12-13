// api/src/controllers/audit.controller.js
const knex = require('../config/knex');

const TABLE_NAME = 'audit_logs';

// Yalnızca izin verilen alanlar (whitelist)
const ALLOWED_FIELDS = [
  'action',        // örn: "ASSET_CREATE"
  'entity_type',   // örn: "asset"
  'entity_id',     // örn: 123
  'meta',          // jsonb ise detaylar
];

const sendServerError = (res, err, place) => {
  console.error(`Audit controller error [${place}]:`, err);
  return res.status(500).json({ message: 'Sunucu hatası', detail: place });
};

// GET /api/audit
exports.getAuditLogs = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const logs = await knex(TABLE_NAME)
      .where({ municipality_id: municipalityId })
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(500); // ✅ sınırlama şart (performans + güvenlik)

    return res.json(logs);
  } catch (err) {
    return sendServerError(res, err, 'getAuditLogs');
  }
};

// GET /api/audit/:id
exports.getAuditLogById = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz ID' });
    }

    const log = await knex(TABLE_NAME)
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!log) {
      return res.status(404).json({ message: 'Kayıt bulunamadı' });
    }

    return res.json(log);
  } catch (err) {
    return sendServerError(res, err, 'getAuditLogById');
  }
};

// POST /api/audit
// Not: Audit log normalde sistem tarafından üretilir. UI’dan serbest insert genelde kapatılır.
exports.createAuditLog = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const userId = req.user?.id;

    if (!municipalityId || !userId) {
      return res.status(401).json({ message: 'Oturum doğrulanamadı' });
    }

    // ✅ req.body -> whitelist
    const payload = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body?.[key] !== undefined) payload[key] = req.body[key];
    }

    // Basit zorunlu alan kontrolü
    if (!payload.action || !payload.entity_type) {
      return res.status(400).json({ message: 'action ve entity_type zorunludur' });
    }

    // ✅ spoof engelle: municipality_id / user_id backend’den set edilir
    payload.municipality_id = municipalityId;
    payload.user_id = userId;

    // Ek güvenlik/izleme alanları (tablon varsa)
    payload.ip = req.ip;
    payload.user_agent = req.get('user-agent') || null;

    const [created] = await knex(TABLE_NAME)
      .insert(payload)
      .returning('*');

    return res.status(201).json(created);
  } catch (err) {
    return sendServerError(res, err, 'createAuditLog');
  }
};

// PUT ve DELETE: Audit için önerilmez (append-only)
// Eğer illa olacaksa yalnızca SUPERADMIN'e aç ve municipality scope kontrolünü asla kaldırma.
exports.updateAuditLog = async (req, res) => {
  return res.status(405).json({ message: 'Audit kayıtları güncellenemez (append-only)' });
};

exports.deleteAuditLog = async (req, res) => {
  return res.status(405).json({ message: 'Audit kayıtları silinemez (append-only)' });
};
