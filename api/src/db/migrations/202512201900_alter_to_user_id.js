exports.up = async (knex) => {
    // Kolonun zaten var olup olmadığını kontrol et
    const hasToUserId = await knex.schema.hasColumn('asset_movements', 'to_user_id');
    
    if (!hasToUserId) {
      await knex.schema.alterTable('asset_movements', (t) => {
        t.integer('to_user_id').nullable().index();
        t.foreign('to_user_id').references('users.id').onDelete('SET NULL');
      });
    } else {
      // Kolon varsa sadece foreign key ve index eklemeyi dene
      try {
        await knex.raw(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'asset_movements_to_user_id_foreign'
            ) THEN
              ALTER TABLE asset_movements 
              ADD CONSTRAINT asset_movements_to_user_id_foreign 
              FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL;
            END IF;
          END $$;
        `);
      } catch (err) {
        // Foreign key zaten varsa devam et
        console.log('Foreign key constraint may already exist, continuing...');
      }
      
      // Index eklemeyi dene
      try {
        const hasIndex = await knex.raw(`
          SELECT 1 FROM pg_indexes 
          WHERE tablename = 'asset_movements' 
          AND indexname LIKE '%to_user_id%'
          LIMIT 1
        `);
        
        if (!hasIndex.rows || hasIndex.rows.length === 0) {
          await knex.raw(`CREATE INDEX IF NOT EXISTS asset_movements_to_user_id_index ON asset_movements(to_user_id)`);
        }
      } catch (err) {
        // Index zaten varsa devam et
        console.log('Index may already exist, continuing...');
      }
    }
  };
  
  exports.down = async (knex) => {
    await knex.schema.alterTable('asset_movements', (t) => {
      t.dropForeign(['to_user_id']);
      t.dropColumn('to_user_id');
    });
  };