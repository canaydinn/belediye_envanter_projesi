// api/src/controllers/maintenance.controller.js
const knex = require('../config/knex');

const TABLE = 'maintenance_requests';

const ALLOWED_STATUS = new Set(['open', 'planned', 'in_progress', 'completed', 'cancelled']);
const ALLOWED_PRIORITY = new Set(['low', 'medium', 'high', 'critical']);

const toInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};

const normalizeStatus = (v) => (v ? String(v).trim().toLowerCase() : null);
const normalizePriority = (v) => (v ? String(v).trim().toLowerCase() : null);

const ensureTenant = (req, res) => {
  const municipalityId = req.tenantMunicipalityId;
  if (!municipalityId) {
    res.status(403).json({ message: 'Belediye kapsamı bulunamadı' });
    return null;
  }
  return municipalityId;
};

// POST /api/maintenance
exports.createTicket = async (req, res) => {
  try {
    const municipalityId = ensureTenant(req, res);
    if (!municipalityId) return;

    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ message: 'Oturum bulunamadı' });

    const {
      asset_id,
      title,
      description,
      priority,
      status,
      due_date,
      assigned_to_user_id,
    } = req.body || {};

    const normalizedTitle = (title || '').trim();
    if (!normalizedTitle) {
      return res.status(400).json({ message: 'Başlık (title) zorunludur' });
    }

    const assetId = toInt(asset_id);
    if (!assetId) {
      return res.status(400).json({ message: 'Geçerli asset_id zorunludur' });
    }

    // Varlık bu belediyeye mi ait?
    const asset = await knex('assets')
      .select('id')
      .where({ id: assetId, municipality_id: municipalityId })
      .first();

    if (!asset) {
      return res.status(400).json({ message: 'Varlık bulunamadı veya bu belediyeye ait değil' });
    }

    const p = normalizePriority(priority) || 'medium';
    if (!ALLOWED_PRIORITY.has(p)) {
      return res.status(400).json({ message: 'Geçersiz öncelik (priority)' });
    }

    const s = normalizeStatus(status) || 'open';
    if (!ALLOWED_STATUS.has(s)) {
      return res.status(400).json({ message: 'Geçersiz durum (status)' });
    }

    const assignedTo = assigned_to_user_id ? toInt(assigned_to_user_id) : null;
    if (assignedTo) {
      const assignee = await knex('users')
        .select('id')
        .where({ id: assignedTo, municipality_id: municipalityId, is_active: true })
        .first();

      if (!assignee) {
        return res.status(400).json({ message: 'Atanan kullanıcı bu belediyeye ait değil veya pasif' });
      }
    }

    const [created] = await knex(TABLE)
      .insert({
        municipality_id: municipalityId,
        asset_id: assetId,
        title: normalizedTitle,
        description: (description || '').trim() || null,
        priority: p,
        status: s,
        due_date: due_date || null,
        assigned_to_user_id: assignedTo,
        created_by_user_id: currentUserId,
        updated_by_user_id: currentUserId,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return res.status(201).json(created);
  } catch (err) {
    console.error('maintenance.createTicket hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// GET /api/maintenance?status=&priority=&departmentId=&page=&limit=&search=
exports.listTickets = async (req, res) => {
  try {
    const municipalityId = ensureTenant(req, res);
    if (!municipalityId) return;

    const {
      status,
      priority,
      departmentId,
      page = 1,
      limit = 20,
      search,
    } = req.query || {};

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const q = knex(`${TABLE} as mr`)
      .leftJoin('assets as a', 'mr.asset_id', 'a.id')
      .leftJoin('departments as d', 'a.department_id', 'd.id')
      .leftJoin('users as u', 'mr.assigned_to_user_id', 'u.id')
      .where('mr.municipality_id', municipalityId)
      .select(
        'mr.id',
        'mr.asset_id',
        'a.asset_code',
        'a.name as asset_name',
        'd.id as department_id',
        'd.name as department_name',
        'mr.title',
        'mr.description',
        'mr.status',
        'mr.priority',
        'mr.due_date',
        'mr.assigned_to_user_id',
        'u.full_name as assigned_to_name',
        'mr.completed_at',
        'mr.created_at',
        'mr.updated_at'
      );

    const s = normalizeStatus(status);
    if (s) {
      if (!ALLOWED_STATUS.has(s)) return res.status(400).json({ message: 'Geçersiz status filtresi' });
      q.andWhere('mr.status', s);
    }

    const p = normalizePriority(priority);
    if (p) {
      if (!ALLOWED_PRIORITY.has(p)) return res.status(400).json({ message: 'Geçersiz priority filtresi' });
      q.andWhere('mr.priority', p);
    }

    const deptId = departmentId ? toInt(departmentId) : null;
    if (deptId) {
      q.andWhere('a.department_id', deptId);
    }

    const term = (search || '').trim();
    if (term) {
      q.andWhere((builder) => {
        builder
          .whereILike('mr.title', `%${term}%`)
          .orWhereILike('mr.description', `%${term}%`)
          .orWhereILike('a.asset_code', `%${term}%`)
          .orWhereILike('a.name', `%${term}%`);
      });
    }

    const countQuery = q.clone().clearSelect().clearOrder().countDistinct({ total: 'mr.id' }).first();

    const dataQuery = q
      .orderBy('mr.created_at', 'desc')
      .limit(limitNum)
      .offset(offset);

    const [countRow, data] = await Promise.all([countQuery, dataQuery]);

    const total = Number(countRow?.total || 0);

    return res.json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
      },
    });
  } catch (err) {
    console.error('maintenance.listTickets hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// GET /api/maintenance/:id
exports.getTicketById = async (req, res) => {
  try {
    const municipalityId = ensureTenant(req, res);
    if (!municipalityId) return;

    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Geçersiz id' });

    const ticket = await knex(`${TABLE} as mr`)
      .leftJoin('assets as a', 'mr.asset_id', 'a.id')
      .leftJoin('users as u', 'mr.assigned_to_user_id', 'u.id')
      .where('mr.id', id)
      .andWhere('mr.municipality_id', municipalityId)
      .select(
        'mr.*',
        'a.asset_code',
        'a.name as asset_name',
        knex.raw("COALESCE(u.full_name, u.username) as assigned_to_name")
      )
      .first();

    if (!ticket) return res.status(404).json({ message: 'Kayıt bulunamadı' });

    return res.json(ticket);
  } catch (err) {
    console.error('maintenance.getTicketById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// PATCH /api/maintenance/:id
exports.updateTicket = async (req, res) => {
  try {
    const municipalityId = ensureTenant(req, res);
    if (!municipalityId) return;

    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ message: 'Oturum bulunamadı' });

    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Geçersiz id' });

    const existing = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) return res.status(404).json({ message: 'Kayıt bulunamadı' });

    // Tamamlanan ticket’ın “kritik alanları” değişmesin (policy)
    if (existing.status === 'completed') {
      return res.status(400).json({ message: 'Tamamlanmış kayıt güncellenemez' });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      const t = String(req.body.title || '').trim();
      if (!t) return res.status(400).json({ message: 'title boş olamaz' });
      updates.title = t;
    }

    if (req.body.description !== undefined) {
      updates.description = String(req.body.description || '').trim() || null;
    }

    if (req.body.priority !== undefined) {
      const p = normalizePriority(req.body.priority);
      if (!p || !ALLOWED_PRIORITY.has(p)) return res.status(400).json({ message: 'Geçersiz priority' });
      updates.priority = p;
    }

    if (req.body.status !== undefined) {
      const s = normalizeStatus(req.body.status);
      if (!s || !ALLOWED_STATUS.has(s)) return res.status(400).json({ message: 'Geçersiz status' });
      updates.status = s;
    }

    if (req.body.due_date !== undefined) {
      updates.due_date = req.body.due_date || null;
    }

    if (req.body.assigned_to_user_id !== undefined) {
      const assignedTo = req.body.assigned_to_user_id ? toInt(req.body.assigned_to_user_id) : null;
      if (assignedTo) {
        const assignee = await knex('users')
          .select('id')
          .where({ id: assignedTo, municipality_id: municipalityId, is_active: true })
          .first();

        if (!assignee) {
          return res.status(400).json({ message: 'Atanan kullanıcı bu belediyeye ait değil veya pasif' });
        }
      }
      updates.assigned_to_user_id = assignedTo;
    }

    // asset değişimi istenirse: cross-tenant kontrolü
    if (req.body.asset_id !== undefined) {
      const assetId = req.body.asset_id ? toInt(req.body.asset_id) : null;
      if (!assetId) return res.status(400).json({ message: 'Geçerli asset_id zorunludur' });

      const asset = await knex('assets')
        .select('id')
        .where({ id: assetId, municipality_id: municipalityId })
        .first();

      if (!asset) {
        return res.status(400).json({ message: 'Varlık bulunamadı veya bu belediyeye ait değil' });
      }
      updates.asset_id = assetId;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek alan bulunamadı' });
    }

    updates.updated_by_user_id = currentUserId;
    updates.updated_at = knex.fn.now();

    const [updated] = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .update(updates)
      .returning('*');

    return res.json(updated);
  } catch (err) {
    console.error('maintenance.updateTicket hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// POST /api/maintenance/:id/complete
exports.completeTicket = async (req, res) => {
  try {
    const municipalityId = ensureTenant(req, res);
    if (!municipalityId) return;

    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ message: 'Oturum bulunamadı' });

    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Geçersiz id' });

    const existing = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) return res.status(404).json({ message: 'Kayıt bulunamadı' });

    if (existing.status === 'completed') {
      return res.status(400).json({ message: 'Kayıt zaten tamamlanmış' });
    }

    const resolution_note = req.body?.resolution_note ? String(req.body.resolution_note).trim() : null;

    const [updated] = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .update({
        status: 'completed',
        completed_at: knex.fn.now(),
        completed_by_user_id: currentUserId,
        resolution_note,
        updated_by_user_id: currentUserId,
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return res.json(updated);
  } catch (err) {
    console.error('maintenance.completeTicket hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// DELETE /api/maintenance/:id
exports.deleteTicket = async (req, res) => {
  try {
    const municipalityId = ensureTenant(req, res);
    if (!municipalityId) return;

    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: 'Geçersiz id' });

    const existing = await knex(TABLE)
      .where({ id, municipality_id: municipalityId })
      .first();

    if (!existing) return res.status(404).json({ message: 'Kayıt bulunamadı' });

    if (existing.status === 'completed') {
      return res.status(400).json({ message: 'Tamamlanmış bakım kayıtları silinemez' });
    }

    await knex(TABLE).where({ id, municipality_id: municipalityId }).del();

    return res.status(204).send();
  } catch (err) {
    console.error('maintenance.deleteTicket hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
