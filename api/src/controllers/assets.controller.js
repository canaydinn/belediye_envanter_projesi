const knex = require('../config/knex');

/**
 * GET /api/envanter
 * Aktif belediyeye ait tüm envanter kayıtlarını listeler.
 */
exports.listAssets = async (req, res) => {
  try {
    const { municipality_id } = req.user;

    const assets = await knex('envanter as e')
      .leftJoin('asset_categories as c', 'e.category_id', 'c.id')
      .leftJoin('departments as d', 'e.department_id', 'd.id')
      .leftJoin('locations as l', 'e.location_id', 'l.id')
      .leftJoin('users as u', 'e.assigned_user_id', 'u.id')
      .where('e.municipality_id', municipality_id)
      .select(
        'e.id',
        'e.asset_code',
        'e.name',
        'e.description',
        'e.category_id',
        'e.department_id',
        'e.location_id',
        'e.assigned_user_id',
        'e.purchase_price',
        'e.purchase_date',
        'e.serial_number',
        'e.status',
        'e.is_qr_tagged',
        'e.created_at',
        'e.updated_at',
        'e.quantity',
        'e.unit',
        'e.tasinir_code',
        'e.asset_type',
        'e.created_by_user_id',
        'e.updated_by_user_id',
        'e.municipality_id',
        'e.qrcode',
        'e.brand',
        'e.model',
        'e.purchase_id',
        'e.warranty_end_date',
        'e.amortisman_suresi',
        'e.hurda_degeri',
        'e.current_value',
        'e.is_movable',
        'c.name as category_name',
        'd.name as department_name',
        'l.name as location_name',
        knex.raw("CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name")
      )
      .orderBy('e.id', 'asc');

    return res.json(assets);
  } catch (err) {
    console.error('envanter.listAssets hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * GET /api/envanter/:id
 * Aktif belediyeye ait tek bir envanter kaydını getirir.
 */
exports.getAssetById = async (req, res) => {
  try {
    const { municipality_id } = req.user;
    const { id } = req.params;

    const asset = await knex('envanter as e')
      .leftJoin('asset_categories as c', 'e.category_id', 'c.id')
      .leftJoin('departments as d', 'e.department_id', 'd.id')
      .leftJoin('locations as l', 'e.location_id', 'l.id')
      .leftJoin('users as u', 'e.assigned_user_id', 'u.id')
      .where('e.id', id)
      .andWhere('e.municipality_id', municipality_id)
      .select(
        'e.id',
        'e.asset_code',
        'e.name',
        'e.description',
        'e.category_id',
        'e.department_id',
        'e.location_id',
        'e.assigned_user_id',
        'e.purchase_price',
        'e.purchase_date',
        'e.serial_number',
        'e.status',
        'e.is_qr_tagged',
        'e.created_at',
        'e.updated_at',
        'e.quantity',
        'e.unit',
        'e.tasinir_code',
        'e.asset_type',
        'e.created_by_user_id',
        'e.updated_by_user_id',
        'e.municipality_id',
        'e.qrcode',
        'e.brand',
        'e.model',
        'e.purchase_id',
        'e.warranty_end_date',
        'e.amortisman_suresi',
        'e.hurda_degeri',
        'e.current_value',
        'e.is_movable',
        'c.name as category_name',
        'd.name as department_name',
        'l.name as location_name',
        knex.raw("CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name")
      )
      .first();

    if (!asset) {
      return res.status(404).json({ message: 'Envanter bulunamadı' });
    }

    return res.json(asset);
  } catch (err) {
    console.error('envanter.getAssetById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * POST /api/envanter
 * Yeni envanter kaydı oluşturur.
 */

exports.createAsset = async (req, res) => {
  try {
    const { municipality_id, id: currentUserId } = req.user;

    const {
      // asset_code burada artık dışarıdan beklenmiyor
      name,
      description,
      category_id,
      department_id,
      location_id,
      assigned_user_id,
      purchase_price,
      purchase_date,
      serial_number,
      status,
      is_qr_tagged,
      quantity,
      unit,
      tasinir_code,
      asset_type,
      qrcode,
      brand,
      model,
      purchase_id,
      warranty_end_date,
      amortisman_suresi,
      hurda_degeri,
      current_value,
      is_movable,
    } = req.body;

    // asset_code zorunlu alandan çıkarıldı
    if (!name || !category_id || !department_id || !location_id) {
      return res.status(400).json({
        message: 'name, category_id, department_id ve location_id zorunludur',
      });
    }

    // Tüm işlemi tek transaction içinde yapalım
    const createdAsset = await knex.transaction(async (trx) => {
      // 1) Önce asset_code olmadan kaydı oluştur
      const [inserted] = await trx('assets')
        .insert({
          asset_code: null, // otomatik üretilecek
          name,
          description: description || null,
          category_id,
          department_id,
          location_id,
          assigned_user_id: assigned_user_id || null,
          purchase_price: purchase_price || null,
          purchase_date: purchase_date || null,
          serial_number: serial_number || null,
          status: status || 'active',
          is_qr_tagged: is_qr_tagged ?? false,
          quantity: quantity ?? 1,
          unit: unit || 'Adet',
          tasinir_code: tasinir_code || null,
          asset_type: asset_type || 'demirbas',
          created_by_user_id: currentUserId,
          updated_by_user_id: currentUserId,
          municipality_id,
          qrcode: qrcode || null,
          brand: brand || null,
          model: model || null,
          purchase_id: purchase_id || null,
          warranty_end_date: warranty_end_date || null,
          amortisman_suresi: amortisman_suresi || null,
          hurda_degeri: hurda_degeri || null,
          current_value: current_value || null,
          is_movable: is_movable ?? true,
        })
        .returning('*');

      // 2) Yıl bilgisini al (purchase_date varsa ondan, yoksa bugünden)
      const dateForYear = purchase_date ? new Date(purchase_date) : new Date();
      const year = String(dateForYear.getFullYear()).slice(-2); // 2025 -> "25"

      // 3) ID’yi 6 haneli pad’le
      const paddedId = String(inserted.id).padStart(6, '0');

      // 4) Kodu oluştur: AS-<municipalityId>-<YY>-<ID>
      const generatedAssetCode = `AS-${municipality_id}-${year}-${paddedId}`;

      // 5) Kaydı asset_code ile güncelle
      const [updated] = await trx('assets')
        .where({ id: inserted.id })
        .update({ asset_code: generatedAssetCode })
        .returning('*');

      return updated;
    });

    // Transaction sonucu
    return res.status(201).json(createdAsset);
  } catch (err) {
    console.error('assets.createAsset hatası:', err);
    // GELİŞTİRME MODU İÇİN AYDINLATILMIŞ HATA
    return res.status(500).json({
      message: err.message || 'Sunucu hatası',
      code: err.code,
      detail: err.detail,
    });
  }
};


/**
 * PUT /api/envanter/:id
 * Envanteri günceller (sadece ilgili belediyeye aitse).
 */
exports.updateAsset = async (req, res) => {
  try {
    const { municipality_id, id: currentUserId } = req.user;
    const { id } = req.params;

    const {
      asset_code,
      name,
      description,
      category_id,
      department_id,
      location_id,
      assigned_user_id,
      purchase_price,
      purchase_date,
      serial_number,
      status,
      is_qr_tagged,
      quantity,
      unit,
      tasinir_code,
      asset_type,
      qrcode,
      brand,
      model,
      purchase_id,
      warranty_end_date,
      amortisman_suresi,
      hurda_degeri,
      current_value,
      is_movable,
    } = req.body;

    const existing = await knex('assets')
      .where({ id, municipality_id })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Envanter bulunamadı veya bu belediyeye ait değil' });
    }

    if (asset_code && asset_code !== existing.asset_code) {
      const conflict = await knex('assets')
        .where({ municipality_id, asset_code })
        .andWhereNot({ id })
        .first();

      if (conflict) {
        return res.status(400).json({ message: 'Bu asset_code bu belediyede zaten kullanılıyor' });
      }
    }

    const [updated] = await knex('assets')
      .where({ id, municipality_id })
      .update(
        {
          asset_code: asset_code ?? existing.asset_code,
          name: name ?? existing.name,
          description: description ?? existing.description,
          category_id: category_id ?? existing.category_id,
          department_id: department_id ?? existing.department_id,
          location_id: location_id ?? existing.location_id,
          assigned_user_id: assigned_user_id ?? existing.assigned_user_id,
          purchase_price: purchase_price ?? existing.purchase_price,
          purchase_date: purchase_date ?? existing.purchase_date,
          serial_number: serial_number ?? existing.serial_number,
          status: status ?? existing.status,
          is_qr_tagged: is_qr_tagged ?? existing.is_qr_tagged,
          quantity: quantity ?? existing.quantity,
          unit: unit ?? existing.unit,
          tasinir_code: tasinir_code ?? existing.tasinir_code,
          asset_type: asset_type ?? existing.asset_type,
          qrcode: qrcode ?? existing.qrcode,
          brand: brand ?? existing.brand,
          model: model ?? existing.model,
          purchase_id: purchase_id ?? existing.purchase_id,
          warranty_end_date: warranty_end_date ?? existing.warranty_end_date,
          amortisman_suresi: amortisman_suresi ?? existing.amortisman_suresi,
          hurda_degeri: hurda_degeri ?? existing.hurda_degeri,
          current_value: current_value ?? existing.current_value,
          is_movable: is_movable ?? existing.is_movable,
          updated_by_user_id: currentUserId,
          updated_at: knex.fn.now(),
        },
        ['*']
      );

    return res.json(updated);
  } catch (err) {
    console.error('assets.updateAsset hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * DELETE /api/assets/:id
 * Envanter kaydını siler.
 */
exports.deleteAsset = async (req, res) => {
  try {
    const { municipality_id } = req.user;
    const { id } = req.params;

    const deletedCount = await knex('envanter')
      .where({ id, municipality_id })
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Envanter bulunamadı veya bu belediyeye ait değil' });
    }

    return res.json({ message: 'Envanter silindi' });
  } catch (err) {
    console.error('envanter.deleteAsset hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
