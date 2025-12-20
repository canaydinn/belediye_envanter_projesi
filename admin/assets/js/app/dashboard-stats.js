// Dashboard: İstatistikler (sayaçlar ve metrikler)
(async () => {
  const setCount = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = Number.isFinite(value) ? value : '-';
  };

  const setMetric = (selector, value, suffix = '') => {
    const el = document.querySelector(selector);
    if (!el) return;
    el.textContent = Number.isFinite(value)
      ? `${value.toLocaleString('tr-TR')}${suffix}`
      : '-';
  };

  try {
    const data = await apiFetch('/dashboard/stats');
    const totals = data?.totals || {};
    const a = data?.assets || {};
    const qr = a.qrTagged || {};

    // Sayaçlar
    setCount('[data-role="dashboard-total-users"]', totals.users);
    setCount('[data-role="dashboard-total-departments"]', totals.departments);
    setCount('[data-role="dashboard-total-locations"]', totals.locations);

    // Metrikler
    setMetric('[data-dashboard="total-assets"]', a.total);
    setMetric('[data-dashboard="moved-last-30-days"]', a.movedLast30Days);
    setMetric('[data-dashboard="maintenance-needed"]', a.maintenanceNeeded);
    setMetric('[data-dashboard="qr-ratio"]', qr.percentage, '%');
  } catch (err) {
    console.error('Dashboard istatistikleri alınamadı:', err);
  }
})();

