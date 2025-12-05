// admin/assets/js/app/super-admin-logs.js
(function () {
  // KPI kartları
  const totalCountEl = document.getElementById('log-total-count');
  const errorCountEl = document.getElementById('log-error-count');
  const warningCountEl = document.getElementById('log-warning-count');
  const criticalCountEl = document.getElementById('log-critical-count');

  // Tablo gövdesi
  const logsTableBody = document.querySelector('[data-role="logs-table-body"]');
  const logsMetaEl = document.querySelector('[data-role="logs-meta"]');

  // Filtre elemanları
  const municipalitySelect = document.getElementById('logMunicipality');
  const levelSelect = document.getElementById('logLevel');
  const moduleInput = document.getElementById('logModule');
  const userInput = document.getElementById('logUser');
  const dateFromInput = document.getElementById('logDateFrom');
  const dateToInput = document.getElementById('logDateTo');
  const filterBtn = document.getElementById('logFilterBtn');
  const clearBtn = document.getElementById('logClearBtn');

  // Bellekte tutulacak ana dizi
  let allLogs = [];
 // global erişim için
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!token) {
    console.warn('Super admin loglar: token bulunamadı, istekler yetkisiz olabilir.');
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

  function getLevelBadge(level) {
    const normalized = (level || '').toUpperCase();

    if (normalized === 'ERROR') return '<span class="badge badge-light-danger">ERROR</span>';
    if (normalized === 'WARNING') return '<span class="badge badge-light-warning">WARNING</span>';
    if (normalized === 'CRITICAL') return '<span class="badge bg-label-danger">CRITICAL</span>';

    return `<span class="badge badge-light-primary">${normalized || 'INFO'}</span>`;
  }

  function renderStats(stats) {
    if (totalCountEl) totalCountEl.textContent = stats?.total ?? '0';
    if (errorCountEl) errorCountEl.textContent = stats?.error ?? '0';
    if (warningCountEl) warningCountEl.textContent = stats?.warning ?? '0';
    if (criticalCountEl) criticalCountEl.textContent = stats?.critical ?? '0';
  }

  function renderLogs(logs) {
    if (!logsTableBody) return;

    if (!logs || !logs.length) {
      logsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted">Gösterilecek log kaydı bulunamadı.</td>
        </tr>
      `;
      if (logsMetaEl) logsMetaEl.textContent = 'Gösterilen: 0';
      return;
    }

    const rows = logs
      .map((log) => {
        const {
          id,
          created_at: createdAt,
          level,
          municipality_name: municipalityName,
          user_email: userEmail,
          user_name: userName,
          module,
          message,
        } = log;

        const userLabel = userEmail || userName || '-';
        const municipalityLabel = municipalityName || '-';

        return `
          <tr data-log-id="${id}">
            <td>${formatDate(createdAt)}</td>
            <td>${getLevelBadge(level)}</td>
            <td>${municipalityLabel}</td>
            <td>${userLabel}</td>
            <td>${module || '-'}</td>
            <td>${message || '-'}</td>
            <td class="text-center">
              <button class="btn btn-sm btn-icon btn-text-secondary" type="button" disabled>
                <i class="feather icon-eye"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    logsTableBody.innerHTML = rows;

    if (logsMetaEl) {
      logsMetaEl.textContent = `Gösterilen: 1–${logs.length} / ${logs.length}`;
    }
  }

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

  // 🔹 Filtre uygulayan fonksiyon
function applyFilters() {
  if (!Array.isArray(allLogs) || allLogs.length === 0) {
    renderLogs([]);
    return;
  }

  let filtered = [...allLogs];

  // 🔹 Belediye filtresi
  const municipalityValue = (municipalitySelect?.value || '').trim();
  if (municipalityValue && municipalityValue !== 'Tümü') {
    const normalizedFilter = municipalityValue.toLowerCase();

    filtered = filtered.filter((log) => {
      const name = (log.municipality_name || '').toLowerCase();
      return name.includes(normalizedFilter); // "urla" → "urla belediyesi" vb.
    });
  }

  // 🔹 Seviye filtresi (düzeltilmiş)
  const levelRaw = (levelSelect?.value || '').trim();
  if (levelRaw && levelRaw !== 'Tümü') {
    const levelValue = levelRaw.toUpperCase();
    filtered = filtered.filter((log) => {
      const level = (log.level || '').toUpperCase();
      return level === levelValue;
    });
  }

  // 🔹 Modül / endpoint filtresi (şu an HTML'de yok ama dursun)
  const moduleValue = (moduleInput?.value || '').trim().toLowerCase();
  if (moduleValue) {
    filtered = filtered.filter((log) =>
      (log.module || '').toLowerCase().includes(moduleValue)
    );
  }

  // 🔹 Kullanıcı / e-posta filtresi (şu an HTML'de yok ama dursun)
  const userValue = (userInput?.value || '').trim().toLowerCase();
  if (userValue) {
    filtered = filtered.filter((log) => {
      const userLabel = (log.user_email || log.user_name || '').toLowerCase();
      return userLabel.includes(userValue);
    });
  }

  // 🔹 Tarih aralığı (şu an HTML'de yok ama dursun)
  const fromValue = dateFromInput?.value;
  const toValue = dateToInput?.value;

  if (fromValue) {
    const fromDate = new Date(fromValue);
    filtered = filtered.filter((log) => {
      const created = new Date(log.created_at);
      return !Number.isNaN(created.getTime()) && created >= fromDate;
    });
  }

  if (toValue) {
    const toDate = new Date(toValue);
    filtered = filtered.filter((log) => {
      const created = new Date(log.created_at);
      return !Number.isNaN(created.getTime()) && created <= toDate;
    });
  }

  renderLogs(filtered);
}


  // 🔹 İlk yükleme: istatistik + son loglar
  Promise.all([
    fetchJson('http://localhost:4000/api/superadmin/logs/stats'),
    fetchJson('http://localhost:4000/api/superadmin/logs/recent?limit=50'),
  ])
    .then(([stats, logs]) => {
      renderStats(stats);
      allLogs = Array.isArray(logs) ? logs : [];
      renderLogs(allLogs);
    })
    .catch((err) => {
      console.error('Log verileri alınırken hata oluştu:', err);
      if (logsTableBody) {
        logsTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-danger">Log verileri yüklenemedi.</td>
          </tr>
        `;
      }
    });

  // 🔹 Filtre butonu
  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      applyFilters();
    });
  }

  // 🔹 Temizle butonu
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (municipalitySelect) municipalitySelect.value = 'Tümü';
      if (levelSelect) levelSelect.value = 'Tümü';
      if (moduleInput) moduleInput.value = '';
      if (userInput) userInput.value = '';
      if (dateFromInput) dateFromInput.value = '';
      if (dateToInput) dateToInput.value = '';
      renderLogs(allLogs);
    });
  }
})();
