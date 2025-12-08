// api/src/controllers/departments.controller.js
const knex = require('../config/knex');

// Tüm müdürlükleri listele
exports.getAll = async (req, res) => {
  try {
    const user = req.user || {};
    const municipalityId = user.municipality_id;
    const roleId = user.role_id;
    const includeInactive = req.query.includeInactive === 'true';
    const queryMunicipalityId = req.query.municipality_id; // ?municipality_id=1

    console.log('Departments.getAll → req.user:', user);
    console.log('Departments.getAll → query.municipality_id:', queryMunicipalityId);
    console.log('Departments.getAll → includeInactive:', includeInactive);

    let query = knex('departments')
      .select(
        'id',
        'code',
        'name',
        'manager_user_id',
        'is_active',
        'municipality_id'
      )
      .orderBy('name', 'asc');

    // 1) Superadmin ise (role_id === 1) → tüm belediyeleri görebilsin, isterse query'den filtrelesin
    if (roleId === 1) {
      console.log('Departments.getAll → SUPERADMIN isteği');
      if (queryMunicipalityId) {
        console.log('Departments.getAll → municipality_id query filtresi uygulanıyor:', queryMunicipalityId);
        query.where('municipality_id', queryMunicipalityId);
      }
    }
    // 2) Normal belediye kullanıcısı ise sadece kendi belediyesi
    else if (municipalityId) {
      console.log('Departments.getAll → Normal kullanıcı, municipality_id filtresi:', municipalityId);
      query.where('municipality_id', municipalityId);
    }
    // 3) Güvenlik açısından: municipality yok ama superadmin de değil
    else {
      console.warn(
        'Departments.getAll → municipality_id yok ve superadmin değil. GELİŞTİRME MODU: tüm kayıtları dönüyorum.'
      );
      // Geliştirme ortamında boş dönmek yerine, tüm kayıtları gönderelim ki sen tabloyu görebil.
      // İleride burayı tekrar sıkılaştırırsın.
    }

    // Aktif / pasif filtre
    if (!includeInactive) {
      console.log('Departments.getAll → Sadece aktif kayıtlar');
      query.andWhere({ is_active: true });
    } else {
      console.log('Departments.getAll → Aktif + pasif tüm kayıtlar');
    }

    const departments = await query;

    console.log('Departments.getAll → dönen kayıt sayısı:', departments.length);

    return res.json(departments);
  } catch (err) {
    console.error('Departments getAll hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
// Tek bir müdürlüğü getir
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { municipality_id } = req.user;

    const department = await knex('departments')
      
      .select('id', 'code', 'name', 'manager_user_id', 'is_active', 'municipality_id')
      .where({ id, municipality_id })
      .first();

    if (!department) {
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    res.json(department);
  } catch (err) {
    console.error('Departments getById hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Yeni müdürlük ekle
exports.create = async (req, res) => {
  try {
    const { code, name, manager_user_id, is_active } = req.body;
    const { municipality_id } = req.user;

    if (!code || !name) {
      return res.status(400).json({ message: 'Kod ve ad alanları zorunludur' });
    }

    const [inserted] = await knex('departments')
      
      .insert({
        code,
        name,
        manager_user_id: manager_user_id || null,
        is_active: typeof is_active === 'boolean' ? is_active : true,
        municipality_id,
      })
      .returning(['id', 'code', 'name', 'manager_user_id', 'is_active', 'municipality_id']);

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Departments create hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Müdürlük güncelle
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { municipality_id } = req.user;
    const { code, name, manager_user_id, is_active } = req.body;

    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (manager_user_id !== undefined) updateData.manager_user_id = manager_user_id || null;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek bir alan bulunamadı' });
    }

    const [updated] = await knex('departments')
     
      .where({ id, municipality_id })
      .update(updateData, ['id', 'code', 'name', 'manager_user_id', 'is_active', 'municipality_id']);

    if (!updated) {
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Departments update hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Müdürlük sil
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { municipality_id } = req.user;

    const affected = await knex('departments').where({ id, municipality_id }).del();

    if (!affected) {
      return res.status(404).json({ message: 'Birim bulunamadı' });
    }

    res.json({ message: 'Birim silindi' });
  } catch (err) {
    console.error('Departments delete hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};