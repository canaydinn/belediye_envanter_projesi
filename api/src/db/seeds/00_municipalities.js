exports.seed = async function (knex) {
  // Tüm belediyeleri temizle
  await knex("municipalities").del();
   const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  await knex("municipalities").insert([
    {
      id: 1,
      code: "URLA_BLD",
      name: "Urla Belediyesi",
      province: "İzmir",
      district: "Urla",
      tax_number: "1234567890",
      address: "Urla Belediyesi, İzmir",
      contact_email: "info@urla.bel.tr",
      contact_phone: "0232 123 45 67",
      contact_person: "Sistem Yöneticisi",
      is_active: true,
       status: "active",
      license_start_date: now,
      license_end_date: oneYearLater,
      quota_end_date: oneYearLater,
    },
    {
      id: 2,
      code: "ETIMESGUT_BLD",
      name: "Etimesgut Belediyesi",
      province: "Ankara",
      district: "Etimesgut",
      tax_number: "9876543210",
      address: "Etimesgut Belediyesi, Ankara",
      contact_email: "info@etimesgut.bel.tr",
      contact_phone: "0312 987 65 43",
      contact_person: "Etimesgut Bilgi İşlem",
      is_active: true,
       status: "active",
      license_start_date: now,
      license_end_date: oneYearLater,
      quota_end_date: oneYearLater,
    },
    {
      id: 3,
      code: "MERSIN_YENISEHIR",
      name: "Yenişehir Belediyesi",
      province: "Mersin",
      district: "Yenişehir",
      tax_number: "1928374650",
      address: "Yenişehir Belediyesi, Mersin",
      contact_email: "info@yenisehir.bel.tr",
      contact_phone: "0324 555 55 55",
      contact_person: "Yenişehir Bilgi İşlem",
      is_active: true,
       status: "active",
      license_start_date: now,
      license_end_date: oneYearLater,
      quota_end_date: oneYearLater,
    }
  ]);
};
