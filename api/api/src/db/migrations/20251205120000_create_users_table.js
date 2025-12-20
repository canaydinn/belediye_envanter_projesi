// migrations/20251205120000_create_users_table.js

/**
 * users tablosu
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();

    table.string('username', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 255).notNullable();

    table
      .integer('role_id')
      .notNullable()
      .references('id')
      .inTable('roles')
      .onDelete('RESTRICT')
      .index();

    table
      .integer('municipality_id')
      .references('id')
      .inTable('municipalities')
      .onDelete('SET NULL')
      .index();

    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('last_login_at', { useTz: true });
    table.specificType('last_login_ip', 'inet');
    table.integer('failed_login_attempts').notNullable().defaultTo(0);
    table.timestamp('locked_until', { useTz: true });

    table.string('phone', 30);
    table.timestamp('email_verified_at', { useTz: true });
    table.timestamp('deleted_at', { useTz: true });

    table
      .bigInteger('created_by')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    table
      .bigInteger('updated_by')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    table
      .timestamp('created_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp('updated_at', { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};
