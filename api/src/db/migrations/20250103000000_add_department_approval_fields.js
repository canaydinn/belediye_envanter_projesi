// migrations/20250103000000_add_department_approval_fields.js

/**
 * Bu migration dosyası:
 * 1. users tablosuna primary_department_id ekler (kullanıcının ana birimi)
 * 2. user_departments ilişki tablosu oluşturur (bir kullanıcının birden fazla birimde yetkisi olabilir)
 * 3. assets tablosuna approval_status ekler (pending, approved, rejected)
 * 4. assets tablosuna approved_by_user_id ekler (onaylayan kullanıcı)
 * 5. assets tablosuna approved_at ekler (onay tarihi)
 * 
 * Bu değişiklikler, birden fazla taşınır kayıt yetkilisi senaryosu için gerekli:
 * - Birim bazlı görevlendirme
 * - Çift göz prensibi (kayıt → kontrol)
 * - Sorumluluk takibi
 */

exports.up = async function (knex) {
  // 1. users tablosuna primary_department_id ekle
  const hasPrimaryDepartmentId = await knex.schema.hasColumn('users', 'primary_department_id');
  
  if (!hasPrimaryDepartmentId) {
    await knex.schema.alterTable('users', (table) => {
      table
        .integer('primary_department_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('departments')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
        .index()
        .comment('Kullanıcının ana birimi (taşınır kayıt yetkilisi için)');
    });
    console.log('✓ users.primary_department_id eklendi');
  } else {
    console.log('- users.primary_department_id zaten var, atlandı');
  }

  // 2. user_departments ilişki tablosu oluştur (bir kullanıcının birden fazla birimde yetkisi olabilir)
  const hasUserDepartmentsTable = await knex.schema.hasTable('user_departments');
  
  if (!hasUserDepartmentsTable) {
    await knex.schema.createTable('user_departments', (table) => {
      table.bigIncrements('id').primary();
      
      table
        .bigInteger('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .index();
      
      table
        .integer('department_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('departments')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .index();
      
      // Bir kullanıcı aynı birimde birden fazla kez kayıtlı olamaz
      table.unique(['user_id', 'department_id']);
      
      table
        .timestamp('created_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      
      table
        .timestamp('updated_at', { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      
      table.comment('Kullanıcı-birim ilişki tablosu (bir kullanıcının birden fazla birimde yetkisi olabilir)');
    });
    console.log('✓ user_departments tablosu oluşturuldu');
  } else {
    console.log('- user_departments tablosu zaten var, atlandı');
  }

  // 3. assets tablosuna approval_status ekle
  const hasApprovalStatus = await knex.schema.hasColumn('assets', 'approval_status');
  
  if (!hasApprovalStatus) {
    await knex.schema.alterTable('assets', (table) => {
      table
        .enu('approval_status', ['pending', 'approved', 'rejected'], {
          useNative: true,
          enumName: 'approval_status_enum',
        })
        .notNullable()
        .defaultTo('approved')
        .comment('Onay durumu: pending (beklemede), approved (onaylandı), rejected (reddedildi)');
    });
    console.log('✓ assets.approval_status eklendi');
  } else {
    console.log('- assets.approval_status zaten var, atlandı');
  }

  // 4. assets tablosuna approved_by_user_id ekle
  const hasApprovedByUserId = await knex.schema.hasColumn('assets', 'approved_by_user_id');
  
  if (!hasApprovedByUserId) {
    await knex.schema.alterTable('assets', (table) => {
      table
        .integer('approved_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .onUpdate('CASCADE')
        .index()
        .comment('Onaylayan kullanıcı (taşınır kontrol yetkilisi)');
    });
    console.log('✓ assets.approved_by_user_id eklendi');
  } else {
    console.log('- assets.approved_by_user_id zaten var, atlandı');
  }

  // 5. assets tablosuna approved_at ekle
  const hasApprovedAt = await knex.schema.hasColumn('assets', 'approved_at');
  
  if (!hasApprovedAt) {
    await knex.schema.alterTable('assets', (table) => {
      table
        .timestamp('approved_at', { useTz: true })
        .nullable()
        .comment('Onay tarihi');
    });
    console.log('✓ assets.approved_at eklendi');
  } else {
    console.log('- assets.approved_at zaten var, atlandı');
  }

  // 6. Mevcut kayıtları güncelle (varsayılan olarak tüm kayıtlar approved olarak işaretlenir)
  const hasApprovalStatusColumn = await knex.schema.hasColumn('assets', 'approval_status');
  if (hasApprovalStatusColumn) {
    // Eğer approval_status enum'u yeni oluşturulduysa, mevcut kayıtları güncelle
    try {
      await knex('assets')
        .whereNull('approval_status')
        .orWhere('approval_status', '')
        .update({ approval_status: 'approved' });
      console.log('✓ Mevcut asset kayıtları approved olarak güncellendi');
    } catch (err) {
      console.log('- Mevcut kayıtlar zaten güncelli veya hata oluştu:', err.message);
    }
  }
};

exports.down = async function (knex) {
  // Geri alma işlemleri (ters sırada)
  
  // 5. assets.approved_at sil
  const hasApprovedAt = await knex.schema.hasColumn('assets', 'approved_at');
  if (hasApprovedAt) {
    await knex.schema.alterTable('assets', (table) => {
      table.dropColumn('approved_at');
    });
    console.log('✓ assets.approved_at silindi');
  }

  // 4. assets.approved_by_user_id sil
  const hasApprovedByUserId = await knex.schema.hasColumn('assets', 'approved_by_user_id');
  if (hasApprovedByUserId) {
    await knex.schema.alterTable('assets', (table) => {
      table.dropColumn('approved_by_user_id');
    });
    console.log('✓ assets.approved_by_user_id silindi');
  }

  // 3. assets.approval_status sil
  const hasApprovalStatus = await knex.schema.hasColumn('assets', 'approval_status');
  if (hasApprovalStatus) {
    // Önce enum'u kaldırmak için PostgreSQL'de özel işlem gerekebilir
    try {
      await knex.schema.alterTable('assets', (table) => {
        table.dropColumn('approval_status');
      });
      // Enum'u da silmeyi dene (PostgreSQL için)
      await knex.raw('DROP TYPE IF EXISTS approval_status_enum CASCADE');
      console.log('✓ assets.approval_status ve enum silindi');
    } catch (err) {
      console.log('- approval_status silinirken hata:', err.message);
    }
  }

  // 2. user_departments tablosunu sil
  const hasUserDepartmentsTable = await knex.schema.hasTable('user_departments');
  if (hasUserDepartmentsTable) {
    await knex.schema.dropTableIfExists('user_departments');
    console.log('✓ user_departments tablosu silindi');
  }

  // 1. users.primary_department_id sil
  const hasPrimaryDepartmentId = await knex.schema.hasColumn('users', 'primary_department_id');
  if (hasPrimaryDepartmentId) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('primary_department_id');
    });
    console.log('✓ users.primary_department_id silindi');
  }
};
