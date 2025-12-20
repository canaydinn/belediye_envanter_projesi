exports.seed = async function (knex) {


  await knex('roles').insert([
    { id: 1, name: 'admin', description: 'Sistem yöneticisi' },
    { id: 2, name: 'tasinir_kayit', description: 'Taşınır kayıt yetkilisi' },
    { id: 3, name: 'tasinir_kontrol', description: 'Taşınır kontrol yetkilisi' },
    { id: 4, name: 'birim_sorumlusu', description: 'Birim sorumlusu' },
    { id: 5, name: 'kullanici', description: 'Standart kullanıcı' },
  ]);
};


