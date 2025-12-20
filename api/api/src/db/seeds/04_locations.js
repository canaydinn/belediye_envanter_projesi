// 05_locations.js
exports.seed = async function (knex) {
  await knex('locations').del();

  await knex('locations').insert([
    {
      id: 1,
      code: 'BLD_A_101',
      name: 'Ana Bina 1. Kat 101',
      department_id: 1,
      municipality_id: 1,
    },
    {
      id: 2,
      code: 'DEPO_1',
      name: 'Merkez Depo',
      department_id: 1,
      municipality_id: 1,
    },
    {
      id: 3,
      code: 'ATOLYE_1',
      name: 'Atölye Alanı',
      department_id: 1,
      municipality_id: 1,
    },
  ]);
};
