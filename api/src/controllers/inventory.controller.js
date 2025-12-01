// controllers/inventory.controller.js
//const Inventory = require('../models/Inventory');

exports.createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      category,
      serialNumber,
      assetTag,
      departmentId,
      locationId,
      purchaseDate,
      status,
      value,
      description
    } = req.body;

    if (!name || !assetTag) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'En azından ad ve demirbaş kodu (assetTag) zorunludur.'
      });
    }

    const existing = await Inventory.findOne({ assetTag });
    if (existing) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Bu demirbaş kodu (assetTag) zaten kullanılıyor.'
      });
    }

    const item = await Inventory.create({
      name,
      category: category || '',
      serialNumber: serialNumber || '',
      assetTag,
      departmentId: departmentId || null,
      locationId: locationId || null,
      purchaseDate: purchaseDate || null,
      status: status || 'active',
      value: value || 0,
      description: description || ''
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error('CREATE_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter eklenirken bir hata oluştu.'
    });
  }
};

exports.listInventory = async (req, res) => {
  try {
    const {
      departmentId,
      locationId,
      status,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    if (departmentId) query.departmentId = departmentId;
    if (locationId) query.locationId = locationId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      Inventory.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Inventory.countDocuments(query)
    ]);

    return res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (err) {
    console.error('LIST_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter listesi alınırken bir hata oluştu.'
    });
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Envanter bulunamadı.'
      });
    }
    return res.json(item);
  } catch (err) {
    console.error('GET_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter bilgisi alınırken bir hata oluştu.'
    });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'name',
      'category',
      'serialNumber',
      'assetTag',
      'departmentId',
      'locationId',
      'purchaseDate',
      'status',
      'value',
      'description'
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const item = await Inventory.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!item) {
      return res.status(404).json({
        error: 'INVENTORY_NOT_FOUND',
        message: 'Envanter bulunamadı.'
      });
    }

    return res.json(item);
  } catch (err) {
    console.error('UPDATE_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter güncellenirken bir hata oluştu.'
    });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Bakım kayıtları, audit log vb. ilişkiler kontrol edilebilir.
    await Inventory.deleteOne({ _id: id });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_INVENTORY_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter silinirken bir hata oluştu.'
    });
  }
};
