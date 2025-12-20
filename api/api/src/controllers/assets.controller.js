// api/src/controllers/assets.controller.js
const knex = require('../config/knex');

/**
 * Multi-tenant standartları (BU DOSYA İÇİN KURAL):
 * - Belediye kapsamı: req.tenantMunicipalityId (tenantScope middleware set eder)
 * - Rol kontrolü: route seviyesinde authorize ile yapılır
 * - Tüm DB işlemlerinde municipality filtresi zorunludur
 */

const ASSET_SELECT_COLUMNS = [
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
  'u.full_name as assigned_user_full_name',
];

/**
 * FK doğrulaması: ID gönderilen ilişkili kayıtlar bu belediyeye ait mi?
 * - create/update öncesi cross-tenant referansları engeller
 */
async function validateAssetRefs({ municipalityId, category_id, department_id, location_id, assigned_user_id }) {
  // Zorunlu referanslar
  const [cat, dept, loc] = await Promise.all([
    knex('asset_categories').where({ id: category_id, municipality_id: municipalityId }).first(),
    knex('departments').where({ id: department_id, municipality_id: municipalityId }).first(),
    knex('locations').where({ id: location_id, municipality_id: municipalityId }).first(),
  ]);

  if (!cat) return { ok: false, status: 400, message: 'Kategori bu belediyeye ait değil' };
  if (!dept) return { ok: false, status: 400, message: 'Departman bu belediyeye ait değil' };
  if (!loc) return { ok: false, status: 400, message: 'Lokasyon bu belediyeye ait değil' };

  // Opsiyonel referans
  if (assigned_user_id) {
    const user = await knex('users')
      .where({ id: assigned_user_id, municipality_id: municipalityId, is_active: true })
      .first();

    if (!user) return { ok: false, status: 400, message: 'Sorumlu kişi bu belediyeye ait değil veya pasif' };
  }

  return { ok: true };
}

/**
 * GET /api/assets
 * Aktif belediyeye ait tüm varlıkları listeler.
 */
exports.listAssets = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId; // ✅ tenantScope set eder

    const assets = await knex('assets as e')
      .leftJoin('asset_categories as c', function () {
        this.on('e.category_id', 'c.id').andOn('e.municipality_id', 'c.municipality_id');
      })
      .leftJoin('departments as d', function () {
        this.on('e.department_id', 'd.id').andOn('e.municipality_id', 'd.municipality_id');
      })
      .leftJoin('locations as l', function () {
        this.on('e.location_id', 'l.id').andOn('e.municipality_id', 'l.municipality_id');
      })
      .leftJoin('users as u', function () {
        this.on('e.assigned_user_id', 'u.id').andOn('e.municipality_id', 'u.municipality_id');
      })
      .where('e.municipality_id', municipalityId)
      .select(ASSET_SELECT_COLUMNS)
      .orderBy('e.id', 'asc');

    return res.json(assets);
  } catch (err) {
    console.error('assets.listAssets hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * GET /api/assets/status-distribution
 * Aktif belediyedeki varlıkların durum dağılımını döner.
 */
exports.getStatusDistribution = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const rows = await knex('assets')
      .where({ municipality_id: municipalityId })
      .select('status')
      .count({ count: 'id' })
      .groupBy('status');

    const getCount = (statusKey) => {
      const match = rows.find((row) => row.status === statusKey);
      return Number(match?.count ?? match?.total ?? 0);
    };

    const distribution = {
      active: getCount('active'),
      in_maintenance: getCount('in_maintenance'),
      disposed: getCount('disposed'),
      lost: getCount('lost'),
    };

    const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);

    return res.json({
      municipality_id: municipalityId,
      distribution,
      total,
    });
  } catch (error) {
    console.error('assets.getStatusDistribution hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * GET /api/assets/:id
 * Aktif belediyeye ait tek bir varlığı getirir.
 */
exports.getAssetById = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const { id } = req.params;

    const asset = await knex('assets as e')
      .leftJoin('asset_categories as c', function () {
        this.on('e.category_id', 'c.id').andOn('e.municipality_id', 'c.municipality_id');
      })
      .leftJoin('departments as d', function () {
        this.on('e.department_id', 'd.id').andOn('e.municipality_id', 'd.municipality_id');
      })
      .leftJoin('locations as l', function () {
        this.on('e.location_id', 'l.id').andOn('e.municipality_id', 'l.municipality_id');
      })
      .leftJoin('users as u', function () {
        this.on('e.assigned_user_id', 'u.id').andOn('e.municipality_id', 'u.municipality_id');
      })
      .where('e.id', id)
      .andWhere('e.municipality_id', municipalityId)
      .select([
        ...ASSET_SELECT_COLUMNS,
        knex.raw("COALESCE(u.full_name, u.username) as assigned_user_name"),
      ])
      .first();

    if (!asset) {
      return res.status(404).json({ message: 'Varlık bulunamadı' });
    }

    return res.json(asset);
  } catch (err) {
    console.error('assets.getAssetById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * POST /api/assets
 * Yeni varlık oluşturur.
 */
exports.createAsset = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const currentUserId = req.user?.id;

    const {
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
    } = req.body || {};

    if (!name || !category_id || !department_id || !location_id) {
      return res.status(400).json({
        message: 'name, category_id, department_id ve location_id zorunludur',
      });
    }

    // ✅ Cross-tenant FK doğrulaması
    const refCheck = await validateAssetRefs({
      municipalityId,
      category_id,
      department_id,
      location_id,
      assigned_user_id,
    });
    if (!refCheck.ok) return res.status(refCheck.status).json({ message: refCheck.message });

    const createdAsset = await knex.transaction(async (trx) => {
      // 1) asset_code olmadan insert
      const [inserted] = await trx('assets')
        .insert({
          asset_code: null, // 2. adımda üretilecek
          name: String(name).trim(),
          description: description ? String(description).trim() : null,
          category_id,
          department_id,
          location_id,
          assigned_user_id: assigned_user_id || null,
          purchase_price: purchase_price ?? null,
          purchase_date: purchase_date || null,
          serial_number: serial_number ? String(serial_number).trim() : null,
          status: status || 'active',
          is_qr_tagged: is_qr_tagged ?? false,
          quantity: quantity ?? 1,
          unit: unit || 'Adet',
          tasinir_code: tasinir_code ? String(tasinir_code).trim() : null,
          asset_type: asset_type || 'demirbas',
          created_by_user_id: currentUserId,
          updated_by_user_id: currentUserId,
          municipality_id: municipalityId,
          qrcode: qrcode ? String(qrcode).trim() : null,
          brand: brand ? String(brand).trim() : null,
          model: model ? String(model).trim() : null,
          purchase_id: purchase_id ?? null,
          warranty_end_date: warranty_end_date || null,
          amortisman_suresi: amortisman_suresi ?? null,
          hurda_degeri: hurda_degeri ?? null,
          current_value: current_value ?? null,
          is_movable: is_movable ?? true,
        })
        .returning('*');

      // 2) Kod üretimi: AS-<municipalityId>-<YY>-<ID>
      const dateForYear = purchase_date ? new Date(purchase_date) : new Date();
      const year = String(dateForYear.getFullYear()).slice(-2); // 2025 -> "25"
      const paddedId = String(inserted.id).padStart(6, '0');
      const generatedAssetCode = `AS-${municipalityId}-${year}-${paddedId}`;

      // 3) asset_code update
      const [updated] = await trx('assets')
        .where({ id: inserted.id, municipality_id: municipalityId })
        .update({ asset_code: generatedAssetCode })
        .returning('*');

      return updated;
    });

    return res.status(201).json(createdAsset);
  } catch (err) {
    console.error('assets.createAsset hatası:', err);
    return res.status(500).json({
      message: err.message || 'Sunucu hatası',
      code: err.code,
      detail: err.detail,
    });
  }
};

/**
 * PUT /api/assets/:id
 * Varlığı günceller (sadece ilgili belediyeye aitse).
 */
exports.updateAsset = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const currentUserId = req.user?.id;
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
    } = req.body || {};

    const existing = await knex('assets')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Varlık bulunamadı veya bu belediyeye ait değil' });
    }

    // asset_code değiştiriliyorsa aynı belediye içinde çakışma kontrolü
    if (asset_code && asset_code !== existing.asset_code) {
      const conflict = await knex('assets')
        .where({ municipality_id: municipalityId, asset_code })
        .andWhereNot({ id })
        .first();

      if (conflict) {
        return res.status(400).json({ message: 'Bu asset_code bu belediyede zaten kullanılıyor' });
      }
    }

    // Eğer ref alanları değiştiriliyorsa cross-tenant doğrula
    const nextCategoryId = category_id ?? existing.category_id;
    const nextDepartmentId = department_id ?? existing.department_id;
    const nextLocationId = location_id ?? existing.location_id;
    const nextAssignedUserId = assigned_user_id ?? existing.assigned_user_id;

    const refCheck = await validateAssetRefs({
      municipalityId,
      category_id: nextCategoryId,
      department_id: nextDepartmentId,
      location_id: nextLocationId,
      assigned_user_id: nextAssignedUserId,
    });
    if (!refCheck.ok) return res.status(refCheck.status).json({ message: refCheck.message });

    const [updated] = await knex('assets')
      .where({ id, municipality_id: municipalityId })
      .update(
        {
          asset_code: asset_code ?? existing.asset_code,
          name: name ?? existing.name,
          description: description ?? existing.description,
          category_id: nextCategoryId,
          department_id: nextDepartmentId,
          location_id: nextLocationId,
          assigned_user_id: nextAssignedUserId,
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
 * Varlık kaydını siler (sadece ilgili belediyeye aitse).
 */
exports.deleteAsset = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const { id } = req.params;

    const deletedCount = await knex('assets')
      .where({ id, municipality_id: municipalityId })
      .del();

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Varlık bulunamadı veya bu belediyeye ait değil' });
    }

    return res.json({ message: 'Varlık silindi' });
  } catch (err) {
    console.error('assets.deleteAsset hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

/**
 * GET /api/assets/filters
 * Filtre alanları için kategori, birim ve lokasyon listelerini döndürür.
 */
exports.getFilterOptions = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const [categories, departments, locations] = await Promise.all([
      knex('asset_categories')
        .where({ municipality_id: municipalityId })
        .select('id', 'name', 'code'),
      knex('departments')
        .where({ municipality_id: municipalityId, is_active: true })
        .select('id', 'name', 'code'),
      knex('locations')
        .where({ municipality_id: municipalityId, is_active: true })
        .select('id', 'name', 'code'),
    ]);

    return res.json({ categories, departments, locations });
  } catch (err) {
    console.error('assets.getFilterOptions hatası:', err);
    return res.status(500).json({ message: 'Filtre verileri alınamadı' });
  }
};

/**
 * GET /api/assets/recent-assets
 * İlgili belediyeye ait son eklenen varlıkları döner.
 */
exports.getRecentAssets = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const assets = await knex('assets as a')
      .leftJoin('departments as d', function () {
        this.on('a.department_id', 'd.id').andOn('a.municipality_id', 'd.municipality_id');
      })
      .where('a.municipality_id', municipalityId)
      .select('a.id', 'a.name', 'a.asset_code', 'a.created_at', 'd.name as department_name')
      .orderBy('a.created_at', 'desc')
      .limit(5);

    return res.json(assets);
  } catch (err) {
    console.error('assets.getRecentAssets hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
