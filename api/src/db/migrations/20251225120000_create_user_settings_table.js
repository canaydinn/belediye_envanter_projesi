// migrations/20251225120000_create_user_settings_table.js

/**
 * user_settings tablosu
 * Kullanıcı tercihlerini ve ayarlarını saklar
 */
exports.up = async function (knex) {
  await knex.schema.createTable('user_settings', (table) => {
    table.bigIncrements('id').primary();

    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .unique()
      .index();

    // Görünüm tercihleri
    table.string('theme_mode', 20).defaultTo('light');
    table.string('color_theme', 50).defaultTo('theme-default');
    table.string('language', 10).defaultTo('tr');
    table.string('date_format', 20).defaultTo('DD/MM/YYYY');
    table.string('time_format', 10).defaultTo('24');
    table.string('timezone', 50).defaultTo('Europe/Istanbul');

    // Bildirim tercihleri (JSON)
    table.jsonb('notification_preferences').defaultTo(
      JSON.stringify({
        email_asset_create: true,
        email_asset_movement: true,
        email_system_updates: false,
        email_security_alerts: true,
        in_app_asset_create: true,
        in_app_asset_movement: true,
        in_app_system_updates: false,
        notification_frequency: 'instant',
      })
    );

    // Kişisel tercihler (JSON)
    table.jsonb('preferences').defaultTo(
      JSON.stringify({
        default_list_view: 'table',
        items_per_page: 25,
        auto_save: true,
        default_export_format: 'csv',
        dashboard_widgets: {
          assets: true,
          movements: true,
          categories: true,
          locations: true,
          recent_activity: false,
        },
      })
    );

    // Güvenlik ayarları (JSON)
    table.jsonb('security_settings').defaultTo(
      JSON.stringify({
        two_factor_enabled: false,
      })
    );

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
  await knex.schema.dropTableIfExists('user_settings');
};

