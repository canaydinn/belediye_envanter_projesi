// admin/assets/js/app/super-admin-dashboard.js
(function () {
  const totalLink = document.querySelector('[data-role="municipality-count"]');
  const activeLink = document.querySelector('[data-role="municipality-active-count"]');

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
          console.log('Aktif belediye endpoint data:', data);

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
})();
