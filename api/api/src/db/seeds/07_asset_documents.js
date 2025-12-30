// 08_asset_documents.js
exports.seed = async function (knex) {
  await knex('asset_documents').del();

  await knex('asset_documents').insert([
    {
      id: 1,
      asset_id: 1,
      document_type: 'fatura',
      document_no: 'FAT-2023-001',
      fiscal_year: 2023,
      issue_date: '2023-05-10',
      amount: 18500,
      uploaded_by_user_id: 1,
      municipality_id: 1,
    },
    {
      id: 2,
      asset_id: 2,
      document_type: 'tif',
      document_no: 'TIF-2022-112',
      fiscal_year: 2022,
      issue_date: '2022-03-20',
      amount: 3500,
      uploaded_by_user_id: 2,
      municipality_id: 1,
    },
  ]);
};
// Sequence'i resetle (PostgreSQL için)
  await knex.raw(
    "SELECT setval('asset_movements_id_seq', (SELECT MAX(id) FROM asset_movements));"
  );