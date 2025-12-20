// 06_asset_categories.js
exports.seed = async function (knex) {
  await knex('asset_categories').del();

  await knex('asset_categories').insert([
    { id: 1, code: 'BT',   name: 'Bilgi Teknolojileri', municipality_id: 1 },
    { id: 2, code: 'MOB',  name: 'Mobilya',             municipality_id: 1 },
    { id: 3, code: 'ARAC', name: 'Araç ve Makine',      municipality_id: 1 },
  ]);
};
