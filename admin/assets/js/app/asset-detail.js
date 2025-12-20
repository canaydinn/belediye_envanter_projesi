// Asset detail page - Load and display asset details
(function () {
  'use strict';

  // URL parametrelerinden varlık ID'sini al
  const params = new URLSearchParams(window.location.search);
  const assetId = params.get('id');

  // Durum etiketleri için mapping
  const statusMap = {
    active: { label: 'Aktif', className: 'badge bg-label-success' },
    in_maintenance: { label: 'Bakımda', className: 'badge bg-label-warning' },
    disposed: { label: 'Hurda', className: 'badge bg-label-danger' },
    lost: { label: 'Pasif', className: 'badge bg-label-secondary' }
  };

  // Tarih formatlama fonksiyonu
  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
  };

  // Tarih formatlama (sadece tarih)
  const formatDateOnly = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('tr-TR');
  };

  // Para formatlama
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Varlık tipi formatlama
  const formatAssetType = (type) => {
    const typeMap = {
      demirbas: 'Demirbaş',
      sarf: 'Sarf Malzeme',
      hizmet: 'Hizmet'
    };
    return typeMap[type] || type || '-';
  };

  // Durum render etme
  const renderStatus = (status) => {
    const key = (status || '').toLowerCase();
    const m = statusMap[key] || { label: status || 'Bilinmiyor', className: 'badge bg-label-secondary' };
    return { label: m.label, className: m.className };
  };

  // Varlık detayını yükle
  async function loadAssetDetail() {
    if (!assetId) {
      showError('Geçerli bir varlık ID\'si bulunamadı.');
      return;
    }

    try {
      const asset = await apiFetch(`/assets/${assetId}`, { method: 'GET' });
      console.log('Varlık detay cevabı:', asset);
      renderAsset(asset);
    } catch (err) {
      console.error('Varlık detayı alınamadı:', err);
      showError('Varlık detayları yüklenemedi. ' + (err.message || ''));
    }
  }

  // Hata göster
  function showError(message) {
    const nameEl = document.querySelector('[data-role="asset-name"]');
    const codeEl = document.querySelector('[data-role="asset-code"]');
    if (nameEl) nameEl.textContent = 'Hata';
    if (codeEl) codeEl.textContent = message;
  }

  // Varlık bilgilerini render et
  function renderAsset(asset) {
    if (!asset) {
      showError('Varlık bulunamadı.');
      return;
    }

    const status = renderStatus(asset.status);

    // Başlık alanları
    const nameEl = document.querySelector('[data-role="asset-name"]');
    const codeEl = document.querySelector('[data-role="asset-code"]');
    if (nameEl) nameEl.textContent = asset.name || '-';
    if (codeEl) codeEl.textContent = asset.asset_code || '-';

    // Durum badge
    const statusEl = document.querySelector('[data-role="asset-status"]');
    if (statusEl) {
      statusEl.textContent = status.label;
      statusEl.className = status.className;
    }

    // Varlık bilgileri
    setFieldValue('asset-name-detail', asset.name);
    setFieldValue('asset-code-detail', asset.asset_code);
    setFieldValue('asset-category', asset.category_name || '-');
    setFieldValue('asset-department', asset.department_name || '-');
    setFieldValue('asset-location', asset.location_name || '-');
    setFieldValue('asset-assigned-user', asset.assigned_user_name || '-');
    setFieldValue('asset-quantity', asset.quantity || '-');
    setFieldValue('asset-unit', asset.unit || '-');
    setFieldValue('asset-serial-number', asset.serial_number || '-');
    setFieldValue('asset-brand', asset.brand || '-');
    setFieldValue('asset-model', asset.model || '-');
    setFieldValue('asset-type', formatAssetType(asset.asset_type));
    setFieldValue('asset-tasinir-code', asset.tasinir_code || '-');
    setFieldValue('asset-purchase-price', asset.purchase_price ? formatCurrency(asset.purchase_price) : '-');
    setFieldValue('asset-purchase-date', formatDateOnly(asset.purchase_date));
    setFieldValue('asset-warranty-end-date', formatDateOnly(asset.warranty_end_date));
    setFieldValue('asset-amortisman-suresi', asset.amortisman_suresi ? `${asset.amortisman_suresi} yıl` : '-');
    setFieldValue('asset-current-value', asset.current_value ? formatCurrency(asset.current_value) : '-');
    setFieldValue('asset-hurda-degeri', asset.hurda_degeri ? formatCurrency(asset.hurda_degeri) : '-');
    setFieldValue('asset-is-movable', asset.is_movable ? 'Evet' : 'Hayır');
    setFieldValue('asset-is-qr-tagged', asset.is_qr_tagged ? 'Evet' : 'Hayır');
    setFieldValue('asset-description', asset.description || '-');

    // Sistem bilgileri
    const statusDetailEl = document.querySelector('[data-role="asset-status-detail"]');
    if (statusDetailEl) {
      statusDetailEl.textContent = status.label;
      statusDetailEl.className = status.className;
    }
    setFieldValue('asset-created', formatDate(asset.created_at));
    setFieldValue('asset-updated', formatDate(asset.updated_at));

    // İşlem butonları
    const editBtn = document.querySelector('[data-role="asset-edit"]');
    if (editBtn) {
      editBtn.href = `/admin/asset-edit.html?id=${asset.id}`;
    }

    const movementsBtn = document.querySelector('[data-role="asset-movements"]');
    if (movementsBtn) {
      movementsBtn.href = `/admin/assets-movements.html?asset_id=${asset.id}`;
    }

    const qrBtn = document.querySelector('[data-role="asset-qr"]');
    if (qrBtn) {
      qrBtn.href = `/admin/asset-qr.html?id=${asset.id}`;
    }
  }

  // Field değerini set et
  function setFieldValue(role, value) {
    const el = document.querySelector(`[data-role="${role}"]`);
    if (el) {
      el.textContent = value || '-';
    }
  }

  // Sayfa yüklendiğinde çalıştır
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAssetDetail);
  } else {
    loadAssetDetail();
  }
})();

