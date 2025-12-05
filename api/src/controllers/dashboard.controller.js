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

    const [usersCountRow, departmentsCountRow, locationsCountRow] = await Promise.all([
      knex('users').where({ municipality_id: municipalityId }).count({ total: 'id' }).first(),
      knex('departments').where({ municipality_id: municipalityId }).count({ total: 'id' }).first(),
      knex('locations').where({ municipality_id: municipalityId }).count({ total: 'id' }).first(),
    ]);

    return res.json({
      municipality_id: municipalityId,
      totals: {
        users: parseCount(usersCountRow),
        departments: parseCount(departmentsCountRow),
        locations: parseCount(locationsCountRow),
      },
    });
  } catch (err) {
    console.error('dashboard.getMunicipalityStats hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası' });
  }
};