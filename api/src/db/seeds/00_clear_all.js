// db/seeds/00_clear_all.js
exports.seed = async function (knex) {
  // FK sırasına göre en bağımlıdan en bağımsıza truncate
  await knex.raw(`
    TRUNCATE TABLE
      asset_movements,
      asset_documents,
      assets,
      locations,
      departments,
      users,
      roles,
      asset_categories
    RESTART IDENTITY CASCADE;
  `);
};
