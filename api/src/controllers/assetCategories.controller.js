// api/src/controllers/assetCategories.controller.js
const knex = require('../config/knex');

exports.listCategories = async (req, res) => {
  try {
    const municipalityId = req.user?.municipality_id;

    const categories = await knex('asset_categories')
      .select('id', 'code', 'name', 'description');
    return res.json(categories);
  } catch (err) {
    console.error('assetCategories.listCategories hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.deleteCategory = async (req, res) => {
  try {
    const municipalityId = req.user?.municipality_id;
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