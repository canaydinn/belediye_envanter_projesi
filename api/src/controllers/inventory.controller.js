// api/src/controllers/inventory.controller.js
const knex = require('../config/knex');

const TABLE = 'inventory_items';

// İzin verilen status değerleri (istersen genişlet)
const ALLOWED_STATUS = new Set(['active', 'in_maintenance', 'disposed', 'lost']);

// Basit yardımcılar
const toIntOrNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

const normalizeStr = (v) => (typeof v === 'string' ? v.trim() : v);

const assertDepartmentBelongsToTenant = async ({ municipalityId, departmentId }) => {
  if (!departmentId) return;
  const dept = await knex('departments')
    .where({ id: departmentId, municipality_id: municipalityId })
    .first();
  if (!dept) {
    const err = new Error('Departman bu belediyeye ait değil');
    err.status = 400;
    throw err;
  }
};

const assertLocationBelongsToTenant = async ({ municipalityId, locationId }) => {
  if (!locationId) return;
  const loc = await knex('locations')
    .where({ id: locationId, municipality_id: municipalityId })
    .first();
  if (!loc) {
    const err = new Error('Lokasyon bu belediyeye ait değil');
    err.status = 400;
    throw err;
  }
};

// POST /api/inventory
exports.createInventoryItem = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const name = normalizeStr(req.body?.name);
    const category = normalizeStr(req.body?.category);
    const serialNumber = normalizeStr(req.body?.serialNumber);
    const assetTag = normalizeStr(req.body?.assetTag);
    const departmentId = toIntOrNull(req.body?.departmentId);
    const locationId = toIntOrNull(req.body?.locationId);
    const purchaseDate = req.body?.purchaseDate || null;
    const statusRaw = normalizeStr(req.body?.status);
    const value = req.body?.value ?? null;
    const description = normalizeStr(req.body?.description);

    if (!name || !assetTag) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'En azından ad ve demirbaş kodu (assetTag) zorunludur.',
      });
    }

    const status = statusRaw || 'active';
    if (status && !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: `Geçersiz status. İzin verilenler: ${Array.from(ALLOWED_STATUS).join(', ')}`,
      });
    }

    // Tenant doğrulamaları
    await assertDepartmentBelongsToTenant({ municipalityId, departmentId });
    await assertLocationBelongsToTenant({ municipalityId, locationId });

    // Aynı asset_tag aynı belediyede var mı?
    const existing = await knex(TABLE)
      .where({ municipality_id: municipalityId, asset_tag: assetTag })
      .first();

    if (existing) {
      return res.status(409).json({
        error: 'VALIDATION_ERROR',
        message: 'Bu demirbaş kodu (assetTag) bu belediyede zaten kullanılıyor.',
      });
    }

    const [created] = await knex(TABLE)
      .insert({
        municipality_id: municipalityId,
        name,
        category: category || null,
        serial_number: serialNumber || null,
        asset_tag: assetTag,
        department_id: departmentId,
        location_id: locationId,
        purchase_date: purchaseDate,
        status,
        value,
        description: description || null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return res.status(201).json(created);
  } catch (err) {
    const status = err.status || 500;
    console.error('CREATE_INVENTORY_ERROR', err);
    return res.status(status).json({
      error: status === 500 ? 'INTERNAL_SERVER_ERROR' : 'VALIDATION_ERROR',
      message: err.message || 'Envanter eklenirken bir hata oluştu.',
    });
  }
};

// GET /api/inventory?departmentId=&locationId=&status=&search=&page=&limit=
exports.listInventory = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const departmentId = toIntOrNull(req.query?.departmentId);
    const locationId = toIntOrNull(req.query?.locationId);
    const status = normalizeStr(req.query?.status);
    const search = normalizeStr(req.query?.search);

    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit || 10)));
    const offset = (page - 1) * limit;

    const base = knex(TABLE).where({ municipality_id: municipalityId });

    if (departmentId) base.andWhere('department_id', departmentId);
    if (locationId) base.andWhere('location_id', locationId);

    if (status) {
      base.andWhere('status', status);
    }

    if (search) {
      base.andWhere((qb) => {
        qb.whereILike('name', `%${search}%`)
          .orWhereILike('asset_tag', `%${search}%`)
          .orWhereILike('serial_number', `%${search}%`);
      });
    }

    const [rows, totalRow] = await Promise.all([
      base
        .clone()
        .select(
          'id',
          'municipality_id',
          'name',
          'category',
          'serial_number',
          'asset_tag',
          'department_id',
          'location_id',
          'purchase_date',
          'status',
          'value',
          'description',
          'created_at',
          'updated_at'
        )
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      base.clone().count({ total: 'id' }).first(),
    ]);

    const total = Number(totalRow?.total ?? 0);

    return res.json({
      data: rows,
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('LIST_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter listesi alınırken bir hata oluştu.',
    });
  }
};

// GET /api/inventory/:id
exports.getInventoryById = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const id = Number(req.params?.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz envanter ID' });
    }

    const item = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!item) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Envanter bulunamadı.',
      });
    }

    return res.json(item);
  } catch (err) {
    console.error('GET_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter bilgisi alınırken bir hata oluştu.',
    });
  }
};

// PATCH /api/inventory/:id
exports.updateInventory = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const id = Number(req.params?.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz envanter ID' });
    }

    const existing = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Envanter bulunamadı.',
      });
    }

    // İzinli alanlar (API tarafında camelCase alıp DB’de snake_case yazıyoruz)
    const updateData = {};

    if (req.body?.name !== undefined) updateData.name = normalizeStr(req.body.name);
    if (req.body?.category !== undefined) updateData.category = normalizeStr(req.body.category) || null;
    if (req.body?.serialNumber !== undefined)
      updateData.serial_number = normalizeStr(req.body.serialNumber) || null;

    if (req.body?.assetTag !== undefined) {
      const newTag = normalizeStr(req.body.assetTag);
      if (!newTag) {
        return res.status(400).json({ message: 'assetTag boş olamaz' });
      }

      // Çakışma kontrolü (aynı belediye içinde)
      const conflict = await knex(TABLE)
        .where({ municipality_id: municipalityId, asset_tag: newTag })
        .andWhereNot({ id })
        .first();

      if (conflict) {
        return res.status(409).json({
          message: 'Bu demirbaş kodu (assetTag) bu belediyede zaten kullanılıyor.',
        });
      }

      updateData.asset_tag = newTag;
    }

    if (req.body?.departmentId !== undefined) {
      const departmentId = toIntOrNull(req.body.departmentId);
      await assertDepartmentBelongsToTenant({ municipalityId, departmentId });
      updateData.department_id = departmentId;
    }

    if (req.body?.locationId !== undefined) {
      const locationId = toIntOrNull(req.body.locationId);
      await assertLocationBelongsToTenant({ municipalityId, locationId });
      updateData.location_id = locationId;
    }

    if (req.body?.purchaseDate !== undefined) updateData.purchase_date = req.body.purchaseDate || null;

    if (req.body?.status !== undefined) {
      const status = normalizeStr(req.body.status) || null;
      if (status && !ALLOWED_STATUS.has(status)) {
        return res.status(400).json({
          message: `Geçersiz status. İzin verilenler: ${Array.from(ALLOWED_STATUS).join(', ')}`,
        });
      }
      updateData.status = status;
    }

    if (req.body?.value !== undefined) updateData.value = req.body.value ?? null;
    if (req.body?.description !== undefined) updateData.description = normalizeStr(req.body.description) || null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek alan bulunamadı' });
    }

    updateData.updated_at = knex.fn.now();

    const [updated] = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .update(updateData)
      .returning('*');

    return res.json(updated);
  } catch (err) {
    const status = err.status || 500;
    console.error('UPDATE_INVENTORY_ERROR', err);
    return res.status(status).json({
      error: status === 500 ? 'INTERNAL_SERVER_ERROR' : 'VALIDATION_ERROR',
      message: err.message || 'Envanter güncellenirken bir hata oluştu.',
    });
  }
};

// DELETE /api/inventory/:id
exports.deleteInventory = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const id = Number(req.params?.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: 'Geçersiz envanter ID' });
    }

    const deletedCount = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .del();

    if (!deletedCount) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Envanter bulunamadı.',
      });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter silinirken bir hata oluştu.',
    });
  }
};
