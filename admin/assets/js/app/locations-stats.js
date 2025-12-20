// Locations statistics - Load location statistics and type distribution

async function loadLocationStats() {
  try {
    const res = await apiFetch('/locations/stats');

    // controller: { totals: { locations, active_locations, warehouses }, dense_location }
    const totals = res?.totals || {};

    const elTotal = document.getElementById('total_locations');
    if (elTotal) elTotal.textContent = totals.locations ?? 0;

    const elActive = document.getElementById('total_active_location');
    if (elActive) elActive.textContent = totals.active_locations ?? 0;

    const elWarehouse = document.getElementById('total_warehouse');
    if (elWarehouse) elWarehouse.textContent = totals.warehouses ?? 0;

    const elDense = document.getElementById('dense_location');
    if (elDense) elDense.textContent = res?.dense_location?.name || '-';
  } catch (e) {
    console.error('Lokasyon istatistikleri yüklenemedi:', e);
  }
}

async function loadLocationTypeDistribution() {
  try {
    const res = await apiFetch('/locations/type-distribution');
    const dist = res?.distribution || {};

    const set = (key, value) => {
      const el = document.querySelector(`[data-location-type="${key}"]`);
      if (el) el.textContent = Number(value ?? 0);
    };

    set('office', dist.office);
    set('warehouse', dist.warehouse);
    set('open_area', dist.open_area);
    set('building', dist.building);
  } catch (e) {
    console.error('Lokasyon tipi dağılımı yüklenemedi:', e);

    // İsterseniz hata halinde 0 basın:
    ['building','warehouse','open_area','site_office','other'].forEach(k => {
      const el = document.querySelector(`[data-location-type="${k}"]`);
      if (el) el.textContent = '-';
    });
  }
}

