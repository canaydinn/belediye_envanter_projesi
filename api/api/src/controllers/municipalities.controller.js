// api/src/controllers/municipalities.controller.js
const knex = require('../config/knex');

// Tüm belediyeleri listele (sistem yöneticisi için)
exports.getAll = async (req, res) => {
  try {
    const municipalities = await knex('municipalities')
      .select(
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
        'created_at',
        'updated_at'
      )
      .orderBy('name', 'asc');

    return res.json(municipalities);
  } catch (err) {
    console.error('municipalities.getAll hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Tek belediyeyi getir
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const municipality = await knex('municipalities')
      .select(
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
    console.error('municipalities.getById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Yeni belediye oluştur
exports.create = async (req, res) => {
  try {
    const {
      code,
      name,
      province,
      district,
      tax_number,
      address,
      contact_email,
      contact_phone,
      contact_person,
    } = req.body;

    // Basit validasyon
    if (!code || !name || !province || !district) {
      return res.status(400).json({
        message: 'code, name, province ve district alanları zorunludur',
      });
    }

    // Aynı kodda belediye var mı?
    const exists = await knex('municipalities')
      .where({ code })
      .first();

    if (exists) {
      return res.status(400).json({ message: 'Bu municipality code zaten kullanılıyor' });
    }

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
        is_active: false,
        status: 'pending',
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
        'created_at',
        'updated_at',
      ]);

    return res.status(201).json(inserted);
  } catch (err) {
    console.error('municipalities.create hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Belediye bilgilerini güncelle
exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz belediye ID' });
    }

    const existing = await knex('municipalities').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    // Allowed fields (SUPER ADMIN alanı)
    const allowed = [
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
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek alan bulunamadı' });
    }

    // Basit doğrulamalar
    if (updates.code !== undefined) {
      const code = String(updates.code || '').trim();
      if (!code) return res.status(400).json({ message: 'code boş olamaz' });

      // code unique mi?
      const conflict = await knex('municipalities')
        .where({ code })
        .andWhereNot({ id })
        .first();

      if (conflict) {
        return res.status(400).json({ message: 'Bu municipality code zaten kullanılıyor' });
      }

      updates.code = code;
    }

    if (updates.status !== undefined) {
      const status = String(updates.status || '').trim().toLowerCase();
      const allowedStatus = new Set(['active', 'pending', 'blocked', 'suspended']);
      if (!allowedStatus.has(status)) {
        return res.status(400).json({ message: 'Geçersiz status değeri' });
      }
      updates.status = status;
    }

    if (updates.is_active !== undefined) {
      updates.is_active = Boolean(updates.is_active);
    }

    updates.updated_at = knex.fn.now();

    const [updated] = await knex('municipalities')
      .where({ id })
      .update(updates)
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
        'created_at',
        'updated_at',
      ]);

    return res.json(updated);
  } catch (err) {
    console.error('municipalities.update hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};


// Belediye pasifleştirme (soft delete gibi düşünülebilir)
exports.deactivate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz belediye ID' });
    }

    const [updated] = await knex('municipalities')
      .where({ id })
      .update(
        {
          is_active: false,
          status: 'suspended',
          updated_at: knex.fn.now(),
        },
        ['id', 'code', 'name', 'is_active', 'status', 'updated_at']
      );

    if (!updated) {
      return res.status(404).json({ message: 'Belediye bulunamadı' });
    }

    return res.json({
      message: 'Belediye pasif hale getirildi',
      municipality: updated,
    });
  } catch (err) {
    console.error('municipalities.deactivate hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
