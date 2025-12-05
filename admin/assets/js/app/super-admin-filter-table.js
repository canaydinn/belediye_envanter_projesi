  const municipalityTableBody = document.querySelector('[data-role="municipality-table-body"]');
  const municipalitySearchInput = document.getElementById('municipalitySearch');
  const municipalityStatusFilter = document.getElementById('statusFilter');
  const municipalityFilterButton = document.querySelector('[data-role="municipality-filter"]');
 const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

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

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const createStatusBadge = (status, isActive) => {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus === 'active' || isActive) {
      return '<span class="badge bg-label-success">Aktif</span>';
    }

    if (normalizedStatus === 'pending') {
      return '<span class="badge bg-label-warning">Beklemede</span>';
    }

    if (normalizedStatus === 'suspended') {
      return '<span class="badge bg-label-secondary">Pasif</span>';
    }

    return '<span class="badge bg-label-secondary">Bilinmiyor</span>';
  };

  const renderMunicipalityRows = (municipalities) => {
    if (!municipalityTableBody) return;

    if (!municipalities?.length) {
      municipalityTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">Belediye bulunamadı.</td>
        </tr>
      `;
      return;
    }

    const rows = municipalities
      .map((municipality) => {
        const {
          id,
          name,
          province,
          district,
          status,
          is_active: isActive,
          quota_end_date: quotaEndDate,
          license_end_date: licenseEndDate,
          created_at: createdAt,
        } = municipality;

        const location = [province, district].filter(Boolean).join(' / ') || '-';

        const detailLink = id
          ? `<a href="/admin/super-admin-municipalities-detail.html?id=${id}" class="btn btn-sm btn-outline-primary">Detay</a>`
          : '';

        const usersLink = id
          ? `<a href="/super-admin-users.html?municipality_id=${id}" class="btn btn-sm btn-outline-info">Kullanıcılar</a>`
          : '';

        const editLink = id
          ? `<a href="/admin/super-admin-municipalities-edit.html?id=${id}" class="btn btn-sm btn-outline-secondary">Düzenle</a>`
          : '';

        const deactivateButton = id
          ? `<button type="button" class="btn btn-sm btn-outline-warning" data-role="municipality-deactivate" data-municipality-id="${id}">Pasif Yap</button>`
          : '';

        const statusBadge = createStatusBadge(status, isActive);
        const licenseInfo = licenseEndDate || quotaEndDate;

        return `
          <tr data-municipality-id="${id ?? ''}">
            <td>${name || '-'}</td>
            <td>${location}</td>
            <td class="text-muted">-</td>
            <td>${statusBadge}</td>
            <td class="text-muted">-</td>
            <td>${formatDate(licenseInfo || createdAt)}</td>
            <td class="d-flex gap-1 flex-wrap">${detailLink}  ${editLink} ${deactivateButton}</td>
          </tr>
        `;
      })
      .join('');

    municipalityTableBody.innerHTML = rows;
  };

  const normalizeStatusForFilter = (status) => {
    const normalized = (status || '').toString().toLowerCase();

    if (['active', 'pending', 'suspended'].includes(normalized)) {
      return normalized;
    }

    return normalized;
  };

  const filterMunicipalities = (municipalities) => {
    let filteredList = Array.isArray(municipalities) ? [...municipalities] : [];

    const searchTerm = (municipalitySearchInput?.value || '').trim().toLowerCase();
    const selectedStatus = (municipalityStatusFilter?.value || 'all').toLowerCase();

    if (searchTerm) {
      filteredList = filteredList.filter((municipality) => {
        const name = (municipality?.name || '').toString().toLowerCase();
        return name.includes(searchTerm);
      });
    }

    if (selectedStatus !== 'all') {
      filteredList = filteredList.filter((municipality) => {
        const municipalityStatus = normalizeStatusForFilter(municipality?.status);
        const isActive = Boolean(municipality?.is_active);

        if (selectedStatus === 'active') {
          return municipalityStatus === 'active' || isActive;
        }

        if (selectedStatus === 'pending') {
          return municipalityStatus === 'pending';
        }

        if (selectedStatus === 'suspended') {
          return municipalityStatus === 'suspended' || (!isActive && municipalityStatus !== 'active');
        }

        return true;
      });
    }

    return filteredList;
  };

  let municipalityCache = [];

  const renderFilteredMunicipalities = () => {
    if (!municipalityTableBody) return;
    renderMunicipalityRows(filterMunicipalities(municipalityCache));
  };

  const attachMunicipalityFilters = () => {
    if (municipalityFilterButton) {
      municipalityFilterButton.addEventListener('click', renderFilteredMunicipalities);
    }

    if (municipalityStatusFilter) {
      municipalityStatusFilter.addEventListener('change', renderFilteredMunicipalities);
    }

    if (municipalitySearchInput) {
      municipalitySearchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          renderFilteredMunicipalities();
        }
      });
    }
  };

  attachMunicipalityFilters();

  if (municipalityTableBody) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities')
      .then((data) => {
        municipalityCache = Array.isArray(data)
          ? data
          : Array.isArray(data?.municipalities)
            ? data.municipalities
            : [];

        renderFilteredMunicipalities();
      })
      .catch((err) => {
        console.error('Belediye listesi alınamadı:', err);
        municipalityCache = [];
        municipalityTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-danger">Belediye listesi yüklenemedi.</td>
          </tr>
        `;
      });
  }

