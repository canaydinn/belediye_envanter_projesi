exports.up = async (knex) => {
    await knex.schema.alterTable('asset_movements', (t) => {
      t.integer('to_user_id').nullable().index();
      t.foreign('to_user_id').references('users.id').onDelete('SET NULL');
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.alterTable('asset_movements', (t) => {
      t.dropForeign(['to_user_id']);
      t.dropColumn('to_user_id');
    });
  };