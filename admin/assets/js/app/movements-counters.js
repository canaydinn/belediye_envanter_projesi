// Counter loading functions for asset movements

async function fetchMovementTotal(endpoint) {
  const data = await apiFetch(endpoint, { method: 'GET' });
  return Number(data?.total ?? data?.count ?? 0);
}

async function loadMovementCounters() {
  const counters = [
    { id: 'last_30_movements', endpoint: '/asset-movements/stats/last-30-days' },
    { id: 'today_movements', endpoint: '/asset-movements/stats/today' },
    { id: 'maintenance_movements', endpoint: '/asset-movements/stats/maintenance' },
    { id: 'zimmet_movements', endpoint: '/asset-movements/stats/zimmet' }
  ];

  const results = await Promise.allSettled(
    counters.map(c => fetchMovementTotal(c.endpoint))
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const el = document.getElementById(counters[i].id);
      if (el) el.textContent = r.value;
    }
  });
}

