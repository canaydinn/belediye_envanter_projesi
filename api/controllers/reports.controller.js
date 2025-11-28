// controllers/reports.controller.js
const Inventory = require('../models/Inventory');
const MaintenanceTicket = require('../models/MaintenanceTicket');
// Excel & PDF export için paketleri ayrıca ekleyebilirsin (exceljs, pdfkit vs.)

exports.getInventorySummary = async (req, res) => {
  try {
    const { groupBy = 'department', status } = req.query;

    const match = {};
    if (status) match.status = status;

    let group = {};
    if (groupBy === 'department') {
      group = {
        _id: '$departmentId',
        totalCount: { $sum: 1 },
        totalValue: { $sum: '$value' }
      };
    } else if (groupBy === 'location') {
      group = {
        _id: '$locationId',
        totalCount: { $sum: 1 },
        totalValue: { $sum: '$value' }
      };
    } else {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz groupBy parametresi.'
      });
    }

    const data = await Inventory.aggregate([
      { $match: match },
      { $group: group }
    ]);

    return res.json({
      generatedAt: new Date().toISOString(),
      groupBy,
      filters: { status: status || null },
      data
    });
  } catch (err) {
    console.error('INVENTORY_REPORT_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Envanter raporu oluşturulurken bir hata oluştu.'
    });
  }
};

exports.getMaintenanceSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }

    const tickets = await MaintenanceTicket.find(match);

    const totalTickets = tickets.length;
    const byStatus = {};
    const byPriority = {};

    tickets.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });

    return res.json({
      generatedAt: new Date().toISOString(),
      period: { from: from || null, to: to || null },
      data: {
        totalTickets,
        byStatus,
        byPriority
      }
    });
  } catch (err) {
    console.error('MAINTENANCE_REPORT_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Bakım raporu oluşturulurken bir hata oluştu.'
    });
  }
};

// Burada sadece dummy response veriyorum; gerçek Excel/PDF üretimi için exceljs/pdfkit entegrasyonu yapabilirsin.
exports.exportExcel = async (req, res) => {
  try {
    // type = inventory-summary vs.
    const { type } = req.query;
    // TODO: type'a göre ilgili rapor fonksiyonunu çağırıp Excel oluştur
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="report.xlsx"'
    );
    // Burada gerçek Excel stream’i yazılmalı
    res.end(); // şimdilik boş
  } catch (err) {
    console.error('EXPORT_EXCEL_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Excel çıktısı oluşturulurken bir hata oluştu.'
    });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    // TODO: PDF üretimi (pdfkit vs.)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    // PDF stream’i yazılmalı
    res.end();
  } catch (err) {
    console.error('EXPORT_PDF_ERROR', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'PDF çıktısı oluşturulurken bir hata oluştu.'
    });
  }
};
