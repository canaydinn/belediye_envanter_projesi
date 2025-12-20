// 04_departments.js
exports.seed = async function (knex) {
  await knex('departments').del();

  await knex('departments').insert([
    {
      id: 1,
      code: 'FENIS',
      name: 'Fen İşleri Müdürlüğü',
      manager_user_id: 4,
      municipality_id: 1,
    },
    {
      id: 2,
      code: 'PARKBAHCE',
      name: 'Park ve Bahçeler Müdürlüğü',
      manager_user_id: null,
      municipality_id: 1,
    },
    {
      id: 3,
      code: 'MALI',
      name: 'Mali Hizmetler Müdürlüğü',
      manager_user_id: null,
      municipality_id: 1,
    },
  ]);
};
