document.addEventListener('DOMContentLoaded', () => {
  const filterForm = document.getElementById('user-filter-form');
  const nameInput = document.getElementById('filter-name');
  const emailInput = document.getElementById('filter-email');
  const municipalitySelect = document.getElementById('filter-municipality');
  const roleSelect = document.getElementById('filter-role');
  const statusSelect = document.getElementById('filter-status');

  const applyFilters = () => {
    const nameValue = nameInput.value.trim().toLowerCase();
    const emailValue = emailInput.value.trim().toLowerCase();
    const municipalityValue = municipalitySelect.value.trim().toLowerCase();
    const roleValue = roleSelect.value.trim();      // superadmin / manager / unit / staff
    const statusValue = statusSelect.value.trim();  // active / passive / pending

    const tableBody = document.getElementById('users-table-body');
    const tableRows = tableBody.querySelectorAll('tr');

    tableRows.forEach((row) => {
      const nameCell = row.querySelector('td:nth-child(2)');
      const emailCell = row.querySelector('td:nth-child(3)');
      const municipalityCell = row.querySelector('td:nth-child(4)');
      const roleCell = row.querySelector('td:nth-child(5)');
      const statusCell = row.querySelector('td:nth-child(6)');

      // Placeholder satırı (örneğin "Kullanıcılar yükleniyor...") ise doğrudan gösterelim
      if (!nameCell || !emailCell || !municipalityCell || !roleCell || !statusCell) {
        row.style.display = '';
        return;
      }

      const nameText = nameCell.textContent.toLowerCase();
      const emailText = emailCell.textContent.toLowerCase();
      const municipalityText = municipalityCell.textContent.toLowerCase();
      const roleText = roleCell.textContent.toLowerCase();
      const statusText = statusCell.textContent.toLowerCase();

      // Ad / Soyad filtresi (içeriyorsa geçsin)
      const matchName =
        !nameValue || nameText.includes(nameValue);

      // E-posta filtresi
      const matchEmail =
        !emailValue || emailText.includes(emailValue);

      // Belediye filtresi (select value: "urla", "konak", "yenisehir"
      // tablo: "Urla Belediyesi" vb. => substring kontrolü iş görür)
      const matchMunicipality =
        !municipalityValue || municipalityText.includes(municipalityValue);

      // Rol filtresi – select value'larını role yazılarındaki ifadelere map edelim
      let matchRole = true;
      if (roleValue) {
        if (roleValue === 'superadmin') {
          matchRole = roleText.includes('superadmin');
        } else if (roleValue === 'manager') {
          // "Belediye Yöneticisi" ifadesini yakalamak için
          matchRole = roleText.includes('yönetici');
        } else if (roleValue === 'unit') {
          matchRole = roleText.includes('birim');
        } else if (roleValue === 'staff') {
          matchRole = roleText.includes('personel') || roleText.includes('staff');
        }
      }

      // Durum filtresi – tablo: "Aktif", "Pasif" (ileride "Beklemede" de gelebilir)
      let matchStatus = true;
      if (statusValue) {
        if (statusValue === 'active') {
          matchStatus = statusText.includes('aktif');
        } else if (statusValue === 'passive') {
          matchStatus = statusText.includes('pasif');
        } else if (statusValue === 'pending') {
          matchStatus = statusText.includes('beklemede');
        }
      }

      const visible =
        matchName &&
        matchEmail &&
        matchMunicipality &&
        matchRole &&
        matchStatus;

      row.style.display = visible ? '' : 'none';
    });
  };

  filterForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });

  filterForm?.addEventListener('reset', () => {
    // reset ile inputlar temizlendikten sonra tüm satırları tekrar göster
    setTimeout(applyFilters, 0);
  });
});

