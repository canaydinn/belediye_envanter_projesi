// api/src/controllers/superadmin.controller.js
const knex = require('../config/knex');

exports.listMunicipalities = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
        'id',
        'code',
        'name',
        'province',
        'district',
        'contact_email',
        'contact_phone',
        'contact_person',
        'status',
        'is_active',
        'license_start_date',
        'license_end_date',
        'quota_end_date',
        'created_at'
      )
      .orderBy('created_at', 'desc');

    return res.json(municipalities);
  } catch (err) {
    console.error('superadmin.listMunicipalities hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.listActiveMunicipalities = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
        'id',
        'name',
        'email',
        'phone',
        'status',
        'license_end_date',
        'is_active',
        'created_at'
      )
      .where({ is_active: true })
      .orderBy('created_at', 'desc');

    return res.json(municipalities);
  } catch (err) {
    console.error('superadmin.listActiveMunicipalities hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.listPendingMunicipalities = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
        'id',
        'name',
        'email',
        'phone',
        'status',
        'license_end_date',
        'is_active',
        'created_at'
      )
      .where({ status: 'pending' })
      .orderBy('created_at', 'desc');

    return res.json(municipalities);
  } catch (err) {
    console.error('superadmin.listPendingMunicipalities hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.updateMunicipalityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, license_start_date, license_end_date, quota_end_date } = req.body; // 'pending' | 'active' | 'suspended'
if (status && !['pending', 'active', 'suspended'].includes(status)) {
   return res.status(400).json({ message: 'Geçersiz status değeri' });}
const updatePayload = {
      updated_at: knex.fn.now(),
    };

    if (status) {
      updatePayload.status = status;
      updatePayload.is_active = status === 'active';
    }

    if (license_start_date !== undefined) updatePayload.license_start_date = license_start_date;
    if (license_end_date !== undefined) updatePayload.license_end_date = license_end_date;
    if (quota_end_date !== undefined) updatePayload.quota_end_date = quota_end_date;
    const [updated] = await knex('municipalities')
      .where({ id });

    if (!updated) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('superadmin.updateMunicipalityStatus hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.createMunicipality = async (req, res) => {
  try {
    const { name, email, phone, license_end_date, status = 'pending' } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        message: 'name, email ve phone alanları zorunludur',
      });
    }

    const [inserted] = await knex('municipalities')
      .insert({
        name,
        email,
        phone,
        status,
        license_end_date: license_end_date || null,
        is_active: false,
      })
      .returning([
        'id',
        'name',
        'email',
        'phone',
        'status',
        'license_end_date',
        'is_active',
        'created_at',
        'updated_at',
      ]);

    return res.status(201).json(inserted);
  } catch (err) {
    console.error('superadmin.createMunicipality hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getMunicipalityById = async (req, res) => {
  try {
    const { id } = req.params;

    const municipality = await knex('municipalities')
      .select(
        'id',
        'name',
        'status',
        'license_end_date',
        'is_active',
        'created_at',
        'updated_at'
      )
      .where({ id })
      .first();

    if (!municipality) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    return res.json(municipality);
  } catch (err) {
    console.error('superadmin.getMunicipalityById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.listUsersByMunicipality = async (req, res) => {
  try {
    const { municipality_id } = req.query;

    const municipalityId = Number(municipality_id);

    if (!municipality_id || Number.isNaN(municipalityId)) {
      return res.status(400).json({ message: 'municipality_id parametresi zorunludur' });
    }

    const municipality = await knex('municipalities').select('id').where({ id: municipalityId }).first();

    if (!municipality) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    const users = await knex('users')
      .select(
        'id',
        'username',
        'email',
        'full_name',
        'role_id',
        'is_active',
        'municipality_id',
        'created_at',
        'updated_at'
      )
      .where({ municipality_id: municipalityId })
      .orderBy('created_at', 'desc');

    return res.json(users);
  } catch (err) {
    console.error('superadmin.listUsersByMunicipality hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.listStandardPlanMunicipalities = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
        'id',
        'name',
        'email',
        'phone',
        'status',
        'license_end_date',
        'is_active',
        'plan_type',
        'created_at'
      )
      .where({ plan_type: 'standard' })
      .orderBy('created_at', 'desc');

    return res.json(municipalities);
  } catch (err) {
    console.error('superadmin.listStandardPlanMunicipalities hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.listProPlanMunicipalities = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
        'id',
        'name',
        'email',
        'phone',
        'status',
        'license_end_date',
        'is_active',
        'plan_type',
        'created_at'
      )
      .where({ plan_type: 'pro' })
      .orderBy('created_at', 'desc');

    return res.json(municipalities);
  } catch (err) {
    console.error('superadmin.listProPlanMunicipalities hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.listTrialPlanMunicipalities = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
        'id',
        'name',
        'email',
        'phone',
        'status',
        'license_end_date',
        'is_active',
        'plan_type',
        'created_at'
      )
      .where({ plan_type: 'deneme' })
      .orderBy('created_at', 'desc');

    return res.json(municipalities);
  } catch (err) {
    console.error('superadmin.listTrialPlanMunicipalities hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.listRecentLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const parsedLimit = Number(limit);
    const effectiveLimit = Number.isNaN(parsedLimit) || parsedLimit <= 0
      ? 20
      : Math.min(parsedLimit, 100);

    const logs = await knex('logs')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(effectiveLimit);

    return res.json(logs);
  } catch (err) {
    console.error('superadmin.listRecentLogs hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getMunicipalityCount = async (_req, res) => {
  try {
    const [result] = await knex('municipalities').count('id as count');
    const totalMunicipalities = Number(result.count) || 0;

    return res.json({ totalMunicipalities });
  } catch (err) {
    console.error('superadmin.getMunicipalityCount hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası', error: err.message,          // GEÇİCİ OLARAK EKLE
      stack: err.stack    });
  }
};
exports.getActiveCount = async (_req, res) => {
  try {
    const [result] = await knex('municipalities')
      .where({ is_active: true })
      .count('id as count');

    const totalActive = parseInt(result.count, 10) || 0;
    return res.json({ total_active_municipalities: totalActive });
  } catch (err) {
    console.error('municipalities.getActiveCount hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getPendingMunicipalitiesCount = async (_req, res) => {
  try {
    const [{ count }] = await knex('municipalities')
      .where({ status: 'pending' })
      .count('id as count');

    return res.json({ count: Number(count) });
  } catch (err) {
    console.error('superadmin.getPendingMunicipalitiesCount hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};