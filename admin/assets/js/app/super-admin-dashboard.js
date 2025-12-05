// admin/assets/js/app/super-admin-dashboard.js
(function () {
  const totalLink = document.querySelector('[data-role="municipality-count"]');
  const activeLink = document.querySelector('[data-role="municipality-active-count"]');
  const pendingLink = document.querySelector('[data-role="municipality-pending-count"]');
  const totalUserLink = document.querySelector('[data-role="total-user-count"]');
  const municipalityTableBody = document.querySelector('[data-role="municipality-table-body"]');
  const standardPlanBadge = document.querySelector('[data-role="standard-plan-count"]');
  const proPlanBadge = document.querySelector('[data-role="pro-plan-count"]');
  const denemePlanBadge = document.querySelector('[data-role="deneme-plan-count"]');
  const recentLogsContainer = document.querySelector('[data-role="recent-logs"]');
  const createForm = document.querySelector('[data-role="municipality-create-form"]');
  const feedbackEl = document.querySelector('[data-role="municipality-create-feedback"]');
  const submitBtn = document.querySelector('[data-role="municipality-create-submit"]');
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!token) {
    console.warn('Dashboard: token bulunamadı, sayaçlar güncellenemiyor.');
  }

  // Ortak fetch helper
  function fetchJson(url) {
    return fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`${url} isteği başarısız (status: ${response.status})`);
      }
      return response.json();
    });
  }
  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }
function createStatusBadge(status, isActive) {
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
  }
function renderMunicipalityRows(municipalities) {
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
          ? `<a href="/superadmin-municipalities.html?id=${id}" class="btn btn-sm btn-outline-primary">Detay</a>`
          : '';

        const usersLink = id
          ? `<a href="/superadmin-users.html?municipality_id=${id}" class="btn btn-sm btn-outline-info">Kullanıcılar</a>`
          : '';

        const editLink = id
          ? `<a href="/superadmin-municipality-edit.html?id=${id}" class="btn btn-sm btn-outline-secondary">Düzenle</a>`
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
            <td class="d-flex gap-1 flex-wrap">${detailLink} ${usersLink} ${editLink} ${deactivateButton}</td>
          </tr>
        `;
      })
      .join('');

    municipalityTableBody.innerHTML = rows;
  }

  // 1) Toplam belediye sayısı
  if (totalLink) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities/count')
      .then((data) => {
        // Backend: { totalMunicipalities: 3 } veya { count: 3 }
        const total =
          data?.totalMunicipalities ??
          data?.count ??
          0;

        totalLink.textContent = total;
      })
      .catch((err) => {
        console.error('Toplam belediye sayısı alınamadı:', err);
      });
  } else {
    console.warn('Toplam belediye sayısı öğesi bulunamadı');
  }

  // 2) Aktif belediye sayısı
  if (activeLink) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities/active/count')
      .then((data) => {
        // Örnek: { activeMunicipalities: 2 } veya { count: 2 }

        const active =
          data?.total_active_municipalities ??
          data?.count ??
          0;

        activeLink.textContent = active;
      })
      .catch((err) => {
        console.error('Aktif belediye sayısı alınamadı:', err);
      });
  } else {
    console.warn('Aktif belediye sayısı öğesi bulunamadı');
  }


// 3) Onay Bekleyen belediye sayısı
  if (pendingLink) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities/pending/count')
      .then((data) => {
        // Backend: { totalMunicipalities: 3 } veya { count: 3 }
        const total =
          data?.total_pending_municipalities ??
          data?.count ??
          0;

        pendingLink.textContent = total;
      })
      .catch((err) => {
        console.error('Toplam belediye sayısı alınamadı:', err);
      });
  } else {
    console.warn('Toplam belediye sayısı öğesi bulunamadı');
  }
  
// 3) Toplam Kullanıcı sayısı
  if (totalUserLink) {
    fetchJson('http://localhost:4000/api/superadmin/users/count')
      .then((data) => {
        // Backend: { totalMunicipalities: 3 } veya { count: 3 }

        const total =
          data?.totalUsers ??
          data?.count ??
          0;

        totalUserLink.textContent = total;
      })
      .catch((err) => {
        console.error('Toplam Kullanıcı sayısı alınamadı:', err);
      });
  } else {
    console.warn('Toplam kullanıcı sayısı öğesi bulunamadı');
  }

    if (municipalityTableBody) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities')
      .then((data) => {
        renderMunicipalityRows(data);
      })
      .catch((err) => {
        console.error('Belediye listesi alınamadı:', err);
        municipalityTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-danger">Belediye listesi yüklenemedi.</td>
          </tr>
        `;
      });
  } else {
    console.warn('Belediye tablosu gövdesi bulunamadı');
  }
 // 3) Standart plan belediye sayısı
  if (standardPlanBadge) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities/plan/standard')
      .then((data) => {
        const standardCount = Array.isArray(data) ? data.length : data?.count ?? 0;
        standardPlanBadge.textContent = `${standardCount} belediye`;
      })
      .catch((err) => {
        console.error('Standart plan belediye sayısı alınamadı:', err);
      });
  } else {
    console.warn('Standart plan badge öğesi bulunamadı');
  }
  // 3) Pro plan belediye sayısı
  if (proPlanBadge) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities/plan/pro')
      .then((data) => {
        const proCount = Array.isArray(data) ? data.length : data?.count ?? 0;
        proPlanBadge.textContent = `${proCount} belediye`;
      })
      .catch((err) => {
        console.error('Pro plan belediye sayısı alınamadı:', err);
      });
  } else {
    console.warn('Pro plan badge öğesi bulunamadı');
  }
  // 3) Pro plan belediye sayısı
  if (denemePlanBadge) {
    fetchJson('http://localhost:4000/api/superadmin/municipalities/plan/deneme')
      .then((data) => {
        const denemeCount = Array.isArray(data) ? data.length : data?.count ?? 0;
        denemePlanBadge.textContent = `${denemeCount} belediye`;
      })
      .catch((err) => {
        console.error('Deneme plan belediye sayısı alınamadı:', err);
      });
  } else {
    console.warn('Deneme plan badge öğesi bulunamadı');
  }



  
  // 3) Son aktiviteler
  function formatDate(dateString) {
    if (!dateString) return 'Zaman bilgisi yok';

    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime())
      ? 'Zaman bilgisi yok'
      : parsed.toLocaleString('tr-TR', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
  }

  function getLogVisual(log = {}) {
    const level = (log.level || log.status || '').toString().toLowerCase();

    if (level.includes('error') || level.includes('fail')) {
      return { color: 'danger', icon: 'feather icon-alert-triangle' };
    }

    if (level.includes('warn')) {
      return { color: 'warning', icon: 'feather icon-alert-triangle' };
    }

    if (level.includes('success')) {
      return { color: 'success', icon: 'feather icon-check-circle' };
    }

    return { color: 'primary', icon: 'feather icon-activity' };
  }

  function renderRecentLogs(logs) {
    if (!recentLogsContainer) return;

    recentLogsContainer.innerHTML = '';

    if (!Array.isArray(logs) || logs.length === 0) {
      recentLogsContainer.innerHTML = '<div class="list-group-item text-center text-muted">Kayıt bulunamadı</div>';
      return;
    }

    logs.forEach((log) => {
      const { color, icon } = getLogVisual(log);
      const description =
        log.message ||
        log.action ||
        log.description ||
        log.event ||
        'Aktivite kaydı';

      const actor = log.user || log.username || log.user_email || log.actor || log.created_by || 'Sistem';
      const municipality = log.municipality_name || log.municipality || log.city || '';
      const metaParts = [actor, municipality].filter(Boolean);
      const metaText = metaParts.join(' • ');

      const item = document.createElement('div');
      item.className = 'list-group-item';

      const wrapper = document.createElement('div');
      wrapper.className = 'd-flex';

      const avatar = document.createElement('div');
      avatar.className = 'avatar flex-shrink-0 me-3';
      const avatarSpan = document.createElement('span');
      avatarSpan.className = `avatar-initial rounded-circle bg-label-${color}`;
      const iconEl = document.createElement('i');
      iconEl.className = icon;
      avatarSpan.appendChild(iconEl);
      avatar.appendChild(avatarSpan);

      const textWrapper = document.createElement('div');
      textWrapper.className = 'd-flex flex-column flex-grow-1';

      const title = document.createElement('h6');
      title.className = 'mb-1';
      title.textContent = description;

      const meta = document.createElement('small');
      meta.className = 'text-muted';
      meta.textContent = metaText || 'Sistem';

      const time = document.createElement('small');
      time.className = 'text-muted';
      time.textContent = formatDate(log.created_at);

      textWrapper.appendChild(title);
      textWrapper.appendChild(meta);
      textWrapper.appendChild(time);

      wrapper.appendChild(avatar);
      wrapper.appendChild(textWrapper);

      item.appendChild(wrapper);
      recentLogsContainer.appendChild(item);
    });
  }

  if (recentLogsContainer) {
    fetchJson('http://localhost:4000/api/superadmin/logs/recent')
      .then(renderRecentLogs)
      .catch((err) => {
        console.error('Son aktiviteler alınamadı:', err);
        recentLogsContainer.innerHTML = '<div class="list-group-item text-center text-danger">Son aktiviteler yüklenemedi</div>';
      });
  } else {
    console.warn('Son aktiviteler bölümü bulunamadı');
  }

const showFeedback = (type, message) => {
    if (!feedbackEl) return;

    feedbackEl.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
    feedbackEl.classList.add(`alert-${type}`);
    feedbackEl.textContent = message;
  };

  const toPayload = (formData) => {
    const payload = {};

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        payload[key] = trimmed === '' ? null : trimmed;
      } else {
        payload[key] = value;
      }
    });

    return payload;
  };

  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Kaydediliyor...';
      }

      const formData = new FormData(createForm);
      const payload = toPayload(formData);

      try {
        const response = await fetch('http://localhost:4000/api/superadmin/municipalities/create', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data?.message || 'Belediye kaydedilemedi, lütfen bilgileri kontrol edin.';
          throw new Error(errorMessage);
        }

        showFeedback('success', 'Belediye başarıyla oluşturuldu.');
        createForm.reset();
      } catch (error) {
        console.error('Belediye oluşturma hatası:', error);
        showFeedback('danger', error.message || 'Beklenmeyen bir hata oluştu.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Kaydet';
        }
      }
    });
  }





})();


