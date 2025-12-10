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
    const { municipality_id } = req.user || {};
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

    
    if (!municipality_id) {
      return res.status(400).json({ message: 'municipality_id bulunamadı' });
    }

    
    if (!name || !code) {
      return res.status(400).json({ message: 'name ve code alanları zorunludur' });
    }

    const [existingCode] = await knex('locations')
      .where({ municipality_id, code })
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
        municipality_id,
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
    console.log('LIST_LOCATIONS req.user:', req.user); // geçici debug

    const municipalityId = req.user?.municipality_id;
    const { type, department_id, is_active } = req.query;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
    }

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
exports.getLocationStats = async (req, res) => {
  try {
        console.log('getLocationStats req.user:', req.user); // 🔍 GEÇİCİ LOG

    const municipalityId = req.user?.municipality_id;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
    }

    // Lokasyon tipi kodları (form ile uyumlu)
    // 1: Ofis, 2: Depo, 3: Saha Ofisi, 4: Bina
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
    const { municipality_id } = req.user || {};

    if (!municipality_id) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
    }

    const rows = await knex('locations')
      .where({ municipality_id })
      .select('type')
      .count({ count: 'id' })
      .groupBy('type');

    const distribution = {
      building: 0,
      warehouse: 0,
      open_area: 0,
      site_office: 0,
      other: 0,
    };

    const typeMap = {
      building: ['bina', 'building'],
      warehouse: ['depo', 'warehouse'],
      open_area: ['acik alan', 'açık alan', 'open_area', 'open area'],
      site_office: ['saha ofisi', 'site_office', 'site office'],
    };

    const normalizeKey = (value) => {
      const normalized = (value || '').toString().trim().toLowerCase();
      const matchedEntry = Object.entries(typeMap).find(([, aliases]) =>
        aliases.includes(normalized)
      );

      return matchedEntry ? matchedEntry[0] : 'other';
    };

    rows.forEach((row) => {
      const key = normalizeKey(row?.type);
      const count = Number(row?.count ?? row?.total ?? 0);
      distribution[key] += Number.isFinite(count) ? count : 0;
    });

    const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);

    return res.json({
      municipality_id,
      distribution,
      total,
    });
  } catch (err) {
    console.error('LOCATION_TYPE_DISTRIBUTION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon tipi dağılımı alınırken bir hata oluştu.'
    });
  }
};
exports.getLocationTree = async (req, res) => {
  try {
    
    const { municipality_id } = req.user || {};
    const all = await knex('locations')
      .select(LOCATION_COLUMNS)
      .modify((qb) => {
        if (municipality_id) {
          qb.where('municipality_id', municipality_id);
        }
      });

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
    const municipalityId = req.user?.municipality_id;
    const idParam = req.params.id;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
    }

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
    const { id } = req.params;
   
    const { municipality_id } = req.user || {};
    const updates = {};

    [
      'name',
      'code',
      'address',
      'department_id',
      'is_active',
      'type',
      'latitude',
      'longitude',
    ].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });


    const existing = await knex('locations')
      .where({ id })
      .modify((qb) => {
        if (municipality_id) {
          qb.andWhere('municipality_id', municipality_id);
        }
      })
      .first();

    
    if (!existing) {
      return res.status(404).json({
        error: 'LOCATION_NOT_FOUND',
        message: 'Lokasyon bulunamadı.'
      });
    }

    const [updated] = await knex('locations')
      .where({ id })
      .update(updates)
      .returning(LOCATION_COLUMNS);

    return res.json(updated);
  } catch (err) {
    console.error('UPDATE_LOCATION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon güncellenirken bir hata oluştu.'
    });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { municipality_id } = req.user || {};

    const existing = await knex('locations')
      .where({ id })
      .modify((qb) => {
        if (municipality_id) {
          qb.andWhere('municipality_id', municipality_id);
        }
      })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'LOCATION_NOT_FOUND',
        message: 'Lokasyon bulunamadı.'
      });
    }

    // TODO: Çocuk lokasyonları veya envanter bağlı mı kontrol edilebilir.
    await knex('locations')
      .where({ id })
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
