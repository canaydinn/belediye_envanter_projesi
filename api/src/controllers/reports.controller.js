// controllers/reports.controller.js
const knex = require('../config/knex');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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

    let baseQuery = knex('maintenance_requests')
      .where('municipality_id', municipalityId);

    if (from) {
      baseQuery = baseQuery.where('created_at', '>=', new Date(from));
    }
    if (to) {
      baseQuery = baseQuery.where('created_at', '<=', new Date(to));
    }

    // Aggregate at DB level to avoid loading all tickets into memory
    const [{ total_tickets }] = await baseQuery
      .clone()
      .count('* as total_tickets');

    const statusRows = await baseQuery
      .clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const priorityRows = await baseQuery
      .clone()
      .select('priority')
      .count('* as count')
      .groupBy('priority');

    const byStatus = {};
    statusRows.forEach((row) => {
      const key = row.status || 'unknown';
      byStatus[key] = Number(row.count);
    });

    const byPriority = {};
    priorityRows.forEach((row) => {
      const key = row.priority || 'unknown';
      byPriority[key] = Number(row.count);
    });

    return res.json({
      generatedAt: new Date().toISOString(),
      period: { from: from || null, to: to || null },
      data: {
        totalTickets: Number(total_tickets) || 0,
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

exports.exportExcel = async (req, res) => {
  try {
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Belediye kapsamı bulunamadı.'
      });
    }

    const { type = 'inventory-summary', groupBy = 'department', status } = req.query;

    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rapor');

    let reportData = [];
    let reportTitle = '';

    // Rapor tipine göre veri çek
    if (type === 'inventory-summary') {
      reportTitle = 'Envanter Özet Raporu';
      
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

        // Departman isimlerini al
        const departmentIds = data.map(row => row._id).filter(id => id);
        const departments = departmentIds.length > 0
          ? await knex('departments')
              .whereIn('id', departmentIds)
              .where('municipality_id', municipalityId)
              .select('id', 'name')
          : [];

        const deptMap = {};
        departments.forEach(dept => {
          deptMap[dept.id] = dept.name;
        });

        reportData = data.map(row => ({
          Grup: deptMap[row._id] || 'Belirtilmemiş',
          'Toplam Adet': Number(row.total_count),
          'Toplam Değer': Number(row.total_value)
        }));
      } else if (groupBy === 'location') {
        data = await query
          .select('location_id as _id')
          .select(knex.raw('COUNT(*) as total_count'))
          .select(knex.raw('COALESCE(SUM(purchase_price), 0) as total_value'))
          .groupBy('location_id');

        // Lokasyon isimlerini al
        const locationIds = data.map(row => row._id).filter(id => id);
        const locations = locationIds.length > 0
          ? await knex('locations')
              .whereIn('id', locationIds)
              .where('municipality_id', municipalityId)
              .select('id', 'name')
          : [];

        const locMap = {};
        locations.forEach(loc => {
          locMap[loc.id] = loc.name;
        });

        reportData = data.map(row => ({
          Grup: locMap[row._id] || 'Belirtilmemiş',
          'Toplam Adet': Number(row.total_count),
          'Toplam Değer': Number(row.total_value)
        }));
      }
    } else if (type === 'maintenance-summary') {
      reportTitle = 'Bakım Özet Raporu';
      
      const { from, to } = req.query;
      let baseQuery = knex('maintenance_requests')
        .where('municipality_id', municipalityId);

      if (from) {
        baseQuery = baseQuery.where('created_at', '>=', new Date(from));
      }
      if (to) {
        baseQuery = baseQuery.where('created_at', '<=', new Date(to));
      }

      const statusRows = await baseQuery
        .clone()
        .select('status')
        .count('* as count')
        .groupBy('status');

      reportData = statusRows.map(row => ({
        Durum: row.status || 'Belirtilmemiş',
        Adet: Number(row.count)
      }));
    } else {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz rapor tipi. Desteklenen tipler: inventory-summary, maintenance-summary'
      });
    }

    if (reportData.length === 0) {
      reportData = [{ Mesaj: 'Rapor için veri bulunamadı.' }];
    }

    // Başlık satırı
    worksheet.addRow([reportTitle]);
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.getRow(1).alignment = { horizontal: 'center' };
    worksheet.mergeCells(1, 1, 1, Object.keys(reportData[0]).length);

    // Boş satır
    worksheet.addRow([]);

    // Sütun başlıkları
    const headers = Object.keys(reportData[0]);
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(worksheet.rowCount);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Veri satırları
    reportData.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // Sütun genişliklerini ayarla
    headers.forEach((header, index) => {
      worksheet.getColumn(index + 1).width = Math.max(header.length, 15);
    });

    // Tarih bilgisi ekle
    worksheet.addRow([]);
    worksheet.addRow(['Oluşturulma Tarihi:', new Date().toLocaleString('tr-TR')]);

    // Response header'larını ayarla
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapor_${type}_${timestamp}.xlsx"`
    );

    // Excel dosyasını stream olarak gönder
    await workbook.xlsx.write(res);
    res.end();
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
    const municipalityId = req.tenantMunicipalityId;
    if (!municipalityId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Belediye kapsamı bulunamadı.'
      });
    }

    const { type = 'inventory-summary', groupBy = 'department', status } = req.query;

    // PDF dokümanı oluştur
    const doc = new PDFDocument({ margin: 50 });
    
    // Response header'larını ayarla
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rapor_${type}_${timestamp}.pdf"`
    );

    // PDF'i response'a pipe et
    doc.pipe(res);

    let reportData = [];
    let reportTitle = '';

    // Rapor tipine göre veri çek
    if (type === 'inventory-summary') {
      reportTitle = 'Envanter Özet Raporu';
      
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

        const departmentIds = data.map(row => row._id).filter(id => id);
        const departments = departmentIds.length > 0
          ? await knex('departments')
              .whereIn('id', departmentIds)
              .where('municipality_id', municipalityId)
              .select('id', 'name')
          : [];

        const deptMap = {};
        departments.forEach(dept => {
          deptMap[dept.id] = dept.name;
        });

        reportData = data.map(row => ({
          grup: deptMap[row._id] || 'Belirtilmemiş',
          adet: Number(row.total_count),
          deger: Number(row.total_value)
        }));
      } else if (groupBy === 'location') {
        data = await query
          .select('location_id as _id')
          .select(knex.raw('COUNT(*) as total_count'))
          .select(knex.raw('COALESCE(SUM(purchase_price), 0) as total_value'))
          .groupBy('location_id');

        const locationIds = data.map(row => row._id).filter(id => id);
        const locations = locationIds.length > 0
          ? await knex('locations')
              .whereIn('id', locationIds)
              .where('municipality_id', municipalityId)
              .select('id', 'name')
          : [];

        const locMap = {};
        locations.forEach(loc => {
          locMap[loc.id] = loc.name;
        });

        reportData = data.map(row => ({
          grup: locMap[row._id] || 'Belirtilmemiş',
          adet: Number(row.total_count),
          deger: Number(row.total_value)
        }));
      }
    } else if (type === 'maintenance-summary') {
      reportTitle = 'Bakım Özet Raporu';
      
      const { from, to } = req.query;
      let baseQuery = knex('maintenance_requests')
        .where('municipality_id', municipalityId);

      if (from) {
        baseQuery = baseQuery.where('created_at', '>=', new Date(from));
      }
      if (to) {
        baseQuery = baseQuery.where('created_at', '<=', new Date(to));
      }

      const statusRows = await baseQuery
        .clone()
        .select('status')
        .count('* as count')
        .groupBy('status');

      reportData = statusRows.map(row => ({
        durum: row.status || 'Belirtilmemiş',
        adet: Number(row.count)
      }));
    } else {
      doc.end();
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Geçersiz rapor tipi. Desteklenen tipler: inventory-summary, maintenance-summary'
      });
    }

    // PDF içeriğini oluştur
    doc.fontSize(20).text(reportTitle, { align: 'center' });
    doc.moveDown(2);

    if (reportData.length === 0) {
      doc.fontSize(12).text('Rapor için veri bulunamadı.', { align: 'center' });
    } else {
      // Tablo başlıkları
      const headers = Object.keys(reportData[0]);
      const startY = doc.y;
      let currentY = startY;

      // Başlık satırı
      doc.fontSize(12).font('Helvetica-Bold');
      headers.forEach((header, index) => {
        const x = 50 + (index * 150);
        doc.text(header.charAt(0).toUpperCase() + header.slice(1), x, currentY);
      });
      
      currentY += 25;
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;

      // Veri satırları
      doc.font('Helvetica').fontSize(10);
      reportData.forEach((row, rowIndex) => {
        if (currentY > 700) {
          // Yeni sayfa
          doc.addPage();
          currentY = 50;
        }

        Object.values(row).forEach((value, colIndex) => {
          const x = 50 + (colIndex * 150);
          doc.text(String(value), x, currentY);
        });
        currentY += 20;
      });
    }

    // Alt bilgi
    doc.fontSize(8).font('Helvetica');
    doc.text(
      `Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`,
      50,
      doc.page.height - 50,
      { align: 'left' }
    );

    // PDF'i bitir
    doc.end();
  } catch (err) {
    console.error('EXPORT_PDF_ERROR', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'PDF çıktısı oluşturulurken bir hata oluştu.'
      });
    }
  }
};
