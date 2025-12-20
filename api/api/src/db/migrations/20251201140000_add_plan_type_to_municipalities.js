exports.up = async function (knex) {
  const hasPlanType = await knex.schema.hasColumn('municipalities', 'plan_type');

  if (hasPlanType) return;

  return knex.schema.alterTable('municipalities', (table) => {
    table.string('plan_type', 50).notNullable().defaultTo('basic');
  });
};

exports.down = async function (knex) {
  const hasPlanType = await knex.schema.hasColumn('municipalities', 'plan_type');

  if (!hasPlanType) return;

  return knex.schema.alterTable('municipalities', (table) => {
    table.dropColumn('plan_type');
  });
};