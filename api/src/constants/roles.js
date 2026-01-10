// api/src/constants/roles.js
module.exports = {
  SUPERADMIN: 1,              // Sistem süper admin (tüm belediyeler)
  ADMIN: 2,                   // Belediye sistem yöneticisi
  TASINIR_KAYIT: 3,          // Taşınır kayıt yetkilisi
  TASINIR_KONTROL: 4,         // Taşınır kontrol yetkilisi
  BIRIM_SORUMLUSU: 5,         // Birim sorumlusu
  KULLANICI: 6,               // Normal kullanıcı

  /**
   * Backward-compatible aliases (legacy names)
   * --------------------------------------------------
   * Bazı route/controller dosyaları eski sabit isimlerini kullanıyor.
   * Bunları kaldırmak yerine alias vererek prod'da 403 (undefined role) hatalarını engelliyoruz.
   */
  MUNICIPALITY_SUPER_ADMIN: 1,
  MUNICIPALITY_ADMIN: 2,
  USER: 6,
};