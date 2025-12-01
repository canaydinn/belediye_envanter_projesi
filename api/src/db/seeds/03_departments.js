exports.seed = async function (knex) {

  await knex('departments').insert([
    { id: 1, code: 'FENIS', name: 'Fen İşleri Müdürlüğü', manager_user_id: 4 },
    { id: 2, code: 'PARKBAHCE', name: 'Park ve Bahçeler Müdürlüğü' },
    { id: 3, code: 'MALI', name: 'Mali Hizmetler Müdürlüğü' },
  ]);
};
