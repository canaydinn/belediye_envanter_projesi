const knex = require('../config/knex');

exports.list = async (req, res) => {
  try {
    const { department_id, category_id, search } = req.query;

    let query = knex('assets')
      .select(
        'assets.*',
        'departments.name as department_name',
        'locations.name as location_name',
        'asset_categories.name as category_name'
      )
      .leftJoin('departments', 'assets.department_id', 'departments.id')
      .leftJoin('locations', 'assets.location_id', 'locations.id')
      .leftJoin('asset_categories', 'assets.category_id', 'asset_categories.id');

    if (department_id) query = query.where('assets.department_id', department_id);
    if (category_id) query = query.where('assets.category_id', category_id);
    if (search) {
      query = query.whereILike('assets.name', `%${search}%`).orWhereILike('assets.asset_code', `%${search}%`);
    }

    const rows = await query;
    res.json(rows);
  } catch (err) {
    console.error('assets list hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body;
    const currentUserId = req.user?.id || null;

    const [inserted] = await knex('assets')
      .insert({
        asset_code: body.asset_code,
        name: body.name,
        description: body.description,
        category_id: body.category_id,
        department_id: body.department_id,
        location_id: body.location_id,
        assigned_user_id: body.assigned_user_id || null,
        quantity: body.quantity || 1,
        unit: body.unit || 'Adet',
        tasinir_code: body.tasinir_code || null,
        asset_type: body.asset_type || 'demirbas',
        serial_number: body.serial_number || null,
        purchase_price: body.purchase_price || null,
        purchase_date: body.purchase_date || null,
        created_by_user_id: currentUserId,
      })
      .returning('*');

    res.status(201).json(inserted);
  } catch (err) {
    console.error('asset create hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const currentUserId = req.user?.id || null;

    const [updated] = await knex('assets')
      .where({ id })
      .update(
        {
          asset_code: body.asset_code,
          name: body.name,
          description: body.description,
          category_id: body.category_id,
          department_id: body.department_id,
          location_id: body.location_id,
          assigned_user_id: body.assigned_user_id || null,
          quantity: body.quantity,
          unit: body.unit,
          tasinir_code: body.tasinir_code,
          asset_type: body.asset_type,
          serial_number: body.serial_number,
          purchase_price: body.purchase_price,
          purchase_date: body.purchase_date,
          updated_by_user_id: currentUserId,
        },
        '*'
      );

    if (!updated) {
      return res.status(404).json({ message: 'Envanter kaydı bulunamadı' });
    }

    res.json(updated);
  } catch (err) {
    console.error('asset update hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const affected = await knex('assets').where({ id }).del();

    if (!affected) {
      return res.status(404).json({ message: 'Envanter kaydı bulunamadı' });
    }

    res.json({ message: 'Envanter silindi' });
  } catch (err) {
    console.error('asset delete hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};
