exports.seed = async function (knex) {

  await knex('asset_categories').insert([
    { id: 1, code: 'BT', name: 'Bilgi Teknolojileri' },
    { id: 2, code: 'MOB', name: 'Mobilya' },
    { id: 3, code: 'ARAC', name: 'Araç ve Makine' },
  ]);
};
