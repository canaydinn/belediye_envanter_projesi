// Locations list - Load and display locations

async function loadLocations(params = new URLSearchParams()) {
  const tableBody = document.getElementById('locations-table-body');
  const summary = document.querySelector('[data-role="locations-summary"]');
  if (!tableBody) return;

  tableBody.innerHTML =
    '<tr><td colspan="8" class="text-center text-muted">Yükleniyor...</td></tr>';

  try {
    const qs = params.toString();
    const resp = await apiFetch(qs ? `/locations?${qs}` : '/locations');

    const locations = Array.isArray(resp) ? resp : (resp?.data || []);
    const total = Array.isArray(resp) ? locations.length : (resp?.total ?? locations.length);

    if (locations.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="8" class="text-center text-muted">Lokasyon bulunamadı.</td></tr>';
      if (summary) summary.textContent = 'Gösterilen: 0 / 0';
      return;
    }

    // Tip kodlarını etikete çevirelim (1 Ofis, 2 Depo, 3 Saha Ofisi, 4 Bina)
    const typeLabel = (t) => {
      const n = Number(t);
      if (n === 1) return 'Ofis';
      if (n === 2) return 'Depo';
      if (n === 3) return 'Saha Ofisi';
      if (n === 4) return 'Bina';
      return '-';
    };

    tableBody.innerHTML = locations.map((loc) => `
      <tr data-location-id="${loc.id}">
        <td>${loc.code ?? '-'}</td>
        <td>${loc.name ?? '-'}</td>
        <td>${typeLabel(loc.type)}</td>
        <td>${loc.department_name ?? '-'}</td>
        <td>${loc.address ?? '-'}</td>
        <td>${Number(loc.asset_count ?? 0)}</td>
        <td>${loc.is_active ? 'Aktif' : 'Pasif'}</td>
        <td class="text-center">
          <div class="d-flex gap-1 justify-content-center">
            <a href="location-detail.html?id=${loc.id}" class="btn btn-sm btn-icon btn-text-info" title="Detaylar">
              <i class="ti ti-eye"></i>
            </a>
            <a href="location-edit.html?id=${loc.id}" class="btn btn-sm btn-icon btn-text-secondary" title="Düzenle" data-role="edit-location" data-rbac-mode="disable">
              <i class="ti ti-edit"></i>
            </a>
            <a href="location-delete.html?id=${loc.id}" class="btn btn-sm btn-icon btn-text-danger" title="Sil" data-role="delete-location" data-rbac-mode="disable">
              <i class="ti ti-trash"></i>
            </a>
          </div>
        </td>
      </tr>
    `).join('');

    // Delete butonlarına event listener ekle
    document.querySelectorAll('.delete-location').forEach(btn => {
      btn.addEventListener('click', handleDeleteLocation);
    });

    if (summary) summary.textContent = `Gösterilen: ${locations.length} / ${total}`;
  } catch (error) {
    console.error('Lokasyonlar yüklenemedi:', error);
    tableBody.innerHTML =
      '<tr><td colspan="8" class="text-center text-danger">Lokasyonlar yüklenemedi.</td></tr>';
    if (summary) summary.textContent = 'Gösterilen: 0 / 0';
  }
}

// Lokasyon silme işlemi
async function handleDeleteLocation(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.currentTarget;
  const locationId = button.getAttribute('data-location-id');
  const locationName = button.getAttribute('data-location-name');

  if (!locationId) {
    console.error('Lokasyon ID bulunamadı');
    return;
  }

  // Focus'u butondan kaldır (accessibility sorununu önlemek için)
  button.blur();

  // SweetAlert2 ile onay iste
  if (typeof Swal !== 'undefined') {
    try {
      const result = await Swal.fire({
        title: 'Emin misiniz?',
        text: `"${locationName}" lokasyonu kalıcı olarak silinecek. Bu işlem geri alınamaz!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal',
        customClass: {
          confirmButton: 'btn btn-primary me-2',
          cancelButton: 'btn btn-label-secondary'
        },
        buttonsStyling: false
      });

      if (!result.isConfirmed) {
        return;
      }
    } catch (error) {
      console.error('SweetAlert2 hatası:', error);
      // Hata durumunda basit confirm kullan
      if (!confirm(`"${locationName}" lokasyonunu silmek istediğinize emin misiniz?`)) {
        return;
      }
    }
  } else {
    // SweetAlert2 yoksa basit confirm kullan
    if (!confirm(`"${locationName}" lokasyonunu silmek istediğinize emin misiniz?`)) {
      return;
    }
  }

  try {

    const response = await fetch(`/api/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      let errorMsg = 'Lokasyon silinemedi.';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {}

      if (typeof Swal !== 'undefined') {
        await Swal.fire({
          icon: 'error',
          title: 'Hata',
          text: errorMsg,
          customClass: {
            confirmButton: 'btn btn-success'
          }
        });
      } else {
        alert(errorMsg);
      }
      return;
    }

    // Başarılı silme
    if (typeof Swal !== 'undefined') {
      await Swal.fire({
        icon: 'success',
        title: 'Silindi!',
        text: 'Lokasyon başarıyla silindi.',
        customClass: {
          confirmButton: 'btn btn-success'
        }
      });
    } else {
      alert('Lokasyon başarıyla silindi.');
    }

    // Listeyi yenile
    const currentParams = new URLSearchParams(window.location.search);
    loadLocations(currentParams);
  } catch (error) {
    console.error('Lokasyon silme hatası:', error);
    const errorMsg = 'Lokasyon silinirken bir hata oluştu.';
    
    if (typeof Swal !== 'undefined') {
      await Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: errorMsg,
        customClass: {
          confirmButton: 'btn btn-success'
        }
      });
    } else {
      alert(errorMsg);
    }
  }
}

// Expose for module-to-module coordination (init/filters)
window.loadLocations = loadLocations;

