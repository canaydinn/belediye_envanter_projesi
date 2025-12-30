// controllers/locations.controller.js
//const Location = require('../models/Location');
const knex = require('../config/knex');

const LOCATION_COLUMNS = [
  'id',
  'code',
  'name',
  'address',
  'department_id',
  'is_active',
  'created_at',
  'updated_at',
  'municipality_id',
  'type',
  'latitude',
  'longitude',
];
const parseCount = (row) => Number(row?.total ?? row?.count ?? 0);

exports.createLocation = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const {
      name,
      code,
      address,
      department_id,
      is_active,
      type,
      latitude,
      longitude,
    } = req.body;
   
    if (!name || !code) {
      return res.status(400).json({ message: 'name ve code alanları zorunludur' });
    }
if (department_id) {
      const dept = await knex('departments')
        .where({ id: department_id, municipality_id: municipalityId })
        .first();

      if (!dept) {
        return res
          .status(400)
          .json({ message: 'Departman bu belediyeye ait değil' });
      }
    }
    const [existingCode] = await knex('locations')
      .where({ municipality_id:municipalityId, code })
      .limit(1);

    if (existingCode) {
      return res.status(400).json({ message: 'Bu kod ile kayıt mevcut' });
    }

    const [inserted] = await knex('locations')
      .insert({
        name,
        code,
        address: address || null,
        department_id: department_id || null,
        is_active: is_active ?? true,
        municipality_id: municipalityId,
        type: type || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      })
      .returning(LOCATION_COLUMNS);

    return res.status(201).json(inserted);
  } catch (err) {
    console.error('CREATE_LOCATION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon oluşturulurken bir hata oluştu.'
    });
  }
};

exports.listLocations = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const { type, department_id, is_active } = req.query;

    

    const query = knex('locations')
      .select(LOCATION_COLUMNS)
      .where('municipality_id', municipalityId);

    // type integer (1: Ofis, 2: Depo, 3: Saha Ofisi, 4: Bina)
    if (typeof type !== 'undefined' && type !== '') {
      const typeInt = Number(type);
      if (Number.isInteger(typeInt)) {
        query.andWhere('type', typeInt);
      }
    }

    if (typeof department_id !== 'undefined' && department_id !== '') {
      const deptId = Number(department_id);
      if (Number.isInteger(deptId)) {
        query.andWhere('department_id', deptId);
      }
    }

    if (typeof is_active !== 'undefined' && is_active !== '') {
  const normalized = String(is_active).toLowerCase().trim();

  if (['1', 'true', 'yes', 'aktif', 'active'].includes(normalized)) {
    query.andWhere('is_active', true);
  } else if (['0', 'false', 'no', 'pasif', 'passive'].includes(normalized)) {
    query.andWhere('is_active', false);
  }
}

    const data = await query.orderBy('name', 'asc');

    console.log(
      'LIST_LOCATIONS municipalityId:',
      municipalityId,
      'rowCount:',
      data.length
    );

    return res.json({
      data,
      total: data.length,
    });
  } catch (err) {
    console.error('LIST_LOCATIONS_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon listesi alınırken bir hata oluştu.',
    });
  }
};
// Lokasyonları filtreli listeleme (name/type/department/is_active)
// + department_name
// + asset_count (lokasyondaki varlık sayısı)
exports.listLocationsFiltered = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId ?? req.user?.municipality_id;
    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
    }

    // query params
    const {
      name,            // lokasyon adı (like)
      type,            // 1/2/3/4
      department_id,   // id
      is_active,       // true/false/1/0
      limit = 100,
      offset = 0,
      order_by = 'l.name',
      order_dir = 'asc',
    } = req.query;

    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    // is_active normalize
    let isActiveBool = undefined;
    if (typeof is_active !== 'undefined' && is_active !== '') {
      const normalized = String(is_active).toLowerCase().trim();
      if (['1', 'true', 'yes', 'aktif', 'active'].includes(normalized)) isActiveBool = true;
      if (['0', 'false', 'no', 'pasif', 'passive'].includes(normalized)) isActiveBool = false;
    }

    // type normalize
    let typeInt = undefined;
    if (typeof type !== 'undefined' && type !== '') {
      const parsed = Number(type);
      if (Number.isInteger(parsed)) typeInt = parsed;
    }

    // department normalize
    let deptInt = undefined;
    if (typeof department_id !== 'undefined' && department_id !== '') {
      const parsed = Number(department_id);
      if (Number.isInteger(parsed)) deptInt = parsed;
    }

    // ORDER whitelist (SQL injection önlemi)
    const ORDER_MAP = {
      name: 'l.name',
      code: 'l.code',
      type: 'l.type',
      status: 'l.is_active',
      department: 'd.name',
      asset_count: 'asset_count',
      created_at: 'l.created_at',
    };

    const orderCol = ORDER_MAP[String(order_by).toLowerCase()] || 'l.name';
    const orderDir = String(order_dir).toLowerCase() === 'desc' ? 'desc' : 'asc';

    // Base query
    const base = knex('locations as l')
      .leftJoin('departments as d', function () {
        this.on('d.id', '=', 'l.department_id')
          .andOn('d.municipality_id', '=', 'l.municipality_id');
      })
      .where('l.municipality_id', municipalityId);

    // Filters
    if (name && String(name).trim()) {
      base.andWhere('l.name', 'ilike', `%${String(name).trim()}%`);
    }

    if (typeof typeInt !== 'undefined') {
      base.andWhere('l.type', typeInt);
    }

    if (typeof deptInt !== 'undefined') {
      base.andWhere('l.department_id', deptInt);
    }

    if (typeof isActiveBool !== 'undefined') {
      base.andWhere('l.is_active', isActiveBool);
    }

    // Total count (pagination için)
    const totalRow = await base.clone().clearSelect().clearOrder().count({ total: 'l.id' }).first();
    const total = Number(totalRow?.total ?? 0);

    // Data query
    const rows = await base
      .clone()
      .select(
        'l.id',
        'l.code',
        'l.name',
        'l.type',
        'l.department_id',
        'd.name as department_name',
        'l.address',
        'l.is_active',
        'l.created_at',
        'l.updated_at',
        knex.raw(`(
          SELECT COUNT(*)::int
          FROM assets a
          WHERE a.location_id = l.id
        ) as asset_count`)
      )
      .orderBy(orderCol, orderDir)
      .limit(safeLimit)
      .offset(safeOffset);

    return res.json({
      data: rows,
      total,
      limit: safeLimit,
      offset: safeOffset,
    });
  } catch (err) {
    console.error('LIST_LOCATIONS_FILTERED_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyonlar filtrelenirken bir hata oluştu.',
    });
  }
};

exports.getLocationStats = async (req, res) => {
  try {
    // Lokasyon tipi kodları (form ile uyumlu)
    // 1: Ofis, 2: Depo, 3: Saha Ofisi, 4: Bina
    const municipalityId = req.tenantMunicipalityId;
    const LOCATION_TYPES = {
      OFFICE: 1,
      WAREHOUSE: 2,
      FIELD_OFFICE: 3,
      BUILDING: 4,
    };

    const [totalLocationsRow, activeLocationsRow, warehouseRow] = await Promise.all([
      // Toplam lokasyon
      knex('locations')
        .where({ municipality_id: municipalityId })
        .count({ total: 'id' })
        .first(),

      // Aktif lokasyon
      knex('locations')
        .where({ municipality_id: municipalityId, is_active: true })
        .count({ total: 'id' })
        .first(),

      // Depo sayısı (type = 2)
      knex('locations')
        .where({ municipality_id: municipalityId })
        .andWhere('type', LOCATION_TYPES.WAREHOUSE)
        .count({ total: 'id' })
        .first(),
    ]);

    // Envanter yoğun lokasyon
    const denseLocation = await knex('locations as l')
      .leftJoin('assets as a', 'a.location_id', 'l.id')
      .where('l.municipality_id', municipalityId)
      .groupBy('l.id', 'l.name')
      .select('l.id', 'l.name')
      .count('a.id as asset_count')
      .orderBy([
        { column: 'asset_count', order: 'desc' },
        { column: 'l.name', order: 'asc' },
      ])
      .first();

    return res.json({
      totals: {
        locations: parseCount(totalLocationsRow),
        active_locations: parseCount(activeLocationsRow),
        warehouses: parseCount(warehouseRow),
      },
      dense_location: denseLocation
        ? {
            id: denseLocation.id,
            name: denseLocation.name,
            asset_count: Number(denseLocation.asset_count) || 0,
          }
        : null,
    });
  } catch (err) {
    console.error('LOCATION_STATS_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon istatistikleri alınırken bir hata oluştu.',
    });
  }
};
exports.getLocationTypeDistribution = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId ?? req.user?.municipality_id;

    const rows = await knex('locations')
      .where({ municipality_id: municipalityId })
      .select('type')
      .count({ count: 'id' })
      .groupBy('type');

    const distribution = {
      office: 0,       // type=1
      warehouse: 0,    // type=2
      open_area: 0,    // type=3
      building: 0,     // type=4
      other: 0,        // diğer type'lar
    };

    rows.forEach((row) => {
      const t = Number(row?.type);
      const c = Number(row?.count ?? 0);

      if (t === 1) distribution.office += c;
      else if (t === 2) distribution.warehouse += c;
      else if (t === 3) distribution.open_area += c;
      else if (t === 4) distribution.building += c;
      else distribution.other += c;
    });

    const total = Object.values(distribution).reduce((s, v) => s + v, 0);

    return res.json({
      municipality_id: municipalityId,
      distribution,
      total,
    });
  } catch (err) {
    console.error('LOCATION_TYPE_DISTRIBUTION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon tipi dağılımı alınırken bir hata oluştu.',
    });
  }
};

exports.getLocationTree = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const all = await knex('locations')
      .select(LOCATION_COLUMNS)
      .where('municipality_id', municipalityId);
    // Ağaç mantığında parentId olmadığı için düz liste döndürülür
    return res.json({ data: all });
  } catch (err) {
    console.error('LOCATION_TREE_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon listesi alınırken bir hata oluştu.'
    });
  }
};

exports.getLocationById = async (req, res) => {
  try {
     const municipalityId = req.tenantMunicipalityId;
    const idParam = req.params.id;

   
    const locationId = Number(idParam);
    if (!Number.isInteger(locationId)) {
      return res.status(400).json({ message: 'Geçersiz lokasyon ID' });
    }

    const location = await knex('locations')
      .select(
        'id',
        'code',
        'name',
        'address',
        'department_id',
        'is_active',
        'created_at',
        'updated_at',
        'municipality_id',
        'type',
        'latitude',
        'longitude'
      )
      .where({ id: locationId, municipality_id: municipalityId })
      .first();

    if (!location) {
      return res.status(404).json({ message: 'Lokasyon bulunamadı' });
    }

    return res.json(location);
  } catch (err) {
    console.error('GET_LOCATION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon alınırken bir hata oluştu.',
    });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz lokasyon ID' });
    }

    const updates = {};
    const allowedFields = [
      'name',
      'code',
      'address',
      'department_id',
      'is_active',
      'type',
      'latitude',
      'longitude',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek alan bulunamadı' });
    }

    const existing = await knex('locations')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'LOCATION_NOT_FOUND',
        message: 'Lokasyon bulunamadı.',
      });
    }

    // department_id verildiyse tenant doğrula
    if (updates.department_id) {
      const dept = await knex('departments')
        .where({ id: updates.department_id, municipality_id: municipalityId })
        .first();

      if (!dept) {
        return res.status(400).json({ message: 'Departman bu belediyeye ait değil' });
      }
    }

    // code güncelleniyorsa aynı belediye içinde çakışma kontrolü
    if (updates.code && updates.code !== existing.code) {
      const conflict = await knex('locations')
        .where({ municipality_id: municipalityId, code: updates.code })
        .andWhereNot({ id })
        .first();

      if (conflict) {
        return res.status(409).json({ message: 'Bu kod ile kayıt mevcut' });
      }
    }

    updates.updated_at = knex.fn.now();

    const [updated] = await knex('locations')
      .where({ id, municipality_id: municipalityId })
      .update(updates)
      .returning(LOCATION_COLUMNS);

    return res.json(updated);
  } catch (err) {
    console.error('UPDATE_LOCATION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon güncellenirken bir hata oluştu.',
    });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz lokasyon ID' });
    }
    const existing = await knex('locations')
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'LOCATION_NOT_FOUND',
        message: 'Lokasyon bulunamadı.'
      });
    }

    // TODO: Çocuk lokasyonları veya envanter bağlı mı kontrol edilebilir.
    await knex('locations')
    .where({ id, municipality_id: municipalityId })
    .del();

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_LOCATION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon silinirken bir hata oluştu.'
    });
  }
};
