// api/src/controllers/superadmin.controller.js
const knex = require('../config/knex');

exports.listMunicipalities = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
        '*'
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
      .where({ id })
      .update(updatePayload)
      .returning('*');

    if (!updated || updated.length === 0) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    return res.json(updated[0]);
  } catch (err) {
    console.error('superadmin.updateMunicipalityStatus hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
const MUNICIPALITY_CODE_PREFIX = 'BLD-';

const generateMunicipalityCode = async () => {
  const lastMunicipality = await knex('municipalities')
    .where('code', 'like', `${MUNICIPALITY_CODE_PREFIX}%`)
    .orderBy('id', 'desc')
    .first();

  const lastNumber = lastMunicipality?.code?.split('-')[1];
  const nextNumber = lastNumber && /^\d+$/.test(lastNumber)
    ? parseInt(lastNumber, 10) + 1
    : 1;

  return `${MUNICIPALITY_CODE_PREFIX}${String(nextNumber).padStart(3, '0')}`;
};
// Yeni belediye oluştur
exports.createMunicipality = async (req, res) => {
  try {
    const {
      name,
      province,
      district,
      tax_number,
      address,
      contact_email,
      contact_phone,
      contact_person,
      license_start_date,
      license_end_date,
      quota_end_date,
      plan_type,
      logo_url,
      domain_url,
      api_key,
      max_users,
      max_assets,
      notes,
      activation_token,
    } = req.body;

    // Basit validasyon
    if (!name || !province || !district) {
      return res.status(400).json({
        message: 'name, province ve district alanları zorunludur',
      });
    }

    
    const code = await generateMunicipalityCode();

    const [inserted] = await knex('municipalities')
      .insert({
        code,
        name,
        province,
        district,
        tax_number: tax_number || null,
        address: address || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        contact_person: contact_person || null,
        is_active: true,
        status: 'active',
        license_start_date: license_start_date ? new Date(license_start_date) : null,
        license_end_date: license_end_date ? new Date(license_end_date) : null,
        quota_end_date: quota_end_date ? new Date(quota_end_date) : null,
        plan_type: plan_type || 'standard',
        logo_url: logo_url || null,
        domain_url: domain_url || null,
        api_key: api_key || null,
        max_users: max_users ?? null,
        max_assets: max_assets ?? null,
        notes: notes || null,
        activation_token: activation_token || null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning([
        'id',
        'code',
        'name',
        'province',
        'district',
        'tax_number',
        'address',
        'contact_email',
        'contact_phone',
        'contact_person',
        'is_active',
        'status',
        'license_start_date',
        'license_end_date',
        'quota_end_date',
        'plan_type',
        'logo_url',
        'domain_url',
        'api_key',
        'max_users',
        'max_assets',
        'notes',
        'activation_token',
        'created_at',
        'updated_at',
      ]);

    return res.status(201).json(inserted);
  } catch (err) {
    console.error('municipalities.create hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getMunicipalityById = async (req, res) => {
  try {
    const { id } = req.params;

    const municipality = await knex('municipalities')
      .select(
        '*'
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
exports.getStandardPlanMunicipalityCount = async (_req, res) => {
  try {
    const [{ count }] = await knex('municipalities')
      .where({ plan_type: 'standard' })
      .count('id as count');

    return res.json({ count: Number(count) || 0 });
  } catch (err) {
    console.error('superadmin.getStandardPlanMunicipalityCount hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getProPlanMunicipalityCount = async (_req, res) => {
  try {
    const [{ count }] = await knex('municipalities')
      .where({ plan_type: 'pro' })
      .count('id as count');

    return res.json({ count: Number(count) || 0 });
  } catch (err) {
    console.error('superadmin.getProPlanMunicipalityCount hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getDenemePlanMunicipalityCount = async (_req, res) => {
  try {
    const [{ count }] = await knex('municipalities')
      .where({ plan_type: 'deneme' })
      .count('id as count');

    return res.json({ count: Number(count) || 0 });
  } catch (err) {
    console.error('superadmin.getDenemePlanMunicipalityCount hatası:', err);
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

    return res.json({ total_pending_municipalities: Number(count) });
  } catch (err) {
    console.error('superadmin.getPendingMunicipalitiesCount hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getTotalCount = async (_req, res) => {
  try {
    const [{ count }] = await knex('users').count('id as count');

    const totalUsers = Number(count) || 0;
    return res.json({ totalUsers });
  } catch (err) {
    console.error('getTotalCount user hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
// Belediye bilgilerini güncelle
exports.updateMunicipality = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      province,
      district,
      tax_number,
      address,
      contact_email,
      contact_phone,
      contact_person,
      status,
      is_active,
      license_start_date,
      license_end_date,
      quota_end_date,
      plan_type,
      logo_url,
      domain_url,
      api_key,
      max_users,
      max_assets,
      notes,
    } = req.body;

    if (!name || !province || !district) {
      return res.status(400).json({ message: 'name, province ve district zorunludur' });
    }

    if (status && !['pending', 'active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz status değeri' });
    }

    const updateData = {
      name,
      province,
      district,
      tax_number: tax_number || null,
      address: address || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      contact_person: contact_person || null,
      license_start_date: license_start_date || null,
      license_end_date: license_end_date || null,
      quota_end_date: quota_end_date || null,
      plan_type: plan_type || 'standard',
      logo_url: logo_url || null,
      domain_url: domain_url || null,
      api_key: api_key || null,
      max_users: max_users ?? null,
      max_assets: max_assets ?? null,
      notes: notes || null,
      updated_at: knex.fn.now(),
    };

    if (status) {
      updateData.status = status;
      updateData.is_active = status === 'active';
    } else if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const [updated] = await knex('municipalities')
      .where({ id })
      .update(updateData, [
        'id',
        'code',
        'name',
        'province',
        'district',
        'tax_number',
        'address',
        'contact_email',
        'contact_phone',
        'contact_person',
        'status',
        'is_active',
        'license_start_date',
        'license_end_date',
        'quota_end_date',
        'plan_type',
        'logo_url',
        'domain_url',
        'api_key',
        'max_users',
        'max_assets',
        'notes',
        'updated_at',
      ]);

    if (!updated) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('superadmin.updateMunicipality hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
  
};
exports.deactivateMunicipality = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await knex('municipalities')
      .where({ id })
      .update(
        {
          is_active: false,
          status: 'suspended',
          updated_at: knex.fn.now(),
        },
        ['id', 'name', 'status', 'is_active', 'updated_at']
      );

    if (!updated) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('superadmin.deactivateMunicipality hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};