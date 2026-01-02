// api/scripts/fix_asset_categories_sequence.js
// asset_categories tablosunun id sequence'ini düzeltir

const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig.development);

async function fixSequence() {
  try {
    console.log('asset_categories sequence düzeltiliyor...');
    
    // Mevcut maksimum id değerini al
    const result = await knex('asset_categories')
      .max('id as max_id')
      .first();
    
    const maxId = result?.max_id || 0;
    const nextId = maxId + 1;
    
    // Sequence'i düzelt
    await knex.raw(`SELECT setval('asset_categories_id_seq', ?, false)`, [nextId]);
    
    console.log(`Sequence düzeltildi. Sonraki ID: ${nextId}`);
    
    // Sequence'in mevcut değerini kontrol et
    const seqResult = await knex.raw(`SELECT last_value, is_called FROM asset_categories_id_seq`);
    console.log('Sequence durumu:', seqResult.rows[0]);
    
    await knex.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Hata:', err);
    await knex.destroy();
    process.exit(1);
  }
}

fixSequence();

