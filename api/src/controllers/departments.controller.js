// api/src/controllers/departments.controller.js
const knex = require('../config/knex');

exports.getAll = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const includeInactive = req.query.includeInactive === 'true';

    const query = knex('departments')
      .select('id', 'code', 'name', 'manager_user_id', 'is_active', 'municipality_id')
      .where({ municipality_id: municipalityId })
      .orderBy('name', 'asc');

    if (!includeInactive) {
      query.andWhere({ is_active: true });
    }

    const departments = await query;
    return res.json(departments);
  } catch (err) {
    console.error('Departments getAll hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getById = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz birim ID' });
    }

    const department = await knex('departments')
      .select('id', 'code', 'name', 'manager_user_id', 'is_active', 'municipality_id')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!department) return res.status(404).json({ message: 'Birim bulunamadı' });
    return res.json(department);
  } catch (err) {
    console.error('Departments getById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.create = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    let { code, name, manager_user_id, is_active } = req.body;

    code = (code || '').trim();
    name = (name || '').trim();

    if (!code || !name) {
      return res.status(400).json({ message: 'Kod ve ad alanları zorunludur' });
    }

    if (manager_user_id) {
      const manager = await knex('users')
        .where({ id: manager_user_id, municipality_id: municipalityId, is_active: true })
        .first();
      if (!manager) {
        return res.status(400).json({ message: 'Yönetici kullanıcı bu belediyeye ait değil' });
      }
    }

    const existing = await knex('departments')
      .where({ municipality_id: municipalityId, code })
      .first();

    if (existing) {
      return res.status(409).json({ message: 'Bu kod bu belediyede zaten kullanılıyor' });
    }

    const [inserted] = await knex('departments')
      .insert({
        code,
        name,
        manager_user_id: manager_user_id || null,
        is_active: typeof is_active === 'boolean' ? is_active : true,
        municipality_id: municipalityId,
      })
      .returning(['id', 'code', 'name', 'manager_user_id', 'is_active', 'municipality_id']);

    return res.status(201).json(inserted);
  } catch (err) {
    console.error('Departments create hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};


// PUT /api/departments/:id
exports.update = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz birim ID' });
    }

    const { code, name, manager_user_id, is_active } = req.body || {};

    // Güncellenecek alanları topla
    const updateData = {};

    if (code !== undefined) updateData.code = String(code).trim();
    if (name !== undefined) updateData.name = String(name).trim();
    if (manager_user_id !== undefined) updateData.manager_user_id = manager_user_id || null;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;

    // Boş update engeli
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek bir alan bulunamadı' });
    }

    // Eğer code/name gönderildi ama boşsa engelle
    if (updateData.code !== undefined && !updateData.code) {
      return res.status(400).json({ message: 'Kod boş olamaz' });
    }
    if (updateData.name !== undefined && !updateData.name) {
      return res.status(400).json({ message: 'Ad boş olamaz' });
    }

    // Kayıt gerçekten bu belediyeye mi ait?
    const existing = await knex('departments')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    // code değişiyorsa çakışma kontrolü (aynı belediye içinde)
    if (updateData.code && updateData.code !== existing.code) {
      const conflict = await knex('departments')
        .where({ municipality_id: municipalityId, code: updateData.code })
        .andWhereNot({ id })
        .first();

      if (conflict) {
        return res.status(409).json({ message: 'Bu kod bu belediyede zaten kullanılıyor' });
      }
    }

    // manager_user_id gönderildiyse, o kullanıcı bu belediyeye ait mi?
    if (updateData.manager_user_id) {
      const manager = await knex('users')
        .where({
          id: updateData.manager_user_id,
          municipality_id: municipalityId,
          is_active: true,
        })
        .first();

      if (!manager) {
        return res.status(400).json({ message: 'Yönetici kullanıcı bu belediyeye ait değil' });
      }
    }

    const [updated] = await knex('departments')
      .where({ id, municipality_id: municipalityId })
      .update(updateData)
      .returning(['id', 'code', 'name', 'manager_user_id', 'is_active', 'municipality_id']);

    if (!updated) {
      // teorik olarak existing varken buraya düşmez ama güvenlik için:
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('Departments update hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};


exports.remove = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz birim ID' });
    }

    const affected = await knex('departments')
      .where({ id, municipality_id: municipalityId })
      .del();

    if (!affected) return res.status(404).json({ message: 'Birim bulunamadı' });
    return res.json({ message: 'Birim silindi' });
  } catch (err) {
    console.error('Departments delete hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
