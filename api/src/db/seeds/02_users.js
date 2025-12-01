exports.seed = async function (knex) {

  await knex('users').insert([
    {
      id: 1,
      username: 'admin',
      email: 'admin@belediye.gov.tr',
      full_name: 'Sistem Yöneticisi',
      password_hash: '$2b$10$F5VwF...abc', // gerçek hash ile değiştirin
      role_id: 1,
      is_active: true,
    },
    {
      id: 2,
      username: 'kayit',
      email: 'kayit@belediye.gov.tr',
      full_name: 'Taşınır Kayıt Yetkilisi',
      password_hash: '$2b$10$F5VwF...abc',
      role_id: 2,
      is_active: true,
    },
    {
      id: 3,
      username: 'kontrol',
      email: 'kontrol@belediye.gov.tr',
      full_name: 'Taşınır Kontrol Yetkilisi',
      password_hash: '$2b$10$F5VwF...abc',
      role_id: 3,
    },
    {
      id: 4,
      username: 'fenisleri',
      email: 'fenisleri@belediye.gov.tr',
      full_name: 'Fen İşleri Müdürü',
      password_hash: '$2b$10$F5VwF...abc',
      role_id: 4,
    }
  ]);
};
