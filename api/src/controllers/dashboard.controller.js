const knex = require('../config/knex');

const parseCount = (row) => Number(row?.total ?? row?.count ?? 0);

// GET /api/dashboard/stats
// İlgili belediyeye ait toplam kullanıcı, birim ve lokasyon sayılarını döner
exports.getMunicipalityStats = async (req, res) => {
  try {
    const municipalityId = req.user?.municipality_id;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
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
      knex('assets').where({ municipality_id: municipalityId, status: 'in_maintenance' }).count({ count: 'id' }).first(),
      knex('assets').where({ municipality_id: municipalityId, is_qr_tagged: true }).count({ count: 'id' }).first(),
    ]);
const totalAssets = parseCount(assetsCountRow);
    const qrTaggedCount = parseCount(qrTaggedAssetsRow);
    const qrTaggedPercentage = totalAssets === 0 ? 0 : Number(((qrTaggedCount / totalAssets) * 100).toFixed(2));

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
        qrTagged: {
          count: qrTaggedCount,
          percentage: qrTaggedPercentage,
        },
      },
    });
  } catch (err) {
    console.error('dashboard.getMunicipalityStats hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};
// GET /api/dashboard/municipality
// Oturum açmış kullanıcının bağlı olduğu belediyenin temel bilgilerini getirir
exports.getMunicipalityInfo = async (req, res) => {
  try {
    const municipalityId = req.user?.municipality_id;

    if (!municipalityId) {
      return res.status(400).json({ message: 'Belediye bilgisi bulunamadı' });
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
// İlgili belediyenin son varlık hareketlerini döner
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
        'am.movement_date',
        'am.notes',
        'am.created_at'
      )
      .orderBy('am.movement_date', 'desc')
      .limit(5);

    return res.json(movements);
  } catch (err) {
    console.error('dashboard.getRecentAssetMovements hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
}