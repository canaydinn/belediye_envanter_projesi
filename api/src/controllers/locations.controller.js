// controllers/locations.controller.js
//const Location = require('../models/Location');

exports.createLocation = async (req, res) => {
  try {
    const { name, code, type, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Ad ve tür (type) zorunludur.'
      });
    }

    const loc = await Location.create({
      name,
      code: code || null,
      type,
      parentId: parentId || null
    });

    return res.status(201).json(loc);
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
    const { type } = req.query;
    const query = {};
    if (type) query.type = type;

    const data = await Location.find(query).sort({ name: 1 });

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
    const all = await Location.find();

    const map = {};
    all.forEach((loc) => {
      map[loc._id] = { ...loc.toObject(), children: [] };
    });

    const roots = [];
    all.forEach((loc) => {
      if (loc.parentId) {
        const parent = map[loc.parentId];
        if (parent) {
          parent.children.push(map[loc._id]);
        }
      } else {
        roots.push(map[loc._id]);
      }
    });

    return res.json({ data: roots });
  } catch (err) {
    console.error('LOCATION_TREE_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon ağacı oluşturulurken bir hata oluştu.'
    });
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const loc = await Location.findById(id);

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
    const updateData = {};

    ['name', 'code', 'type', 'parentId'].forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const loc = await Location.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!loc) {
      return res.status(404).json({
        error: 'LOCATION_NOT_FOUND',
        message: 'Lokasyon bulunamadı.'
      });
    }

    return res.json(loc);
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

    // TODO: Çocuk lokasyonları veya envanter bağlı mı kontrol edilebilir.
    await Location.deleteOne({ _id: id });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_LOCATION_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Lokasyon silinirken bir hata oluştu.'
    });
  }
};
