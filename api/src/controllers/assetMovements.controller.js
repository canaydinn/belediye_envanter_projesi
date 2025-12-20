const knex = require('../config/knex');
const getCountFromRow = (row) => Number(row?.count) || 0;
// Ortak hareket sorgusu
const buildMovementQuery = (municipalityId) => {
  const query = knex('asset_movements as am')
    .leftJoin('assets as a', 'am.asset_id', 'a.id')
    .leftJoin('departments as fd', 'am.from_department_id', 'fd.id')
    .leftJoin('departments as td', 'am.to_department_id', 'td.id')
    .leftJoin('locations as fl', 'am.from_location_id', 'fl.id')
    .leftJoin('locations as tl', 'am.to_location_id', 'tl.id')
    .leftJoin('users as u', 'am.performed_by_user_id', 'u.id')
    .where('am.municipality_id', municipalityId)
    .select(
      'am.id',
      'am.movement_date',
      'am.movement_type',
      'am.notes',
      'a.id as asset_id',
      'a.name as asset_name',
      'a.asset_code',
      'fd.name as from_department_name',
      'td.name as to_department_name',
      'fl.name as from_location_name',
      'tl.name as to_location_name',
      'u.full_name as performer_name'
    )
    .orderBy('am.movement_date', 'desc');
  return query;
};
// GET /api/asset-movements
// Varlık hareketlerini filtreleyerek listeler
exports.listAssetMovements = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const {
      asset_code,
      movement_type,
      department_id,
      performed_by_user_id,
      start_date,
      end_date,
    } = req.query;

    const query = knex('asset_movements as am')
      .leftJoin('assets as a', 'am.asset_id', 'a.id')
      .leftJoin('departments as fd', 'am.from_department_id', 'fd.id')
      .leftJoin('departments as td', 'am.to_department_id', 'td.id')
      .leftJoin('locations as fl', 'am.from_location_id', 'fl.id')
      .leftJoin('locations as tl', 'am.to_location_id', 'tl.id')
      .leftJoin('users as pbu', 'am.performed_by_user_id', 'pbu.id')
      .where('am.municipality_id', municipalityId)
      .select(
        'am.id',
        'am.asset_id',
        'am.movement_type',
        'am.from_department_id',
        'am.to_department_id',
        'am.from_location_id',
        'am.to_location_id',
        'am.performed_by_user_id',
        'am.movement_date',
        'am.notes',
        'am.created_at',
        'am.updated_at',
        'a.asset_code',
        'a.name as asset_name',
        'fd.name as from_department_name',
        'td.name as to_department_name',
        'fl.name as from_location_name',
        'tl.name as to_location_name',
        'pbu.full_name as performer_name'
      )
      .orderBy('am.movement_date', 'desc');

    if (asset_code) {
      query.andWhere('a.asset_code', 'ilike', `%${asset_code}%`);
    }

    if (movement_type) {
      query.andWhere('am.movement_type', movement_type);
    }

    if (department_id) {
      query.andWhere(function () {
        this.where('am.from_department_id', department_id).orWhere('am.to_department_id', department_id);
      });
    }

    if (performed_by_user_id) {
      query.andWhere('am.performed_by_user_id', performed_by_user_id);
    }

    if (start_date && end_date) {
      query.andWhereBetween('am.movement_date', [start_date, end_date]);
    } else if (start_date) {
      query.andWhere('am.movement_date', '>=', start_date);
    } else if (end_date) {
      query.andWhere('am.movement_date', '<=', end_date);
    }

    const movements = await query;

    return res.json(movements);
  } catch (err) {
    console.error('assetMovements.listAssetMovements hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getMovementStats = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfToday.getDate() + 1);

    const [last30DaysRow] = await knex('asset_movements')
      .where('municipality_id', municipalityId)
      .andWhere('movement_date', '>=', thirtyDaysAgo)
      .count('id as count');

    const [todayRow] = await knex('asset_movements')
      .where('municipality_id', municipalityId)
      .andWhere('movement_date', '>=', startOfToday)
      .andWhere('movement_date', '<', startOfTomorrow)
      .count('id as count');

    const [maintenanceRow] = await knex('asset_movements')
      .where({ municipality_id:municipalityId, movement_type: 'maintenance' })
      .count('id as count');

    const [assignmentTransferRow] = await knex('asset_movements')
      .where('municipality_id', municipalityId)
      .whereIn('movement_type', ['assign', 'transfer'])
      .count('id as count');

    return res.json({
      last30DaysTotal: Number(last30DaysRow.count) || 0,
      todayTotal: Number(todayRow.count) || 0,
      maintenanceTotal: Number(maintenanceRow.count) || 0,
      assignmentTransferTotal: Number(assignmentTransferRow.count) || 0,
    });
  } catch (err) {
    console.error('assetMovements.getMovementStats hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getMovementTypeDistribution = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const movementCounts = await knex('asset_movements')
      .where('municipality_id', municipalityId)
      .groupBy('movement_type')
      .select('movement_type')
      .count('* as count');

    const totalMovements = movementCounts.reduce(
      (sum, row) => sum + Number(row.count || 0),
      0
    );

     const distribution = movementCounts
      .map((row) => {
        const count = Number(row.count || 0);
        const percentage =
          totalMovements === 0 ? 0 : Number(((count / totalMovements) * 100).toFixed(2));

        return {
          movement_type: row.movement_type || 'Bilinmiyor',
          count,
          percentage,
        };
      })
      .sort((a, b) => b.count - a.count || a.movement_type.localeCompare(b.movement_type));

   return res.status(200).json({
      totalMovements,
      distribution,
    });
  } catch (err) {
    console.error('assetMovements.getMovementTypeDistribution error:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getRecentAssetMovements = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const movements = await knex('asset_movements as am')
      .join('assets as a', 'am.asset_id', 'a.id')
      .leftJoin('departments as fd', 'am.from_department_id', 'fd.id')
      .leftJoin('departments as td', 'am.to_department_id', 'td.id')
      .leftJoin('locations as fl', 'am.from_location_id', 'fl.id')
      .leftJoin('locations as tl', 'am.to_location_id', 'tl.id')
      .leftJoin('users as u', 'am.performed_by_user_id', 'u.id')
      .where('am.municipality_id', municipalityId)
      .select(
        'am.id',
        'am.asset_id',
        'a.asset_code',
        'a.name as asset_name',
        'am.movement_type',
        'am.from_department_id',
        'fd.name as from_department_name',
        'am.to_department_id',
        'td.name as to_department_name',
        'am.from_location_id',
        'fl.name as from_location_name',
        'am.to_location_id',
        'tl.name as to_location_name',
        'am.performed_by_user_id',
        // 🔴 ÖNCEKİ HATA KAYNAĞI: first_name / last_name yok
        // knex.raw("COALESCE(u.first_name || ' ' || u.last_name, u.username) as performed_by_name"),
        // ✅ users tablon FULL_NAME + USERNAME kullanıyor
        knex.raw("COALESCE(u.full_name, u.username) as performed_by_name"),
        'am.movement_date',
        'am.notes',
        'am.created_at'
      )
      .orderBy('am.movement_date', 'desc')
      .limit(5);

    return res.json(movements);
  } catch (err) {
    console.error('assetMovements.getRecentAssetMovements hatası:', err);
    // Geliştirme sırasında hata mesajını da görmek istersen:
    // return res.status(500).json({ message: err.message });
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.createAssetMovement = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const performedByUserId = req.user?.id;

    const {
      asset_id,
      movement_type,
      movement_date,
      from_department_id,
      to_department_id,
      from_location_id,
      to_location_id,
      to_user_id,
      notes,
      reason,
      requested_by,
      approved_by,
      status,
    } = req.body;

    if (!municipalityId || !performedByUserId) {
      return res.status(401).json({ message: 'Kullanıcı bilgisi bulunamadı' });
    }

    const movementTypeMap = {
      department: 'transfer',
      location: 'transfer',
      owner: 'assign',
      decommission: 'dispose',
      assign: 'assign',
      transfer: 'transfer',
      return: 'return',
      maintenance: 'maintenance',
      dispose: 'dispose',
    };

    const normalizedMovementType = movementTypeMap[movement_type];

    if (!asset_id || !normalizedMovementType) {
      return res.status(400).json({ message: 'Varlık ve geçerli hareket türü zorunludur' });
    }

    const asset = await knex('assets')
      .where({ id: asset_id, municipality_id: municipalityId }).first();

    if (!asset) {
      return res.status(404).json({ message: 'Varlık bulunamadı' });
    }

    const insertData = {
      asset_id,
      movement_type: normalizedMovementType,
      movement_date: movement_date || new Date(),
      from_department_id: from_department_id || asset.department_id || null,
      to_department_id: to_department_id || null,
      from_location_id: from_location_id || asset.location_id || null,
      to_location_id: to_location_id || null,
      to_user_id: to_user_id || null,
      municipality_id: municipalityId,
      performed_by_user_id: performedByUserId,
      created_by_user_id: performedByUserId,
      updated_by_user_id: performedByUserId,
      notes: notes || null,
      reason: reason || null,
      requested_by: requested_by || null,
      approved_by: approved_by || null,
      status: status || null,
    };

    const [created] = await knex('asset_movements')
      .insert(insertData)
      .returning([
        'id',
        'asset_id',
        'movement_type',
        'from_department_id',
        'to_department_id',
        'from_location_id',
        'to_location_id',
        'to_user_id',
        'performed_by_user_id',
        'movement_date',
        'notes',
        'reason',
        'requested_by',
        'approved_by',
        'status',
        'municipality_id',
        'created_at',
        'updated_at',
      ]);

    return res.status(201).json(created);
  } catch (err) {
    console.error('assetMovements.createAssetMovement hatası:', {message: err.message,
    detail: err.detail,
    code: err.code,
    stack: err.stack,});
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getLastThirtyDaysMovementsTotal = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [row] = await knex('asset_movements')
      .where('municipality_id', municipalityId)
      .andWhere('movement_date', '>=', thirtyDaysAgo)
      .count('id as count');

    return res.json({ total: getCountFromRow(row) });
  } catch (err) {
    console.error('assetMovements.getLastThirtyDaysMovementsTotal hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.getTodayMovementsTotal = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfToday.getDate() + 1);

    const [row] = await knex('asset_movements')
      .where('municipality_id', municipalityId)
      .andWhere('movement_date', '>=', startOfToday)
      .andWhere('movement_date', '<', startOfTomorrow)
      .count('id as count');

    return res.json({ total: getCountFromRow(row) });
  } catch (err) {
    console.error('assetMovements.getTodayMovementsTotal hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getMaintenanceMovementsTotal = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;


    const [row] = await knex('asset_movements')
      .where({ municipality_id: municipalityId, movement_type: 'maintenance' })
      .count('id as count');

    return res.json({ total: getCountFromRow(row) });
  } catch (err) {
    console.error('assetMovements.getMaintenanceMovementsTotal hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
exports.getZimmetMovementsTotal = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const [row] = await knex('asset_movements')
      .where({ municipality_id: municipalityId, movement_type: 'assign' })
      .count('id as count');

    return res.json({ total: getCountFromRow(row) });
  } catch (err) {
    console.error('assetMovements.getZimmetMovementsTotal hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.filterMovements = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    const { assetSearch, movementType, departmentId, startDate, endDate } = req.query;

    const query = buildMovementQuery(municipalityId);

    const hasAnyFilter =
      assetSearch || movementType || departmentId || startDate || endDate;

    if (assetSearch) {
      query.andWhere((builder) => {
        builder
          .whereILike('a.asset_code', `%${assetSearch}%`)
          .orWhereILike('a.name', `%${assetSearch}%`);
      });
    }

    if (movementType) {
      query.andWhere('am.movement_type', movementType);
    }

    if (departmentId) {
      query.andWhere((builder) => {
        builder
          .where('am.from_department_id', departmentId)
          .orWhere('am.to_department_id', departmentId);
      });
    }

    if (startDate && endDate) {
      query.andWhereBetween('am.movement_date', [startDate, endDate]);
    } else if (startDate) {
      query.andWhere('am.movement_date', '>=', startDate);
    } else if (endDate) {
      query.andWhere('am.movement_date', '<=', endDate);
    }

    // Hiç filtre yoksa: son 100 hareket
    if (!hasAnyFilter) {
      query.limit(100);
    }

    const movements = await query;

    return res.json({ data: movements });
  } catch (error) {
    console.error('assetMovement.filterMovements error:', error);
    return res.status(500).json({ message: 'Varlık hareketleri alınamadı' });
  }
};


