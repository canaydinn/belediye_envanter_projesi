const knex = require('../config/knex');

// GET /api/asset-movements
// Varlık hareketlerini filtreleyerek listeler
exports.listAssetMovements = async (req, res) => {
  try {
    const { municipality_id } = req.user;
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
      .where('am.municipality_id', municipality_id)
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
    const { municipality_id } = req.user;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfToday.getDate() + 1);

    const [last30DaysRow] = await knex('asset_movements')
      .where('municipality_id', municipality_id)
      .andWhere('movement_date', '>=', thirtyDaysAgo)
      .count('id as count');

    const [todayRow] = await knex('asset_movements')
      .where('municipality_id', municipality_id)
      .andWhere('movement_date', '>=', startOfToday)
      .andWhere('movement_date', '<', startOfTomorrow)
      .count('id as count');

    const [maintenanceRow] = await knex('asset_movements')
      .where({ municipality_id, movement_type: 'maintenance' })
      .count('id as count');

    const [assignmentTransferRow] = await knex('asset_movements')
      .where('municipality_id', municipality_id)
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
    const { municipality_id } = req.user || {};

    if (!municipality_id) {
      return res.status(400).json({ message: 'Kullanıcı belediye bilgisi bulunamadı' });
    }

    const movementCounts = await knex('asset_movements')
      .where('municipality_id', municipality_id)
      .groupBy('movement_type')
      .select('movement_type')
      .count('* as count');

    const totalMovements = movementCounts.reduce(
      (sum, row) => sum + Number(row.count),
      0
    );

    const distribution = movementCounts.map((row) => {
      const count = Number(row.count);
      const percentage = totalMovements === 0 ? 0 : Number(((count / totalMovements) * 100).toFixed(2));

      return {
        movement_type: row.movement_type,
        count,
        percentage,
      };
    });

    return res.json({
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
    const { municipality_id } = req.user;

    const movements = await knex('asset_movements as am')
      .join('assets as a', 'am.asset_id', 'a.id')
      .leftJoin('departments as fd', 'am.from_department_id', 'fd.id')
      .leftJoin('departments as td', 'am.to_department_id', 'td.id')
      .leftJoin('locations as fl', 'am.from_location_id', 'fl.id')
      .leftJoin('locations as tl', 'am.to_location_id', 'tl.id')
      .leftJoin('users as u', 'am.performed_by_user_id', 'u.id')
      .where('am.municipality_id', municipality_id)
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
        knex.raw("COALESCE(u.first_name || ' ' || u.last_name, u.username) as performed_by_name"),
        'am.movement_date',
        'am.notes',
        'am.created_at'
      )
      .orderBy('am.movement_date', 'desc')
      .limit(5);

    return res.json(movements);
  } catch (err) {
    console.error('assetMovements.getRecentAssetMovements hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

