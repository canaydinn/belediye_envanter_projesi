municipalities

Amaç: Sistemdeki belediyeler / kurumlar (tenant).

id (PK, integer, serial, not null)

code (varchar, not null)

name (varchar, not null)

province (varchar, not null)

district (varchar, not null)

tax_number (varchar, nullable)

address (varchar, nullable)

contact_email (varchar, nullable)

contact_phone (varchar, nullable)

is_active (boolean, nullable, default true)

created_at (timestamptz, nullable, default CURRENT_TIMESTAMP)

updated_at (timestamptz, nullable, default CURRENT_TIMESTAMP)

status (varchar, not null, default 'pending')

license_start_date (date, nullable)

license_end_date (date, nullable)

quota_end_date (date, nullable)

contact_person (varchar, nullable)

plan_type (varchar, not null, default 'basic')

logo_url (varchar, nullable)

domain_url (varchar, nullable)

api_key (varchar, nullable)

max_users (integer, nullable)

max_assets (integer, nullable)

notes (text, nullable)

activation_token (varchar, nullable)

İlişkiler:

municipalities.id
↳ users.municipality_id
↳ departments.municipality_id
↳ locations.municipality_id
↳ asset_categories.municipality_id
↳ assets.municipality_id
↳ asset_movements.municipality_id
↳ asset_documents.municipality_id
↳ maintenance_requests.municipality_id
↳ logs.municipality_id

roles

Amaç: Kullanıcı rol tanımları (superadmin, admin, user vb.).

id (PK, integer, serial, not null)

name (varchar, not null)

description (varchar, nullable)

created_at (timestamptz, not null, default CURRENT_TIMESTAMP)

updated_at (timestamptz, not null, default CURRENT_TIMESTAMP)

İlişkiler:

roles.id ↳ users.role_id

users

Amaç: Sistemde oturum açan kullanıcılar.

id (PK, bigint, serial, not null)

username (varchar, not null, unique önerilir)

email (varchar, not null, unique)

password_hash (varchar, not null)

full_name (varchar, not null)

role_id (integer, FK → roles.id, not null)

municipality_id (integer, FK → municipalities.id, nullable – örn. superadmin için null olabilir)

is_active (boolean, not null, default true)

last_login_at (timestamptz, nullable)

last_login_ip (inet, nullable)

failed_login_attempts (integer, not null, default 0)

locked_until (timestamptz, nullable)

phone (varchar, nullable)

email_verified_at (timestamptz, nullable)

deleted_at (timestamptz, nullable)

created_by (bigint, FK → users.id, nullable)

updated_by (bigint, FK → users.id, nullable)

created_at (timestamptz, not null, default CURRENT_TIMESTAMP)

updated_at (timestamptz, not null, default CURRENT_TIMESTAMP)

İş kuralları:

Login sonrası tüm sorgular req.user.municipality_id ile sınırlandırılır.

is_active = false olan kullanıcılar sisteme giriş yapamaz.

departments

Amaç: Belediye içi müdürlük / birim bilgileri.

(Şema, örnek verilerden ve FK bilgisinden çıkarılmıştır.)

id (PK, integer, serial, not null)

code (varchar, not null)

name (varchar, not null)

manager_user_id (integer, FK → users.id, nullable)

is_active (boolean, not null, default true)

created_at (timestamptz, not null)

updated_at (timestamptz, not null)

municipality_id (integer, FK → municipalities.id, not null)

İlişkiler:

departments.id
↳ locations.department_id
↳ assets.department_id
↳ asset_movements.from_department_id
↳ asset_movements.to_department_id

locations

Amaç: Fiziksel lokasyonlar (bina, depo, ofis vs.).

id (PK, integer, serial, not null)

code (varchar, not null)

name (varchar, not null)

address (varchar, nullable)

department_id (integer, FK → departments.id, nullable)

is_active (boolean, not null, default true)

created_at (timestamptz, not null, default CURRENT_TIMESTAMP)

updated_at (timestamptz, not null, default CURRENT_TIMESTAMP)

municipality_id (integer, FK → municipalities.id, not null)

type (integer, nullable) — lokasyon tipi (ofis, depo vb. için kodlanmış değer)

latitude (varchar, nullable)

longitude (varchar, nullable)

İlişkiler:

locations.id
↳ assets.location_id
↳ asset_movements.from_location_id
↳ asset_movements.to_location_id

asset_categories

Amaç: Varlık kategorileri (BT, Mobilya, Araç vb.).

id (PK, integer, serial, not null)

code (varchar, not null)

name (varchar, not null)

description (varchar, nullable)

created_at (timestamptz, not null, default CURRENT_TIMESTAMP)

updated_at (timestamptz, not null, default CURRENT_TIMESTAMP)

municipality_id (integer, FK → municipalities.id, not null)

İlişkiler:

asset_categories.id ↳ assets.category_id

assets

Amaç: Envanterdeki tüm varlık kayıtları.

Tipler örnek veriden ve FK bilgisinden çıkarılmıştır.

id (PK, integer, serial, not null)

asset_code (varchar, not null, unique) — örn. AS-0001

name (varchar, not null)

description (text, nullable)

category_id (integer, FK → asset_categories.id, not null)

department_id (integer, FK → departments.id, not null)

location_id (integer, FK → locations.id, not null)

assigned_user_id (integer, FK → users.id, nullable) — varlıktan sorumlu kişi

purchase_price (numeric, nullable)

purchase_date (date, nullable)

serial_number (varchar, nullable)

status (varchar, not null, örn. 'active' | 'passive' | 'maintenance' | 'disposed')

is_qr_tagged (boolean, nullable) — QR etiketi basıldı mı

created_at (timestamptz, not null)

updated_at (timestamptz, not null)

quantity (integer, nullable, default 1)

unit (varchar, nullable, örn. adet, paket)

tasinir_code (varchar, nullable) — kamu taşınır kodu

asset_type (varchar, nullable) — demirbaş / tüketim vb.

created_by_user_id (integer, FK → users.id, nullable)

updated_by_user_id (integer, FK → users.id, nullable)

municipality_id (integer, FK → municipalities.id, not null)

qrcode (varchar, nullable) — QR içerik değeri

brand (varchar, nullable)

model (varchar, nullable)

purchase_id (integer, nullable) — satın alma kaydı ile ilişki için

warranty_end_date (date, nullable)

amortisman_suresi (integer, nullable)

hurda_degeri (numeric, nullable)

current_value (numeric, nullable)

is_movable (boolean, nullable, default true)

İş kuralları:

Tüm asset sorguları,

municipality_id = req.user.municipality_id

is_deleted kolonu varsa (şuan CSV’de görünmüyor ama planlanıyorsa) is_deleted = false
şeklinde filtrelenmelidir.

Varlığın taşınması durumunda ilgili department_id, location_id, assigned_user_id asset_movements üzerinden güncellenir.

asset_movements

Amaç: Varlık hareket logları (birim / lokasyon / sorumlu değişimi).

id (PK, integer, serial, not null)

asset_id (integer, FK → assets.id, not null)

movement_type (text, not null) — örn. 'transfer', 'assign', 'return' vb.

from_department_id (integer, FK → departments.id, nullable)

to_department_id (integer, FK → departments.id, nullable)

from_location_id (integer, FK → locations.id, nullable)

to_location_id (integer, FK → locations.id, nullable)

performed_by_user_id (integer, FK → users.id, nullable) — işlemi yapan kullanıcı

movement_date (timestamptz, not null, default CURRENT_TIMESTAMP)

notes (text, nullable)

created_at (timestamptz, not null, default CURRENT_TIMESTAMP)

updated_at (timestamptz, not null, default CURRENT_TIMESTAMP)

created_by_user_id (integer, FK → users.id, nullable)

updated_by_user_id (integer, FK → users.id, nullable)

municipality_id (integer, FK → municipalities.id, not null)

reason (varchar, nullable) — hareket gerekçesi

requested_by (integer, FK → users.id, nullable)

approved_by (integer, FK → users.id, nullable)

status (integer, nullable) — hareket talebinin durumu (örn. pending/approved/rejected için kod)

İş kuralları:

Her hareket kaydı için asset_movements.municipality_id = assets.municipality_id olmalıdır.

Hareket onaylandığında ilgili varlık kaydının (assets)
department_id, location_id, assigned_user_id alanları güncellenir.

asset_documents

Amaç: Varlıkla ilgili fatura, fiş, sözleşme vb. doküman bilgilerinin tutulması.

id (PK, integer, serial, not null)

asset_id (integer, FK → assets.id, nullable)

document_type (text, not null) — örn. 'invoice', 'warranty' vb.

document_no (varchar, nullable)

fiscal_year (integer, nullable)

issue_date (date, nullable)

amount (numeric, nullable)

notes (text, nullable)

uploaded_by_user_id (integer, FK → users.id, nullable)

created_at (timestamptz, not null, default CURRENT_TIMESTAMP)

updated_at (timestamptz, not null, default CURRENT_TIMESTAMP)

municipality_id (integer, FK → municipalities.id, not null)

maintenance_requests

Amaç: Bakım / arıza talepleri.

id (PK, integer, not null)

municipality_id (integer, FK → municipalities.id, nullable)

asset_id (integer, FK → assets.id, nullable)

requester_id (integer, FK → users.id, nullable)

assigned_to_id (integer, FK → users.id, nullable)

title (varchar, nullable)

description (varchar, nullable)

priority (varchar, nullable) — örn. 'low' | 'medium' | 'high'

status (varchar, nullable) — örn. 'pending' | 'in_progress' | 'completed'

requested_at (date, nullable)

started_at (date, nullable)

completed_at (date, nullable)

created_at (date, nullable)

updated_at (date, nullable)

maintenance_logs

Amaç: Her bakım talebi için ilerleme logları.

id (PK, integer, not null)

maintenance_request_id (integer, FK → maintenance_requests.id, nullable)

log_date (date, nullable)

description (varchar, nullable)

created_by (integer, FK → users.id, nullable)

created_at (date, nullable)

updated_at (date, nullable)

logs

Amaç: Sistem logları (denetim izi / audit log).

id (PK, integer, serial, not null)

municipality_id (integer, FK → municipalities.id, nullable)

user_id (integer, FK → users.id, nullable)

level (varchar, not null, default 'INFO')

module (varchar, not null) — örn. 'auth', 'assets', 'maintenance'

action (varchar, nullable) — örn. 'LOGIN_SUCCESS', 'ASSET_CREATE'

message (text, not null)

context (jsonb, nullable) — ek detaylar (payload, id’ler vb.)

ip_address (varchar, nullable)

user_agent (varchar, nullable)

created_at (timestamptz, nullable, default CURRENT_TIMESTAMP)

İş kuralları:

Kritik işlemler (login, asset create/update/delete, movement approve/reject vb.) mutlaka loglanır.

Log sorgularında da municipality_id filtresi uygulanarak ilgili belediyenin logları gösterilir.

Genel İş Kuralları (Özet)

Çoklu-tenant mantığı:
Tüm sorgularda:

WHERE <table>.municipality_id = req.user.municipality_id

Yetkilendirme:
users.role_id ve roller üzerinden:

superadmin → tüm belediyeleri görebilir,

admin → kendi belediyesi ile sınırlı,

user → kendi belediyesi + sınırlı modüller.

Soft delete (planlıysa):

assets için is_deleted kullanımı planlanıyorsa listelerde is_deleted = false filtrelenmelidir.

Hareket ve bakım kayıtları:

asset_movements.asset_id her zaman assets ile tutarlı olmalı,

maintenance_requests.asset_id de aynı şekilde ilgili varlıkla ilişkilidir.

Audit:

created_by, updated_by, created_at, updated_at alanları mümkün olan her tabloda doldurulmalıdır.