// 03_users.js
exports.seed = async function (knex) {
  await knex('users').del();

  await knex('users').insert([
    {
      id: 1,
      username: 'admin',
      email: 'admin@urla.bel.tr',
      full_name: 'Sistem Yöneticisi',
      password_hash: '$2b$10$Q/.gZV5YjZgwyU0YV7LwKehF6DqM0Hlg5nKfGVGUGWiwq2W7zVg3K', // gerçek bcrypt hash
      role_id: 1,
      is_active: true,
      municipality_id: 1,
    },
    {
      id: 2,
      username: 'kayit',
      email: 'kayit@urla.bel.tr',
      full_name: 'Taşınır Kayıt Yetkilisi',
      password_hash: '$2b$10$Q/.gZV5YjZgwyU0YV7LwKehF6DqM0Hlg5nKfGVGUGWiwq2W7zVg3K',
      role_id: 2,
      is_active: true,
      municipality_id: 1,
    },
    {
      id: 3,
      username: 'kontrol',
      email: 'kontrol@urla.bel.tr',
      full_name: 'Taşınır Kontrol Yetkilisi',
      password_hash: '$2b$10$Q/.gZV5YjZgwyU0YV7LwKehF6DqM0Hlg5nKfGVGUGWiwq2W7zVg3K',
      role_id: 3,
      is_active: true,
      municipality_id: 1,
    },
    {
      id: 4,
      username: 'fenisleri',
      email: 'fenisleri@urla.bel.tr',
      full_name: 'Fen İşleri Müdürü',
      password_hash: '$2b$10$Q/.gZV5YjZgwyU0YV7LwKehF6DqM0Hlg5nKfGVGUGWiwq2W7zVg3K',
      role_id: 4,
      is_active: true,
      municipality_id: 1,
    },
  ]);
};
