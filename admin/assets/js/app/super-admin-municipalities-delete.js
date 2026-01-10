// admin/assets/js/app/super-admin-municipalities-delete.js
(function () {
  'use strict';

  // Token ve headers

  const headers = {
    'Content-Type': 'application/json',
  };
  const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || '/api';

  // DOM elementleri
  const filterNameInput = document.getElementById('filter-name');
  const filterLocationInput = document.getElementById('filter-location');
  const filterStatusSelect = document.getElementById('filter-status');
  const filterPlanSelect = document.getElementById('filter-plan');
  const filterButton = document.querySelector('button[type="button"].btn-primary');
  const resetButton = document.querySelector('button[type="reset"]');
  const municipalitiesTable = document.querySelector('table.table');
  const municipalitiesTableBody = municipalitiesTable?.querySelector('tbody');

  // API helper
  const fetchJson = (url) =>
    fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`${url} isteği başarısız (status: ${response.status})`);
      }
      return response.json();
    });

  // Filtreleme işlevi
  function filterTable() {
    if (!municipalitiesTableBody) return;

    const nameFilter = (filterNameInput?.value || '').trim().toLowerCase();
    const locationFilter = (filterLocationInput?.value || '').trim().toLowerCase();
    const statusFilter = filterStatusSelect?.value || 'Tümü';
    const planFilter = filterPlanSelect?.value || 'Tümü';

    const rows = municipalitiesTableBody.querySelectorAll('tr[data-municipality-id]');
    let visibleCount = 0;

    rows.forEach((row) => {
      const municipalityName = (row.querySelector('td:nth-child(2)')?.textContent || '').trim().toLowerCase();
      const municipalityLocation = (row.querySelector('td:nth-child(3)')?.textContent || '').trim().toLowerCase();
      const municipalityStatus = row.querySelector('td:nth-child(6) .badge')?.textContent?.trim() || '';
      const municipalityPlan = row.querySelector('td:nth-child(5) .badge')?.textContent?.trim() || '';

      let shouldShow = true;

      // Belediye adı filtresi
      if (nameFilter && !municipalityName.includes(nameFilter)) {
        shouldShow = false;
      }

      // İl/İlçe filtresi
      if (locationFilter && !municipalityLocation.includes(locationFilter)) {
        shouldShow = false;
      }

      // Durum filtresi
      if (statusFilter !== 'Tümü') {
        const statusMap = {
          'Aktif': 'Aktif',
          'Pasif': 'Pasif',
          'Beklemede': 'Beklemede',
        };
        if (municipalityStatus !== statusMap[statusFilter]) {
          shouldShow = false;
        }
      }

      // Plan filtresi
      if (planFilter !== 'Tümü') {
        const planMap = {
          'Deneme': 'Deneme',
          'Standart': 'Standart',
          'Pro': 'Pro',
        };
        if (municipalityPlan !== planMap[planFilter]) {
          shouldShow = false;
        }
      }

      if (shouldShow) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Sonuç mesajı güncelle
    updateResultCount(visibleCount, rows.length);
  }

  // Sonuç sayısını güncelle
  function updateResultCount(visible, total) {
    const footer = municipalitiesTable?.closest('.card')?.querySelector('.card-footer');
    if (footer) {
      const countText = footer.querySelector('small.text-muted');
      if (countText) {
        countText.textContent = `Gösterilen: ${visible} / ${total}`;
      }
    }
  }

  // Form temizleme
  function resetFilters() {
    if (filterNameInput) filterNameInput.value = '';
    if (filterLocationInput) filterLocationInput.value = '';
    if (filterStatusSelect) filterStatusSelect.value = 'Tümü';
    if (filterPlanSelect) filterPlanSelect.value = 'Tümü';
    filterTable();
  }

  // Belediye durumunu değiştir (Pasif Yap / Aktif Yap)
  async function toggleMunicipalityStatus(municipalityId, action) {
    const actionText = action === 'deactivate' ? 'pasif yapmak' : 'aktif yapmak';
    if (!confirm(`Belediyeyi ${actionText} istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const endpoint = action === 'deactivate' ? 'deactivate' : 'activate';
      const response = await fetch(
        `${API_BASE_URL}/superadmin/municipalities/${municipalityId}/${endpoint}`,
        {
          method: 'PATCH',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }

      const successText = action === 'deactivate' ? 'pasif yapıldı' : 'aktif yapıldı';
      alert(`Belediye başarıyla ${successText}.`);
      window.location.reload();
    } catch (err) {
      console.error('Durum değiştirme hatası:', err);
      alert('İşlem sırasında bir hata oluştu.');
    }
  }

  // Event listener'ları ekle
  if (filterButton) {
    filterButton.addEventListener('click', filterTable);
  }

  if (resetButton) {
    resetButton.addEventListener('click', resetFilters);
  }

  // Enter tuşu ile filtreleme
  if (filterNameInput) {
    filterNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        filterTable();
      }
    });
  }

  if (filterLocationInput) {
    filterLocationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        filterTable();
      }
    });
  }

  // Pasif Yap / Aktif Yap butonları için event delegation
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-municipality-id]');
    if (!button) return;

    const municipalityId = button.getAttribute('data-municipality-id');
    if (!municipalityId) return;

    const ariaLabel = button.getAttribute('aria-label') || '';
    
    if (ariaLabel.includes('Pasif Yap')) {
      toggleMunicipalityStatus(municipalityId, 'deactivate');
    } else if (ariaLabel.includes('Aktif Yap')) {
      toggleMunicipalityStatus(municipalityId, 'activate');
    }
  });

  // Sayfa yüklendiğinde başlangıç filtrelemesi
  if (municipalitiesTableBody) {
    const totalRows = municipalitiesTableBody.querySelectorAll('tr[data-municipality-id]').length;
    updateResultCount(totalRows, totalRows);
  }
})();

