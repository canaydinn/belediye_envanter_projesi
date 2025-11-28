// controllers/users.controller.js
const User = require('../models/User');

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Ad, e-posta ve şifre zorunludur.'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Bu e-posta adresi zaten kayıtlı.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
      departmentId: departmentId || null
    });

    return res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('CREATE_USER_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Kullanıcı oluşturulurken bir hata oluştu.'
    });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { role, departmentId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (departmentId) query.departmentId = departmentId;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      User.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    return res.json({
      data: data.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        departmentId: u.departmentId || null
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (err) {
    console.error('LIST_USERS_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Kullanıcı listesi alınırken bir hata oluştu.'
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Belirtilen kullanıcı bulunamadı.'
      });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null
    });
  } catch (err) {
    console.error('GET_USER_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Kullanıcı bilgileri alınırken bir hata oluştu.'
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['name', 'email', 'departmentId'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Belirtilen kullanıcı bulunamadı.'
      });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null
    });
  } catch (err) {
    console.error('UPDATE_USER_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Kullanıcı güncellenirken bir hata oluştu.'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Yönetici hesabı silinemez.'
      });
    }

    await User.deleteOne({ _id: id });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_USER_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Kullanıcı silinirken bir hata oluştu.'
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Rol alanı zorunludur.'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId || null
    });
  } catch (err) {
    console.error('UPDATE_USER_ROLE_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Kullanıcı rolü güncellenirken bir hata oluştu.'
    });
  }
};
