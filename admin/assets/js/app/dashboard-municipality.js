// Dashboard: Belediye bilgisi yükleme
(async () => {
  try {
    const data = await apiFetch('/dashboard/municipality');

    const name = data?.name || 'Belediye';
    const location = [data?.province, data?.district].filter(Boolean).join(' / ') || '—';

    const municipalityNameEl = document.getElementById('municipalityName');
    if (municipalityNameEl) municipalityNameEl.textContent = name;
    
    const navbarMunicipalityNameEl = document.getElementById('navbarMunicipalityName');
    if (navbarMunicipalityNameEl) navbarMunicipalityNameEl.textContent = name;
    
    const municipalityLocationEl = document.getElementById('municipalityLocation');
    if (municipalityLocationEl) municipalityLocationEl.textContent = location;
  } catch (err) {
    console.error('Belediye bilgisi alınamadı:', err);
  }
})();

