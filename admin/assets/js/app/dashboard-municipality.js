// Dashboard: Belediye bilgisi yükleme
(async () => {
  try {
    const data = await apiFetch('/dashboard/municipality');

    const name = data?.name || 'Belediye';
    const location = [data?.province, data?.district].filter(Boolean).join(' / ') || '—';

    document.getElementById('municipalityName')?.textContent = name;
    document.getElementById('navbarMunicipalityName')?.textContent = name;
    document.getElementById('municipalityLocation')?.textContent = location;
  } catch (err) {
    console.error('Belediye bilgisi alınamadı:', err);
  }
})();

