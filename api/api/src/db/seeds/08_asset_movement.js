// 09_asset_movements.js
exports.seed = async function (knex) {
  await knex('asset_movements').del();

  await knex('asset_movements').insert([
    {
      id: 1,
      asset_id: 1,
      movement_type: 'assign',
      from_department_id: null,
      to_department_id: 1,
      from_location_id: null,
      to_location_id: 1,
      performed_by_user_id: 2,
      movement_date: '2023-05-15',
      notes: 'Laptop zimmet edildi',
      created_by_user_id: 2,
      municipality_id: 1,
    },
    {
      id: 2,
      asset_id: 2,
      movement_type: 'transfer',
      from_department_id: 1,
      to_department_id: 1,
      from_location_id: 1,
      to_location_id: 2,
      performed_by_user_id: 4,
      movement_date: '2023-06-01',
      notes: 'Ofis sandalyesi depoya taşındı',
      created_by_user_id: 4,
      municipality_id: 1,
    },
  ]);
};
