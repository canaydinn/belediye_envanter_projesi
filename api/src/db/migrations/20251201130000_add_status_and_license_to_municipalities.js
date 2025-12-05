// 20251201130000_add_status_and_license_to_municipalities.js

exports.up = async function (knex) {
  const hasStatus = await knex.schema.hasColumn('municipalities', 'status');
  const hasLicenseStart = await knex.schema.hasColumn('municipalities', 'license_start_date');
  const hasLicenseEnd = await knex.schema.hasColumn('municipalities', 'license_end_date');
  const hasQuotaEnd = await knex.schema.hasColumn('municipalities', 'quota_end_date');
  const hasContactPerson = await knex.schema.hasColumn('municipalities', 'contact_person');

  return knex.schema.alterTable('municipalities', (table) => {
    if (!hasStatus) {
      table.string('status', 20).notNullable().defaultTo('pending');
    }
    if (!hasLicenseStart) {
      table.date('license_start_date').nullable();
    }
    if (!hasLicenseEnd) {
      table.date('license_end_date').nullable();
    }
    if (!hasQuotaEnd) {
      table.date('quota_end_date').nullable();
    }
    if (!hasContactPerson) {
      table.string('contact_person', 150).nullable();
    }
  });
};

exports.down = async function (knex) {
  const hasStatus = await knex.schema.hasColumn('municipalities', 'status');
  const hasLicenseStart = await knex.schema.hasColumn('municipalities', 'license_start_date');
  const hasLicenseEnd = await knex.schema.hasColumn('municipalities', 'license_end_date');
  const hasQuotaEnd = await knex.schema.hasColumn('municipalities', 'quota_end_date');
  const hasContactPerson = await knex.schema.hasColumn('municipalities', 'contact_person');

  return knex.schema.alterTable('municipalities', (table) => {
    if (hasStatus) {
      table.dropColumn('status');
    }
    if (hasLicenseStart) {
      table.dropColumn('license_start_date');
    }
    if (hasLicenseEnd) {
      table.dropColumn('license_end_date');
    }
    if (hasQuotaEnd) {
      table.dropColumn('quota_end_date');
    }
    if (hasContactPerson) {
      table.dropColumn('contact_person');
    }
  });
};