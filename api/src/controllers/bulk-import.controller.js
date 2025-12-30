// api/src/controllers/bulk-import.controller.js
const knex = require('../config/knex');

/**
 * POST /api/assets/bulk-import
 * CSV dosyasından toplu varlık ekleme
 * Chunk'lar halinde işlenir (1000'er kayıt)
 */
exports.bulkImportAssets = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const currentUserId = req.user?.id;
    const { assets, chunkNumber, totalChunks } = req.body;

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ message: 'Varlık listesi gerekli' });
    }

    // Kategori, birim, lokasyon cache'leri (performans için)
    const categoryCache = new Map();
    const departmentCache = new Map();
    const locationCache = new Map();
    const userCache = new Map();

    // Cache'leri doldur
    await Promise.all([
      loadCategories(municipalityId, categoryCache),
      loadDepartments(municipalityId, departmentCache),
      loadLocations(municipalityId, locationCache),
      loadUsers(municipalityId, userCache)
    ]);

    const results = {
      success: 0,
      errors: [],
      processed: 0
    };

    // Her chunk'ı tek bir transaction içinde işle (performans için)
    await knex.transaction(async (trx) => {
      // Her varlığı işle
      for (let i = 0; i < assets.length; i++) {
        const assetData = assets[i];
        const rowNumber = (chunkNumber - 1) * 1000 + i + 1;

        try {
          // Varlık verilerini hazırla
          const preparedAsset = await prepareAssetData(
            assetData,
            municipalityId,
            currentUserId,
            categoryCache,
            departmentCache,
            locationCache,
            userCache
          );

          // Validasyon
          const validation = validateAssetData(preparedAsset);
          if (!validation.valid) {
            results.errors.push({
              row: rowNumber,
              message: validation.error
            });
            continue;
          }

          // Varlığı ekle (aynı transaction içinde)
          await insertAsset(trx, preparedAsset, municipalityId);
          results.success++;
          results.processed++;
        } catch (err) {
          console.error(`Satır ${rowNumber} işleme hatası:`, err);
          results.errors.push({
            row: rowNumber,
            message: err.message || 'Bilinmeyen hata'
          });
          results.processed++;
        }
      }
    });

    return res.json({
      success: results.success,
      errors: results.errors,
      processed: results.processed,
      chunkNumber,
      totalChunks
    });
  } catch (err) {
    console.error('bulk-import.bulkImportAssets hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası: ' + err.message });
  }
};

/**
 * Varlık verilerini hazırla ve normalize et
 */
async function prepareAssetData(assetData, municipalityId, currentUserId, categoryCache, departmentCache, locationCache, userCache) {
  // Kategori ID'sini bul
  let categoryId = null;
  if (assetData.category_id) {
    categoryId = parseInt(assetData.category_id);
  } else if (assetData.category_name) {
    categoryId = categoryCache.get(assetData.category_name.trim());
    if (!categoryId) {
      throw new Error(`Kategori bulunamadı: ${assetData.category_name}`);
    }
  }

  // Birim ID'sini bul
  let departmentId = null;
  if (assetData.department_id) {
    departmentId = parseInt(assetData.department_id);
  } else if (assetData.department_name) {
    departmentId = departmentCache.get(assetData.department_name.trim());
    if (!departmentId) {
      throw new Error(`Birim bulunamadı: ${assetData.department_name}`);
    }
  }

  // Lokasyon ID'sini bul
  let locationId = null;
  if (assetData.location_id) {
    locationId = parseInt(assetData.location_id);
  } else if (assetData.location_name) {
    locationId = locationCache.get(assetData.location_name.trim());
    if (!locationId) {
      throw new Error(`Lokasyon bulunamadı: ${assetData.location_name}`);
    }
  }

  // Kullanıcı ID'sini bul (opsiyonel)
  let assignedUserId = null;
  if (assetData.assigned_user_id) {
    assignedUserId = parseInt(assetData.assigned_user_id);
  } else if (assetData.assigned_user_name) {
    assignedUserId = userCache.get(assetData.assigned_user_name.trim());
  }

  // Tarih formatını düzelt
  let purchaseDate = null;
  if (assetData.purchase_date) {
    purchaseDate = new Date(assetData.purchase_date);
    if (isNaN(purchaseDate.getTime())) {
      purchaseDate = null;
    }
  }

  let warrantyEndDate = null;
  if (assetData.warranty_end_date) {
    warrantyEndDate = new Date(assetData.warranty_end_date);
    if (isNaN(warrantyEndDate.getTime())) {
      warrantyEndDate = null;
    }
  }

  return {
    name: String(assetData.name || '').trim(),
    description: assetData.description ? String(assetData.description).trim() : null,
    category_id: categoryId,
    department_id: departmentId,
    location_id: locationId,
    assigned_user_id: assignedUserId,
    purchase_price: assetData.purchase_price ? parseFloat(assetData.purchase_price) : null,
    purchase_date: purchaseDate,
    serial_number: assetData.serial_number ? String(assetData.serial_number).trim() : null,
    status: assetData.status || 'active',
    is_qr_tagged: assetData.is_qr_tagged === 'true' || assetData.is_qr_tagged === true || false,
    quantity: assetData.quantity ? parseInt(assetData.quantity) : 1,
    unit: assetData.unit || 'Adet',
    tasinir_code: assetData.tasinir_code ? String(assetData.tasinir_code).trim() : null,
    asset_type: assetData.asset_type || 'demirbas',
    brand: assetData.brand ? String(assetData.brand).trim() : null,
    model: assetData.model ? String(assetData.model).trim() : null,
    purchase_id: assetData.purchase_id ? parseInt(assetData.purchase_id) : null,
    warranty_end_date: warrantyEndDate,
    amortisman_suresi: assetData.amortisman_suresi ? parseInt(assetData.amortisman_suresi) : null,
    hurda_degeri: assetData.hurda_degeri ? parseFloat(assetData.hurda_degeri) : null,
    current_value: assetData.current_value ? parseFloat(assetData.current_value) : null,
    is_movable: assetData.is_movable === 'true' || assetData.is_movable === true || true,
    created_by_user_id: currentUserId,
    updated_by_user_id: currentUserId,
    municipality_id: municipalityId
  };
}

/**
 * Varlık verilerini doğrula
 */
function validateAssetData(asset) {
  if (!asset.name || asset.name.length === 0) {
    return { valid: false, error: 'Varlık adı zorunludur' };
  }
  if (!asset.category_id) {
    return { valid: false, error: 'Kategori ID zorunludur' };
  }
  if (!asset.department_id) {
    return { valid: false, error: 'Birim ID zorunludur' };
  }
  if (!asset.location_id) {
    return { valid: false, error: 'Lokasyon ID zorunludur' };
  }
  return { valid: true };
}

/**
 * Varlığı veritabanına ekle
 */
async function insertAsset(trx, assetData, municipalityId) {
  // 1) asset_code olmadan insert
  const [inserted] = await trx('assets')
    .insert({
      asset_code: null, // 2. adımda üretilecek
      name: assetData.name,
      description: assetData.description,
      category_id: assetData.category_id,
      department_id: assetData.department_id,
      location_id: assetData.location_id,
      assigned_user_id: assetData.assigned_user_id,
      purchase_price: assetData.purchase_price,
      purchase_date: assetData.purchase_date,
      serial_number: assetData.serial_number,
      status: assetData.status,
      is_qr_tagged: assetData.is_qr_tagged,
      quantity: assetData.quantity,
      unit: assetData.unit,
      tasinir_code: assetData.tasinir_code,
      asset_type: assetData.asset_type,
      created_by_user_id: assetData.created_by_user_id,
      updated_by_user_id: assetData.updated_by_user_id,
      municipality_id: municipalityId,
      brand: assetData.brand,
      model: assetData.model,
      purchase_id: assetData.purchase_id,
      warranty_end_date: assetData.warranty_end_date,
      amortisman_suresi: assetData.amortisman_suresi,
      hurda_degeri: assetData.hurda_degeri,
      current_value: assetData.current_value,
      is_movable: assetData.is_movable,
      qrcode: null // 2. adımda üretilecek
    })
    .returning('*');

  // 2) Kod üretimi: AS-<municipalityId>-<YY>-<ID>
  const dateForYear = assetData.purchase_date || new Date();
  const year = String(new Date(dateForYear).getFullYear()).slice(-2);
  const paddedId = String(inserted.id).padStart(6, '0');
  const generatedAssetCode = `AS-${municipalityId}-${year}-${paddedId}`;

  // 3) QR kod oluştur
  const qrCodeData = generatedAssetCode;

  // 4) asset_code ve qrcode update
  await trx('assets')
    .where({ id: inserted.id, municipality_id: municipalityId })
    .update({
      asset_code: generatedAssetCode,
      qrcode: qrCodeData
    });

  return inserted;
}

/**
 * Kategorileri cache'e yükle
 */
async function loadCategories(municipalityId, cache) {
  const categories = await knex('asset_categories')
    .where({ municipality_id: municipalityId })
    .select('id', 'name');

  categories.forEach(cat => {
    cache.set(cat.name.trim(), cat.id);
  });
}

/**
 * Birimleri cache'e yükle
 */
async function loadDepartments(municipalityId, cache) {
  const departments = await knex('departments')
    .where({ municipality_id: municipalityId, is_active: true })
    .select('id', 'name');

  departments.forEach(dept => {
    cache.set(dept.name.trim(), dept.id);
  });
}

/**
 * Lokasyonları cache'e yükle
 */
async function loadLocations(municipalityId, cache) {
  const locations = await knex('locations')
    .where({ municipality_id: municipalityId, is_active: true })
    .select('id', 'name');

  locations.forEach(loc => {
    cache.set(loc.name.trim(), loc.id);
  });
}

/**
 * Kullanıcıları cache'e yükle
 */
async function loadUsers(municipalityId, cache) {
  const users = await knex('users')
    .where({ municipality_id: municipalityId, is_active: true })
    .select('id', 'full_name', 'username');

  users.forEach(user => {
    const name = user.full_name || user.username;
    if (name) {
      cache.set(name.trim(), user.id);
    }
  });
}

