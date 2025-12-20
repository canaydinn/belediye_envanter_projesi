// api/src/controllers/dashboard.controller.js
const knex = require('../config/knex');

const parseCount = (row) => Number(row?.total ?? row?.count ?? 0);

// GET /api/dashboard/stats
exports.getMunicipalityStats = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const [
      usersCountRow,
      departmentsCountRow,
      locationsCountRow,
      assetsCountRow,
      movedLast30DaysRow,
      maintenanceAssetsRow,
      qrTaggedAssetsRow,
    ] = await Promise.all([
      knex('users').where({ municipality_id: municipalityId }).count({ total: 'id' }).first(),
      knex('departments').where({ municipality_id: municipalityId }).count({ total: 'id' }).first(),
      knex('locations').where({ municipality_id: municipalityId }).count({ total: 'id' }).first(),
      knex('assets').where({ municipality_id: municipalityId }).count({ total: 'id' }).first(),
      knex('asset_movements')
        .where({ municipality_id: municipalityId })
        .andWhere('movement_date', '>=', knex.raw("NOW() - INTERVAL '30 days'"))
        .count({ count: 'id' })
        .first(),
      knex('assets')
        .where({ municipality_id: municipalityId, status: 'in_maintenance' })
        .count({ count: 'id' })
        .first(),
      knex('assets')
        .where({ municipality_id: municipalityId, is_qr_tagged: true })
        .count({ count: 'id' })
        .first(),
    ]);

    const totalAssets = parseCount(assetsCountRow);
    const qrTaggedCount = parseCount(qrTaggedAssetsRow);
    const qrTaggedPercentage =
      totalAssets === 0 ? 0 : Number(((qrTaggedCount / totalAssets) * 100).toFixed(2));

    return res.json({
      municipality_id: municipalityId,
      totals: {
        users: parseCount(usersCountRow),
        departments: parseCount(departmentsCountRow),
        locations: parseCount(locationsCountRow),
      },
      assets: {
        total: totalAssets,
        movedLast30Days: parseCount(movedLast30DaysRow),
        maintenanceNeeded: parseCount(maintenanceAssetsRow),
        qrTagged: { count: qrTaggedCount, percentage: qrTaggedPercentage },
      },
    });
  } catch (err) {
    console.error('dashboard.getMunicipalityStats hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// GET /api/dashboard/municipality
exports.getMunicipalityInfo = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye kapsamı bulunamadı' });
    }

    const municipality = await knex('municipalities')
      .select('id', 'name', 'province', 'district')
      .where({ id: municipalityId })
      .first();

    if (!municipality) {
      return res.status(404).json({ message: 'Belediye kaydı bulunamadı' });
    }

    return res.json(municipality);
  } catch (error) {
    console.error('dashboard.getMunicipalityInfo hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// GET /api/dashboard/recent-movements
exports.getRecentAssetMovements = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    console.log('[RECENT MOVEMENTS] tenantMunicipalityId =', municipalityId);

    const movements = await knex('asset_movements as am')
      .join('assets as a', 'am.asset_id', 'a.id')
      .leftJoin('departments as fd', 'am.from_department_id', 'fd.id')
      .leftJoin('departments as td', 'am.to_department_id', 'td.id')
      .leftJoin('locations as fl', 'am.from_location_id', 'fl.id')
      .leftJoin('locations as tl', 'am.to_location_id', 'tl.id')
      .leftJoin('users as u', 'am.performed_by_user_id', 'u.id')
      .where('a.municipality_id', municipalityId)
      .select(
        'am.id',
        'am.asset_id',
        'a.asset_code',
        'a.name as asset_name',
        'am.movement_type',
        'fd.name as from_department_name',
        'td.name as to_department_name',
        'fl.name as from_location_name',
        'tl.name as to_location_name',
        knex.raw("COALESCE(u.full_name, u.username) as performed_by_name"),
        'am.movement_date',
        'am.notes',
        'am.created_at'
      )
      .orderBy('am.movement_date', 'desc')
      .limit(5);
    console.log('[RECENT MOVEMENTS] raw count =', movements.length);

    return res.json(movements);
  } catch (err) {
    console.error('dashboard.getRecentAssetMovements hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// GET /api/dashboard/category-distribution
exports.getCategoryDistribution = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    const rows = await knex('assets as a')
      .leftJoin('asset_categories as c', function () {
        this.on('a.category_id', '=', 'c.id').andOn('a.municipality_id', '=', 'c.municipality_id');
      })
      .where('a.municipality_id', municipalityId)
      .groupBy('a.category_id', 'c.name')
      .select('a.category_id', 'c.name as category_name')
      .count('a.id as total');

    const totalAssets = rows.reduce((sum, row) => sum + Number(row.total), 0);

    const distribution = rows.map((row) => {
      const count = Number(row.total);
      const percentage =
        totalAssets === 0 ? 0 : Number(((count / totalAssets) * 100).toFixed(2));

      return {
        category_id: row.category_id,
        category_name: row.category_name || 'Diğer',
        count,
        percentage,
      };
    });

    return res.json({
      municipality_id: municipalityId,
      total_assets: totalAssets,
      distribution,
    });
  } catch (err) {
    console.error('dashboard.getCategoryDistribution hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// GET /api/dashboard/upcoming-maintenance
exports.getUpcomingMaintenance = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;

    // Güvenli tenant filtreli sürüm (maintenance_requests + assets join)
    const logs = await knex('maintenance_logs as ml')
      .leftJoin('maintenance_requests as mr', 'ml.maintenance_request_id', 'mr.id')
      .leftJoin('assets as a', 'mr.asset_id', 'a.id')
      .where(function () {
        this.where('a.municipality_id', municipalityId).orWhere('a.municipality_id', municipalityId);
      })
      .select(
        'ml.id',
        'ml.maintenance_request_id',
        'ml.log_date',
        'ml.description as log_description',
        'ml.created_at',
        'a.id as asset_id',
        'a.name as asset_name',
        'a.asset_code',
        'mr.title',
      
        'mr.status',
        'mr.priority'
      )
      .orderBy('ml.log_date', 'desc')
      .limit(5);

    const payload = logs.map((row) => ({
      id: row.id,
      maintenance_request_id: row.maintenance_request_id,
      log_date: row.log_date,
      description: row.log_description,
      asset_id: row.asset_id || null,
      asset_name: row.asset_name || 'Bilinmeyen Varlık',
      asset_code: row.asset_code || null,
      title: row.title || null,
      due_date: row.due_date || row.log_date,
      status: row.status || 'planned',
      priority: row.priority || 'medium',
    }));

    return res.json(payload);
  } catch (error) {
    console.error('dashboard.getUpcomingMaintenance hatası:', error);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
