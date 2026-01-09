document.addEventListener('DOMContentLoaded', async () => {
  const locationSelect = document.getElementById('location_id');
  if (!locationSelect) return;

  const API_BASE_URL = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seçiniz';

  try {
    const response = await fetch(`${API_BASE_URL}/api/locations?is_active=true`, {
      method: 'GET',
      credentials: 'include', // cookie ile auth
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 401 ise login'e yönlendirin veya mesaj basın
    if (response.status === 401) {
      locationSelect.replaceChildren();
      const opt = document.createElement('option');
      opt.textContent = 'Oturum süresi dolmuş. Lütfen giriş yapın.';
      locationSelect.appendChild(opt);
      return;
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Lokasyon isteği başarısız:', response.status, errText);
      throw new Error('Lokasyonlar alınamadı');
    }

    const payload = await response.json();
    const locations = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
      ? payload
      : [];

    locationSelect.replaceChildren();
    locationSelect.appendChild(defaultOption);

    locations.forEach((loc) => {
      const option = document.createElement('option');
      option.value = loc.id;
      option.textContent = loc.name || loc.code || `Lokasyon #${loc.id}`;
      locationSelect.appendChild(option);
    });

    if (locations.length === 0) {
      locationSelect.replaceChildren();
      const empty = document.createElement('option');
      empty.textContent = 'Aktif lokasyon bulunamadı';
      locationSelect.appendChild(empty);
    }
  } catch (error) {
    console.error('Lokasyon listesi yüklenirken hata:', error);
    locationSelect.replaceChildren();
    const opt = document.createElement('option');
    opt.textContent = 'Lokasyonlar yüklenemedi';
    locationSelect.appendChild(opt);
  }
});

