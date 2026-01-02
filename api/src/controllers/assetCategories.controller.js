// api/src/controllers/assetCategories.controller.js
const knex = require('../config/knex');

exports.listCategories = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId || req.user?.municipality_id;

    const categories = await knex('asset_categories')
  .where({ municipality_id: municipalityId })
  .select('id', 'code', 'name', 'description')
  .orderBy('name', 'asc');
    return res.json(categories);
  } catch (err) {
    console.error('assetCategories.listCategories hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getCategoryStats = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId || req.user?.municipality_id;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
    }

    const totalCategoriesRow = await knex('asset_categories')
      .where({ municipality_id: municipalityId })
      .count('id as count')
      .first();

    const totalActiveCategoriesRow = await knex('asset_categories as c')
      .leftJoin('assets as a', function joinAssets() {
        this.on('a.category_id', 'c.id').andOn('a.municipality_id', 'c.municipality_id');
      })
      .where('c.municipality_id', municipalityId)
      .where('a.status', 'active')
      .countDistinct('c.id as count')
      .first();

    const maxAssetCategoryRow = await knex('asset_categories as c')
      .leftJoin('assets as a', function joinAssets() {
        this.on('a.category_id', 'c.id').andOn('a.municipality_id', 'c.municipality_id');
      })
      .where('c.municipality_id', municipalityId)
      .groupBy('c.id', 'c.name', 'c.code')
      .count('a.id as asset_count')
      .select('c.id', 'c.name', 'c.code')
      .orderBy([{ column: 'asset_count', order: 'desc' }, { column: 'c.name', order: 'asc' }])
      .first();

    const emptyCategoriesRow = await knex('asset_categories as c')
      .leftJoin('assets as a', function joinAssets() {
        this.on('a.category_id', 'c.id').andOn('a.municipality_id', 'c.municipality_id');
      })
      .where('c.municipality_id', municipalityId)
      .groupBy('c.id')
      .havingRaw('COUNT(a.id) = 0')
      .countDistinct('c.id as count')
      .first();

    return res.json({
      total_categories: Number(totalCategoriesRow?.count || 0),
      total_active_categories: Number(totalActiveCategoriesRow?.count || 0),
      max_asset_category: maxAssetCategoryRow
        ? {
            id: maxAssetCategoryRow.id,
            name: maxAssetCategoryRow.name,
            code: maxAssetCategoryRow.code,
            asset_count: Number(maxAssetCategoryRow.asset_count || 0),
          }
        : null,
      total_empty_categories: Number(emptyCategoriesRow?.count || 0),
    });
  } catch (err) {
    console.error('assetCategories.getCategoryStats hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.createCategory = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId || req.user?.municipality_id;
    const { code, name, description } = req.body || {};

    if (!municipalityId) {
      return res.status(401).json({ message: 'Belediye doğrulaması başarısız' });
    }

    const sanitizedCode = (code || '').trim();
    const sanitizedName = (name || '').trim();
    const sanitizedDescription = (description || '').trim();

    if (!sanitizedCode || !sanitizedName) {
      return res.status(400).json({ message: 'Kod ve ad alanları zorunludur' });
    }

    const duplicate = await knex('asset_categories')
      .where({ municipality_id: municipalityId })
      .andWhere((builder) =>
        builder.where('code', sanitizedCode).orWhere('name', sanitizedName)
      )
      .first();

    if (duplicate) {
      return res.status(409).json({ message: 'Bu kod veya ad ile kayıtlı kategori zaten mevcut' });
    }

    const [createdCategory] = await knex('asset_categories')
      .insert({
        code: sanitizedCode,
        name: sanitizedName,
        description: sanitizedDescription || null,
        municipality_id: municipalityId,
      })
      .returning(['id', 'code', 'name', 'description', 'municipality_id', 'created_at', 'updated_at']);

    return res.status(201).json({
      message: 'Kategori başarıyla oluşturuldu',
      category: createdCategory,
    });
  } catch (err) {
    console.error('assetCategories.createCategory hatası:', err);
    
    // Veritabanı constraint hatası kontrolü
    if (err.code === '23505') { // PostgreSQL unique constraint violation
      const constraintName = err.constraint || '';
      
      // Primary key hatası - sequence sorunu olabilir, otomatik düzelt
      if (constraintName.includes('pkey') || constraintName === 'asset_categories_pkey') {
        try {
          console.log('asset_categories sequence hatası tespit edildi, düzeltiliyor...');
          // Sequence'i mevcut max ID'ye göre güncelle
          await knex.raw(
            "SELECT setval('asset_categories_id_seq', COALESCE((SELECT MAX(id) FROM asset_categories), 0) + 1, false);"
          );
          console.log('asset_categories sequence düzeltildi.');
          
          // Kullanıcıya tekrar denemesini söyle
          return res.status(409).json({
            message: 'ID sequence hatası tespit edildi ve düzeltildi. Lütfen formu tekrar gönderin.',
            ...(process.env.NODE_ENV !== 'production' && {
              error: err.message,
              code: err.code,
              detail: 'Sequence otomatik olarak düzeltildi. Formu tekrar gönderebilirsiniz.'
            })
          });
        } catch (fixErr) {
          console.error('Sequence düzeltme hatası:', fixErr);
          return res.status(500).json({
            message: 'ID sequence hatası. Lütfen sistem yöneticisine başvurun.',
            ...(process.env.NODE_ENV !== 'production' && {
              error: err.message,
              fixError: fixErr.message
            })
          });
        }
      } else if (constraintName.includes('code') || constraintName.includes('name') || constraintName.includes('municipality_id')) {
        // Kod veya ad duplicate (belediye bazında)
        return res.status(409).json({ 
          message: 'Bu kod veya ad ile kayıtlı kategori zaten mevcut',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      } else {
        // Genel unique constraint hatası
        return res.status(409).json({ 
          message: 'Bu kod veya ad ile kayıtlı kategori zaten mevcut',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    }
    
    // Diğer veritabanı hataları
    if (err.code && err.code.startsWith('23')) {
      return res.status(400).json({ 
        message: 'Veritabanı hatası',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    return res.status(500).json({ 
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
exports.getCategoryById = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId || req.user?.municipality_id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Kategori id bilgisi zorunludur' });
    }

    const category = await knex('asset_categories')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı veya bu belediyeye ait değil' });
    }

    // Kategoriye ait varlık sayısını al
    const [assetCountRow] = await knex('assets')
      .where({ category_id: id, municipality_id: municipalityId })
      .count('id as count');

    const categoryWithStats = {
      ...category,
      asset_count: Number(assetCountRow?.count || 0),
    };

    return res.json(categoryWithStats);
  } catch (err) {
    console.error('assetCategories.getCategoryById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.updateCategory = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId || req.user?.municipality_id;
    const { id } = req.params;
    const { code, name, description } = req.body || {};

    if (!municipalityId) {
      return res.status(401).json({ message: 'Belediye doğrulaması başarısız' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Kategori id bilgisi zorunludur' });
    }

    const sanitizedCode = (code || '').trim();
    const sanitizedName = (name || '').trim();
    const sanitizedDescription = (description || '').trim();

    if (!sanitizedCode || !sanitizedName) {
      return res.status(400).json({ message: 'Kod ve ad alanları zorunludur' });
    }

    // Kategoriyi kontrol et
    const existingCategory = await knex('asset_categories')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı veya bu belediyeye ait değil' });
    }

    // Kod veya ad değiştiriliyorsa, aynı belediye içinde çakışma kontrolü
    if (sanitizedCode !== existingCategory.code || sanitizedName !== existingCategory.name) {
      const duplicate = await knex('asset_categories')
        .where({ municipality_id: municipalityId })
        .andWhere((builder) =>
          builder.where('code', sanitizedCode).orWhere('name', sanitizedName)
        )
        .andWhereNot({ id })
        .first();

      if (duplicate) {
        return res.status(409).json({ message: 'Bu kod veya ad ile kayıtlı kategori zaten mevcut' });
      }
    }

    // Kategoriyi güncelle
    const [updatedCategory] = await knex('asset_categories')
      .where({ id, municipality_id: municipalityId })
      .update({
        code: sanitizedCode,
        name: sanitizedName,
        description: sanitizedDescription || null,
        updated_at: knex.fn.now(),
      })
      .returning(['id', 'code', 'name', 'description', 'municipality_id', 'created_at', 'updated_at']);

    return res.json({
      message: 'Kategori başarıyla güncellendi',
      category: updatedCategory,
    });
  } catch (err) {
    console.error('assetCategories.updateCategory hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getCategoryDistribution = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId || req.user?.municipality_id;
    const distribution = await knex('asset_categories as c')
  .leftJoin('assets as a', function () {
    this.on('a.category_id', '=', 'c.id')
      .andOn('a.municipality_id', '=', 'c.municipality_id');
  })
  .where('c.municipality_id', municipalityId)
  .select('c.id', 'c.name', 'c.code')
  .count({ asset_count: 'a.id' })
  .groupBy('c.id', 'c.name', 'c.code')
  .orderBy('c.name', 'asc');

    const normalizedDistribution = distribution.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      asset_count: Number(item.asset_count) || 0,
    }));

    return res.json(normalizedDistribution);
  } catch (err) {
    console.error('assetCategories.getCategoryDistribution hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.deleteCategory = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId || req.user?.municipality_id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Kategori id bilgisi zorunludur' });
    }

    const category = await knex('asset_categories')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı veya bu belediyeye ait değil' });
    }

    const [assetCountRow] = await knex('assets')
      .where({ category_id: id, municipality_id: municipalityId })
      .count('id as count');

    if (Number(assetCountRow?.count) > 0) {
      return res.status(400).json({ message: 'Kategori bağlı varlıklar bulunduğu için silinemez' });
    }

    await knex('asset_categories').where({ id, municipality_id: municipalityId }).del();

    return res.json({ message: 'Kategori başarıyla silindi' });
  } catch (err) {
    console.error('assetCategories.deleteCategory hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};