// controllers/departments.controller.js
const Department = require('../models/Department');

exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description, parentId } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Ad ve kod zorunludur.'
      });
    }

    const existing = await Department.findOne({ code });
    if (existing) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Bu kod zaten kullanılıyor.'
      });
    }

    const dep = await Department.create({
      name,
      code,
      description: description || '',
      parentId: parentId || null
    });

    return res.status(201).json(dep);
  } catch (err) {
    console.error('CREATE_DEPARTMENT_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Birim oluşturulurken bir hata oluştu.'
    });
  }
};

exports.listDepartments = async (req, res) => {
  try {
    const deps = await Department.find().sort({ name: 1 });
    return res.json({ data: deps });
  } catch (err) {
    console.error('LIST_DEPARTMENTS_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Birim listesi alınırken bir hata oluştu.'
    });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const dep = await Department.findById(id);
    if (!dep) {
      return res.status(404).json({
        error: 'DEPARTMENT_NOT_FOUND',
        message: 'Birim bulunamadı.'
      });
    }
    return res.json(dep);
  } catch (err) {
    console.error('GET_DEPARTMENT_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Birim bilgisi alınırken bir hata oluştu.'
    });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    ['name', 'code', 'description', 'parentId'].forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const dep = await Department.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!dep) {
      return res.status(404).json({
        error: 'DEPARTMENT_NOT_FOUND',
        message: 'Birim bulunamadı.'
      });
    }

    return res.json(dep);
  } catch (err) {
    console.error('UPDATE_DEPARTMENT_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Birim güncellenirken bir hata oluştu.'
    });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Inventory model ile ilişki kontrolü burada yapılabilir.
    // const count = await Inventory.countDocuments({ departmentId: id });
    // if (count > 0) { ... }

    await Department.deleteOne({ _id: id });
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_DEPARTMENT_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Birim silinirken bir hata oluştu.'
    });
  }
};
