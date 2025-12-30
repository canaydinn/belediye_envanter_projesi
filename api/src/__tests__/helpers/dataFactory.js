/**
 * Test Data Factory
 * 
 * Entegrasyon testleri için test verisi oluşturma helper fonksiyonları.
 * Bu fonksiyonlar gerçek veritabanına veri ekler ve ilişkili kayıtları otomatik oluşturur.
 */

const bcrypt = require('bcryptjs');

/**
 * Test belediyesi oluşturur
 */
const createTestMunicipality = async (db, data = {}) => {
  const timestamp = Date.now();
  const [municipality] = await db('municipalities').insert({
    code: data.code || `TEST-${timestamp}`,
    name: data.name || 'Test Belediyesi',
    province: data.province || 'Test İl',
    district: data.district || 'Test İlçe',
    contact_email: data.contact_email || data.email || `test-${timestamp}@belediye.gov.tr`,
    contact_phone: data.contact_phone || null,
    tax_number: data.tax_number || null,
    address: data.address || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
    ...data,
  }).returning('*');
  
  return municipality;
};

/**
 * Test role oluşturur veya mevcut role'ü döndürür
 */
const createTestRole = async (db, data = {}) => {
  // Önce mevcut role'ü kontrol et
  if (data.id) {
    const existing = await db('roles').where({ id: data.id }).first();
    if (existing) return existing;
  }
  
  // Yeni role oluştur
  const [role] = await db('roles').insert({
    id: data.id || undefined,
    name: data.name || 'test_role',
    description: data.description || 'Test role',
  }).returning('*');
  
  return role;
};

/**
 * Test kullanıcısı oluşturur
 */
const createTestUser = async (db, municipalityId, roleId, data = {}) => {
  // Role'ün var olduğundan emin ol
  let role = await db('roles').where({ id: roleId }).first();
  if (!role) {
    // Role yoksa oluştur
    const roleNames = {
      1: 'admin',
      2: 'tasinir_kayit',
      3: 'kullanici',
    };
    role = await createTestRole(db, { 
      id: roleId, 
      name: roleNames[roleId] || 'test_role',
      description: 'Test role',
    });
  }
  
  const passwordHash = data.password_hash || await bcrypt.hash('test123', 10);
  
  const [user] = await db('users').insert({
    username: data.username || `test_user_${Date.now()}`,
    email: data.email || `test_${Date.now()}@example.com`,
    full_name: data.full_name || 'Test User',
    password_hash: passwordHash,
    role_id: roleId,
    municipality_id: municipalityId,
    is_active: data.is_active !== undefined ? data.is_active : true,
    ...data,
  }).returning('*');
  
  return user;
};

/**
 * Test kategori oluşturur
 */
const createTestCategory = async (db, municipalityId, data = {}) => {
  const [category] = await db('asset_categories').insert({
    code: data.code || `CAT-${Date.now()}`,
    name: data.name || 'Test Kategori',
    description: data.description || null,
    municipality_id: municipalityId,
    ...data,
  }).returning('*');
  
  return category;
};

/**
 * Test departman oluşturur
 */
const createTestDepartment = async (db, municipalityId, data = {}) => {
  const [department] = await db('departments').insert({
    name: data.name || 'Test Departmanı',
    code: data.code || `DEPT-${Date.now()}`,
    municipality_id: municipalityId,
    is_active: data.is_active !== undefined ? data.is_active : true,
    ...data,
  }).returning('*');
  
  return department;
};

/**
 * Test lokasyon oluşturur
 */
const createTestLocation = async (db, municipalityId, data = {}) => {
  const [location] = await db('locations').insert({
    name: data.name || 'Test Lokasyon',
    code: data.code || `LOC-${Date.now()}`,
    municipality_id: municipalityId,
    is_active: data.is_active !== undefined ? data.is_active : true,
    ...data,
  }).returning('*');
  
  return location;
};

/**
 * Test asset oluşturur (tüm bağımlı verileri otomatik oluşturur)
 */
const createTestAsset = async (db, municipalityId, data = {}) => {
  // Bağımlı verileri oluştur
  const category = data.category_id 
    ? await db('asset_categories').where({ id: data.category_id }).first()
    : await createTestCategory(db, municipalityId);
  
  const department = data.department_id
    ? await db('departments').where({ id: data.department_id }).first()
    : await createTestDepartment(db, municipalityId);
  
  const location = data.location_id
    ? await db('locations').where({ id: data.location_id }).first()
    : await createTestLocation(db, municipalityId);
  
  // Asset oluştur
  const assetData = {
    name: data.name || 'Test Asset',
    description: data.description || 'Test asset description',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
    assigned_user_id: data.assigned_user_id || null,
    purchase_price: data.purchase_price || null,
    purchase_date: data.purchase_date || null,
    serial_number: data.serial_number || null,
    status: data.status || 'active',
    is_qr_tagged: data.is_qr_tagged || false,
    quantity: data.quantity || 1,
    unit: data.unit || 'Adet',
    tasinir_code: data.tasinir_code || null,
    asset_type: data.asset_type || 'demirbas',
    municipality_id: municipalityId,
    ...data,
  };
  
  // Transaction içinde asset_code oluştur (controller gibi)
  const updatedAsset = await db.transaction(async (trx) => {
    // 1) Geçici asset_code ile insert (unique constraint için)
    const tempAssetCode = `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [asset] = await trx('assets').insert({
      ...assetData,
      asset_code: tempAssetCode, // Geçici kod, hemen güncellenecek
    }).returning('*');
    
    // 2) Controller'ın yaptığı gibi asset_code oluştur
    const dateForYear = assetData.purchase_date ? new Date(assetData.purchase_date) : new Date();
    const year = String(dateForYear.getFullYear()).slice(-2);
    const paddedId = String(asset.id).padStart(6, '0');
    const generatedAssetCode = `AS-${municipalityId}-${year}-${paddedId}`;
    
    // 3) asset_code'u güncelle
    const [updated] = await trx('assets')
      .where({ id: asset.id })
      .update({ 
        asset_code: generatedAssetCode,
        qrcode: data.qrcode || generatedAssetCode,
      })
      .returning('*');
    
    return updated;
  });
  
  return updatedAsset;
};

/**
 * Test asset movement oluşturur
 */
const createTestAssetMovement = async (db, municipalityId, data = {}) => {
  // Asset oluştur (eğer verilmemişse)
  const asset = data.asset_id
    ? await db('assets').where({ id: data.asset_id }).first()
    : await createTestAsset(db, municipalityId);
  
  // Performed by user oluştur (eğer verilmemişse)
  const performedByUser = data.performed_by_user_id
    ? await db('users').where({ id: data.performed_by_user_id }).first()
    : await createTestUser(db, municipalityId, 3); // Default: USER role
  
  const movementData = {
    asset_id: asset.id,
    movement_type: data.movement_type || 'transfer',
    movement_date: data.movement_date || new Date(),
    from_department_id: data.from_department_id || asset.department_id || null,
    to_department_id: data.to_department_id || null,
    from_location_id: data.from_location_id || asset.location_id || null,
    to_location_id: data.to_location_id || null,
    to_user_id: data.to_user_id || null,
    performed_by_user_id: performedByUser.id,
    municipality_id: municipalityId,
    notes: data.notes || null,
    reason: data.reason || null,
    requested_by: data.requested_by || null,
    approved_by: data.approved_by || null,
    status: data.status || null,
    ...data,
  };
  
  const [movement] = await db('asset_movements')
    .insert(movementData)
    .returning('*');
  
  return movement;
};

/**
 * Test maintenance ticket oluşturur
 */
const createTestMaintenanceTicket = async (db, municipalityId, data = {}) => {
  // Asset oluştur (eğer verilmemişse)
  const asset = data.asset_id
    ? await db('assets').where({ id: data.asset_id }).first()
    : await createTestAsset(db, municipalityId);
  
  // Created by user oluştur (eğer verilmemişse)
  const createdByUser = data.created_by_user_id
    ? await db('users').where({ id: data.created_by_user_id }).first()
    : await createTestUser(db, municipalityId, 2); // Default: ADMIN role
  
  const ticketData = {
    municipality_id: municipalityId,
    asset_id: asset.id,
    title: data.title || 'Test Maintenance Ticket',
    description: data.description || 'Test maintenance description',
    priority: data.priority || 'medium',
    status: data.status || 'open',
    due_date: data.due_date || null,
    assigned_to_user_id: data.assigned_to_user_id || null,
    created_by_user_id: createdByUser.id,
    updated_by_user_id: createdByUser.id,
    requested_at: data.requested_at || new Date(),
    started_at: data.started_at || null,
    ...data,
  };
  
  // Önce kolonların varlığını kontrol et ve sadece mevcut kolonları kullan
  try {
    const [ticket] = await db('maintenance_requests')
      .insert(ticketData)
      .returning('*');
    
    return Array.isArray(ticket) ? ticket[0] : ticket;
  } catch (err) {
    // Eğer assigned_to_user_id kolonu yoksa, assigned_to_id kullan
    if (err.message && err.message.includes('assigned_to_user_id')) {
      const { assigned_to_user_id, ...restData } = ticketData;
      const fallbackData = {
        ...restData,
        assigned_to_id: assigned_to_user_id,
      };
      const [ticket] = await db('maintenance_requests')
        .insert(fallbackData)
        .returning('*');
      
      return Array.isArray(ticket) ? ticket[0] : ticket;
    }
    throw err;
  }
};

/**
 * Tam test ortamı oluşturur (municipality, role, user, category, department, location)
 * @param {Object} options - Seçenekler
 * @param {number} options.userRoleId - Kullanıcı için role ID (default: 3 = USER)
 */
const createTestEnvironment = async (db, options = {}) => {
  const municipality = await createTestMunicipality(db);
  
  // Role oluştur veya mevcut role'ü kullan
  const userRoleId = options.userRoleId || 3; // Default: USER role
  let role = await db('roles').where({ id: userRoleId }).first();
  if (!role) {
    // Role yoksa oluştur
    const roleNames = {
      1: 'admin',
      2: 'tasinir_kayit',
      3: 'kullanici',
    };
    role = await createTestRole(db, { 
      id: userRoleId, 
      name: roleNames[userRoleId] || 'test_role',
      description: 'Test role',
    });
  }
  
  const user = await createTestUser(db, municipality.id, role.id);
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  return {
    municipality,
    role,
    user,
    category,
    department,
    location,
  };
};

module.exports = {
  createTestMunicipality,
  createTestRole,
  createTestUser,
  createTestCategory,
  createTestDepartment,
  createTestLocation,
  createTestAsset,
  createTestAssetMovement,
  createTestMaintenanceTicket,
  createTestEnvironment,
};

