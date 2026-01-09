-- Migration: 20250103000000_add_department_approval_fields.sql
-- Supabase SQL Editor'de çalıştırmak için

-- 1. users tablosuna primary_department_id ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'primary_department_id'
  ) THEN
    ALTER TABLE users 
    ADD COLUMN primary_department_id INTEGER 
    REFERENCES departments(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    CREATE INDEX IF NOT EXISTS users_primary_department_id_index ON users(primary_department_id);
    
    COMMENT ON COLUMN users.primary_department_id IS 'Kullanıcının ana birimi (taşınır kayıt yetkilisi için)';
  END IF;
END $$;

-- 2. user_departments ilişki tablosu oluştur
CREATE TABLE IF NOT EXISTS user_departments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, department_id)
);

CREATE INDEX IF NOT EXISTS user_departments_user_id_index ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS user_departments_department_id_index ON user_departments(department_id);

COMMENT ON TABLE user_departments IS 'Kullanıcı-birim ilişki tablosu (bir kullanıcının birden fazla birimde yetkisi olabilir)';

-- 3. approval_status enum tipi oluştur
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status_enum') THEN
    CREATE TYPE approval_status_enum AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

-- 4. assets tablosuna approval_status ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE assets 
    ADD COLUMN approval_status approval_status_enum NOT NULL DEFAULT 'approved';
    
    COMMENT ON COLUMN assets.approval_status IS 'Onay durumu: pending (beklemede), approved (onaylandı), rejected (reddedildi)';
  END IF;
END $$;

-- 5. assets tablosuna approved_by_user_id ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'approved_by_user_id'
  ) THEN
    ALTER TABLE assets 
    ADD COLUMN approved_by_user_id INTEGER 
    REFERENCES users(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
    
    CREATE INDEX IF NOT EXISTS assets_approved_by_user_id_index ON assets(approved_by_user_id);
    
    COMMENT ON COLUMN assets.approved_by_user_id IS 'Onaylayan kullanıcı (taşınır kontrol yetkilisi)';
  END IF;
END $$;

-- 6. assets tablosuna approved_at ekle
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE assets 
    ADD COLUMN approved_at TIMESTAMPTZ;
    
    COMMENT ON COLUMN assets.approved_at IS 'Onay tarihi';
  END IF;
END $$;

-- 7. Mevcut kayıtları güncelle (varsayılan olarak tüm kayıtlar approved)
-- Not: Bu UPDATE sadece approval_status kolonu varsa çalışır
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'approval_status'
  ) THEN
    UPDATE assets 
    SET approval_status = 'approved' 
    WHERE approval_status IS NULL;
  END IF;
END $$;

-- Migration tamamlandı mesajı
DO $$ 
BEGIN
  RAISE NOTICE 'Migration başarıyla tamamlandı!';
  RAISE NOTICE 'Eklenen kolonlar:';
  RAISE NOTICE '  - users.primary_department_id';
  RAISE NOTICE '  - assets.approval_status';
  RAISE NOTICE '  - assets.approved_by_user_id';
  RAISE NOTICE '  - assets.approved_at';
  RAISE NOTICE 'Oluşturulan tablo:';
  RAISE NOTICE '  - user_departments';
END $$;
