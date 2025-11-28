// controllers/maintenance.controller.js
const MaintenanceTicket = require('../models/MaintenanceTicket');

exports.createTicket = async (req, res) => {
  try {
    const { inventoryId, title, description, priority } = req.body;

    if (!inventoryId || !title) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Envanter ID ve başlık zorunludur.'
      });
    }

    const ticket = await MaintenanceTicket.create({
      inventoryId,
      reportedBy: req.user.id,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: 'open'
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.error('CREATE_TICKET_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Arıza kaydı oluşturulurken bir hata oluştu.'
    });
  }
};

exports.listTickets = async (req, res) => {
  try {
    const {
      status,
      departmentId,
      priority,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (departmentId) {
      // Inventory üzerinden departmentId’ye join yapmak istersen
      // aggregate kullanman gerekir. Basit senaryoda ticket’a direkt departmentId yazılabilir.
      query.departmentId = departmentId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      MaintenanceTicket.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      MaintenanceTicket.countDocuments(query)
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
    console.error('LIST_TICKETS_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Arıza/bakım kayıtları alınırken bir hata oluştu.'
    });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await MaintenanceTicket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'TICKET_NOT_FOUND',
        message: 'Bakım kaydı bulunamadı.'
      });
    }

    return res.json(ticket);
  } catch (err) {
    console.error('GET_TICKET_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Bakım kaydı alınırken bir hata oluştu.'
    });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['assignedTo', 'status', 'priority', 'title', 'description'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const ticket = await MaintenanceTicket.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!ticket) {
      return res.status(404).json({
        error: 'TICKET_NOT_FOUND',
        message: 'Bakım kaydı bulunamadı.'
      });
    }

    return res.json(ticket);
  } catch (err) {
    console.error('UPDATE_TICKET_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Bakım kaydı güncellenirken bir hata oluştu.'
    });
  }
};

exports.completeTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNote, completedBy } = req.body;

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        error: 'TICKET_NOT_FOUND',
        message: 'Bakım kaydı bulunamadı.'
      });
    }

    ticket.status = 'completed';
    ticket.completedBy = completedBy || req.user.id;
    ticket.completedAt = new Date();
    ticket.resolutionNote = resolutionNote || '';
    await ticket.save();

    return res.json(ticket);
  } catch (err) {
    console.error('COMPLETE_TICKET_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Bakım kaydı tamamlanırken bir hata oluştu.'
    });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        error: 'TICKET_NOT_FOUND',
        message: 'Bakım kaydı bulunamadı.'
      });
    }

    if (ticket.status === 'completed') {
      return res.status(400).json({
        error: 'CANNOT_DELETE_CLOSED_TICKET',
        message: 'Tamamlanmış bakım kayıtları silinemez.'
      });
    }

    await MaintenanceTicket.deleteOne({ _id: id });

    return res.status(204).send();
  } catch (err) {
    console.error('DELETE_TICKET_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Bakım kaydı silinirken bir hata oluştu.'
    });
  }
};
