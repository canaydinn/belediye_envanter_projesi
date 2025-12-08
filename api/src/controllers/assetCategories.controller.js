// api/src/controllers/assetCategories.controller.js
const knex = require('../config/knex');

exports.listCategories = async (req, res) => {
  try {
    const municipalityId = req.user?.municipality_id;
    console.log('listCategories → municipalityId:', municipalityId);

    const categories = await knex('asset_categories')
     // .where('municipality_id', municipalityId)
      .select('id', 'code', 'name', 'description');

    console.log('listCategories → bulunan kategori sayısı:', categories.length);

    return res.json(categories);
  } catch (err) {
    console.error('assetCategories.listCategories hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
