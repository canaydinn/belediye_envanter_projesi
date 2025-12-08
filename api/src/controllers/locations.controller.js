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
    
    const { municipality_id } = req.user || {};
    const { type, department_id, is_active } = req.query;

    const query = knex('locations')
      .select(LOCATION_COLUMNS)
      .modify((qb) => {
        if (municipality_id) {
          qb.where('municipality_id', municipality_id);
        }
      });

    if (type) query.andWhere('type', type);
    if (department_id) query.andWhere('department_id', department_id);
    if (is_active !== undefined) {
      const isActiveValue = ['1', 'true', 1, true].includes(is_active);
      query.andWhere('is_active', isActiveValue);
    }

    const data = await query.orderBy('name', 'asc');

    return res.json({ data });
  } catch (err) {
    console.error('LIST_LOCATIONS_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon listesi alınırken bir hata oluştu.'
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
    const { id } = req.params;
    const { municipality_id } = req.user || {};

    const loc = await knex('locations')
      .select(LOCATION_COLUMNS)
      .where({ id })
      .modify((qb) => {
        if (municipality_id) {
          qb.andWhere('municipality_id', municipality_id);
        }
      })
      .first();

    if (!loc) {
      return res.status(404).json({
        error: 'LOCATION_NOT_FOUND',
        message: 'Lokasyon bulunamadı.'
      });
    }

    return res.json(loc);
  } catch (err) {
    console.error('GET_LOCATION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon bilgisi alınırken bir hata oluştu.'
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
