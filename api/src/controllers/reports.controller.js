// controllers/reports.controller.js
const knex = require('../config/knex');

exports.getInventorySummary = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Belediye kapsamı bulunamadı.'
      });
    }

    const { groupBy = 'department', status } = req.query;

    let query = knex('assets')
      .where('municipality_id', municipalityId);

    if (status) {
      query = query.where('status', status);
    }

    let data;
    if (groupBy === 'department') {
      data = await query
        .select('department_id as _id')
        .select(knex.raw('COUNT(*) as total_count'))
        .select(knex.raw('COALESCE(SUM(purchase_price), 0) as total_value'))
        .groupBy('department_id');
    } else if (groupBy === 'location') {
      data = await query
        .select('location_id as _id')
        .select(knex.raw('COUNT(*) as total_count'))
        .select(knex.raw('COALESCE(SUM(purchase_price), 0) as total_value'))
        .groupBy('location_id');
    } else {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz groupBy parametresi.'
      });
    }

    // Normalize data format
    const normalizedData = data.map(row => ({
      _id: row._id,
      totalCount: Number(row.total_count),
      totalValue: Number(row.total_value)
    }));

    return res.json({
      generatedAt: new Date().toISOString(),
      groupBy,
      filters: { status: status || null },
      data: normalizedData
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
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Belediye kapsamı bulunamadı.'
      });
    }

    const { from, to } = req.query;

    let query = knex('maintenance_requests')
      .where('municipality_id', municipalityId);

    if (from || to) {
      if (from) {
        query = query.where('created_at', '>=', new Date(from));
      }
      if (to) {
        query = query.where('created_at', '<=', new Date(to));
      }
    }

    const tickets = await query.select('status', 'priority');

    const totalTickets = tickets.length;
    const byStatus = {};
    const byPriority = {};

    tickets.forEach((t) => {
      const status = t.status || 'unknown';
      const priority = t.priority || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      byPriority[priority] = (byPriority[priority] || 0) + 1;
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
