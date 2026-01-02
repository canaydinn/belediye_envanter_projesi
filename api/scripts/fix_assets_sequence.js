const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig.development);

async function fixSequence() {
  try {
    console.log('Fixing assets_id_seq...');
    // setval'in ikinci parametresi true (default) olduğunda, nextval bu değerin bir fazlasını verir.
    // Eğer tabloda hiç kayıt yoksa MAX(id) null döner, bu durumda coalesce ile 1 veriyoruz (veya 0 verip is_called false yapılabilir ama 1 güvenli).
    await knex.raw("SELECT setval('assets_id_seq', COALESCE((SELECT MAX(id) FROM assets), 0) + 1, false);");
    console.log('Success! Sequence assets_id_seq has been reset.');
  } catch (error) {
    console.error('Error fixing sequence:', error);
  } finally {
    await knex.destroy();
  }
}

fixSequence();
