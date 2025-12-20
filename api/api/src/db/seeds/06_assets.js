// 07_assets.js
exports.seed = async function (knex) {
  await knex('assets').del();

  await knex('assets').insert([
    {
      id: 1,
      asset_code: 'ASSET-0001',
      name: 'Dizüstü Bilgisayar',
      description: 'Belediye personeli için laptop',
      category_id: 1,
      department_id: 1,
      location_id: 1,
      assigned_user_id: 4,
      quantity: 1,
      unit: 'Adet',
      tasinir_code: '253.03.03',
      asset_type: 'demirbas',
      serial_number: 'SN123456',
      purchase_price: 18500,
      purchase_date: '2023-05-10',
      created_by_user_id: 1,
      municipality_id: 1,
    },
    {
      id: 2,
      asset_code: 'ASSET-0002',
      name: 'Ofis Sandalyesi',
      description: 'Ergonomik personel sandalyesi',
      category_id: 2,
      department_id: 1,
      location_id: 1,
      quantity: 5,
      unit: 'Adet',
      tasinir_code: '253.05.02',
      asset_type: 'demirbas',
      purchase_price: 3500,
      purchase_date: '2022-03-20',
      created_by_user_id: 1,
      municipality_id: 1,
    },
  ]);
};
