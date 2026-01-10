// Assets list - Load and filter assets
// Tüm varlıkları saklamak için global değişken
let allAssets = [];
let currentUserRoleId = null;

// Filtrele butonuna event listener ekle
document.addEventListener('DOMContentLoaded', async () => {
  // Kullanıcı rolünü al
  if (typeof getCurrentUserRole === 'function') {
    currentUserRoleId = await getCurrentUserRole();
  }
  const filterForm = document.querySelector('form.row.g-3');
  const filterButton = filterForm?.querySelector('button.btn-primary');
  const resetButton = filterForm?.querySelector('button[type="reset"]');
  
  if (!filterButton || !filterForm) {
    console.error('Filtrele butonu veya form bulunamadı');
    return;
  }

  // Varlık listesini yükleyen fonksiyonu parametreli hale getir
  const loadAssets = async (filters = {}) => {
    const tableBody = document.querySelector('[data-role="assets-table-body"]');
    const summary = document.querySelector('[data-role="assets-table-summary"]');
    if (!tableBody) return;

    const statusMap = {
      active: { label: 'Aktif', className: 'badge bg-label-success badge-sm' },
      in_maintenance: { label: 'Bakımda', className: 'badge bg-label-warning badge-sm' },
      disposed: { label: 'Hurda', className: 'badge bg-label-danger badge-sm' },
      lost: { label: 'Pasif', className: 'badge bg-label-secondary badge-sm' }
    };

    const formatDate = (value) => {
      if (!value) return '-';
      const d = new Date(value);
      return Number.isNaN(d.getTime())
        ? '-'
        : d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const renderStatus = (status) => {
      const key = (status || '').toLowerCase();
      const m = statusMap[key] || { label: status || 'Bilinmiyor', className: 'badge bg-label-secondary badge-sm' };
      return `<span class="${m.className}">${m.label}</span>`;
    };

    const buildRow = (asset) => {
      const updatedAt = formatDate(asset?.updated_at || asset?.created_at);
      const approvalBadge = typeof renderApprovalStatusBadge === 'function' 
        ? renderApprovalStatusBadge(asset?.approval_status) 
        : '';
      const approvalButtons = typeof renderApprovalButtons === 'function'
        ? renderApprovalButtons(asset, currentUserRoleId)
        : '';
      
      return `
        <tr data-asset-id="${asset.id}">
          <td>${asset?.asset_code || '-'}</td>
          <td>${asset?.name || '-'}</td>
          <td>${asset?.category_name || '-'}</td>
          <td>${asset?.department_name || '-'}</td>
          <td>${asset?.location_name || '-'}</td>
          <td>${asset?.assigned_user_name || '-'}</td>
          <td>${renderStatus(asset?.status)}</td>
          <td>${approvalBadge}</td>
          <td>${updatedAt}</td>
          <td class="text-center">
            <div class="d-inline-flex gap-1">
              ${approvalButtons}
              <a href="/admin/asset-detail.html?id=${asset.id}" class="btn btn-sm btn-icon btn-text-secondary"><i class="ti ti-eye"></i></a>
              <a href="/admin/asset-edit.html?id=${asset.id}" class="btn btn-sm btn-icon btn-text-secondary" data-role="edit-asset" data-rbac-mode="disable"><i class="ti ti-edit"></i></a>
              <a href="/admin/create-assets-movements.html?asset_id=${asset.id}" class="btn btn-sm btn-icon btn-text-secondary" data-role="create-movement" data-rbac-mode="disable"><i class="ti ti-repeat"></i></a>
              <a href="/admin/asset-qr.html?id=${asset.id}" class="btn btn-sm btn-icon btn-text-secondary"><i class="ti ti-maximize"></i></a>
            </div>
          </td>
        </tr>
      `;
    };

    // İlk yüklemede tüm varlıkları al
    if (allAssets.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Varlıklar yükleniyor...</td></tr>';
      try {
        // approval_status filtresi varsa ekle
        const queryParams = filters.approval_status 
          ? `?approval_status=${filters.approval_status}`
          : '';
        allAssets = await apiFetch(`/assets${queryParams}`, { method: 'GET' });
        if (!Array.isArray(allAssets)) allAssets = [];
      } catch (err) {
        console.error('Varlıklar yüklenemedi:', err);
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Varlık listesi yüklenirken hata oluştu.</td></tr>';
        if (summary) summary.textContent = 'Gösterilen: 0 / 0';
        return;
      }
    }

    // Client-side filtreleme
    let filteredAssets = [...allAssets];

    // İsim/Kod filtresi
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => 
        (asset.name?.toLowerCase().includes(searchTerm) || 
         asset.asset_code?.toLowerCase().includes(searchTerm))
      );
    }

    // Kategori filtresi
    if (filters.category_id) {
      filteredAssets = filteredAssets.filter(asset => 
        String(asset.category_id) === String(filters.category_id)
      );
    }

    // Birim filtresi
    if (filters.department_id) {
      filteredAssets = filteredAssets.filter(asset => 
        String(asset.department_id) === String(filters.department_id)
      );
    }

    // Lokasyon filtresi
    if (filters.location_id) {
      filteredAssets = filteredAssets.filter(asset => 
        String(asset.location_id) === String(filters.location_id)
      );
    }

    // Durum filtresi - Türkçe'den İngilizce'ye çevir ve karşılaştır
    if (filters.status) {
      const statusMapTrToEn = {
        'Aktif': 'active',
        'Pasif': 'lost',
        'Hurda': 'disposed',
        'Bakımda': 'in_maintenance'
      };
      
      // Eğer Türkçe değer geliyorsa İngilizce'ye çevir
      const statusValue = statusMapTrToEn[filters.status] || filters.status.toLowerCase();
      
      filteredAssets = filteredAssets.filter(asset => {
        const assetStatus = (asset.status || '').toLowerCase();
        return assetStatus === statusValue.toLowerCase();
      });
    }

    // Tarih filtresi
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      filteredAssets = filteredAssets.filter(asset => {
        const assetDate = new Date(asset.created_at);
        return assetDate >= fromDate;
      });
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59, 999);
      filteredAssets = filteredAssets.filter(asset => {
        const assetDate = new Date(asset.created_at);
        return assetDate <= toDate;
      });
    }

    // Onay durumu filtresi (client-side)
    if (filters.approval_status) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.approval_status === filters.approval_status
      );
    }

    // Sonuçları göster
    if (!filteredAssets.length) {
      tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Filtre kriterlerine uygun varlık bulunamadı.</td></tr>';
      if (summary) summary.textContent = 'Gösterilen: 0 / 0';
      return;
    }

    tableBody.innerHTML = filteredAssets.map(buildRow).join('');
    if (summary) summary.textContent = `Gösterilen: ${filteredAssets.length} / ${allAssets.length}`;
  };

  // Global loadAssets fonksiyonunu export et (onay işlemlerinden sonra yenileme için)
  window.loadAssets = loadAssets;

  // İlk yükleme
  loadAssets();

  // Filtrele butonuna tıklama olayı
  filterButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Form değerlerini topla
    const filters = {
      name: document.getElementById('filterName')?.value.trim() || null,
      category_id: document.getElementById('filterCategory')?.value || null,
      department_id: document.getElementById('filterDepartment')?.value || null,
      location_id: document.getElementById('filterLocation')?.value || null,
      status: document.getElementById('filterStatus')?.value || null,
      approval_status: document.getElementById('filterApprovalStatus')?.value || null,
      date_from: document.getElementById('filterDateFrom')?.value || null,
      date_to: document.getElementById('filterDateTo')?.value || null
    };

    // Boş değerleri temizle
    Object.keys(filters).forEach(key => {
      if (!filters[key] || filters[key] === '' || filters[key] === 'Tümü') {
        delete filters[key];
      }
    });

    // Varlıkları filtrelerle yükle
    await loadAssets(filters);
  });

  // Temizle butonuna tıklama olayı
  if (resetButton) {
    resetButton.addEventListener('click', async (e) => {
      e.preventDefault();
      filterForm.reset();
      await loadAssets();
    });
  }
});

