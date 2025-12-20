// Assets status distribution
(async () => {
  const els = {
    active: document.querySelector('[data-status-count="active"]'),
    in_maintenance: document.querySelector('[data-status-count="in_maintenance"]'),
    disposed: document.querySelector('[data-status-count="disposed"]'),
    lost: document.querySelector('[data-status-count="lost"]'),
  };

  const setCount = (el, v) => { if (el) el.textContent = Number(v || 0).toLocaleString('tr-TR'); };

  try {
    const data = await apiFetch('/assets/status-distribution', { method: 'GET' });
    const d = data?.distribution || {};
    setCount(els.active, d.active);
    setCount(els.in_maintenance, d.in_maintenance);
    setCount(els.disposed, d.disposed);
    setCount(els.lost, d.lost);
  } catch (err) {
    console.error('Durum dağılımı alınamadı:', err);
    setCount(els.active, 0);
    setCount(els.in_maintenance, 0);
    setCount(els.disposed, 0);
    setCount(els.lost, 0);
  }
})();

