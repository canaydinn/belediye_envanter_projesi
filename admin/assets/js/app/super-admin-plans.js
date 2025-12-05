// admin/assets/js/app/super-admin-plans.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('[plans] DOM yüklendi, script çalıştı');

  const labels = {
    active: document.getElementById('aktif_plan_sayisi'),
    pro: document.getElementById('pro_plan_sayisi'),
    standard: document.getElementById('standart_plan_sayisi'),
    deneme: document.getElementById('deneme_plan_sayisi'),
  };

  const tableBody = document.getElementById('plan-municipality-table-body');

  // Basit koruma
  if (!labels.active || !labels.pro || !labels.standard || !labels.deneme) {
    console.warn('[plans] Plan label elementlerinden biri/birkaçı bulunamadı');
  }
  if (!tableBody) {
    console.warn('[plans] plan-municipality-table-body bulunamadı');
  }

  const planCountBadges = document.querySelectorAll('[data-plan-count]');
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  function setText(element, value) {
    if (!element) return;
    element.textContent = value;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('tr-TR');
  }

  function getPlanBadge(planType) {
    const type = (planType || '').toLowerCase();
    if (type === 'pro') return '<span class="badge bg-label-success">Pro</span>';
    if (type === 'standard' || type === 'standart')
      return '<span class="badge bg-label-info">Standart</span>';
    if (type === 'deneme' || type === 'trial')
      return '<span class="badge bg-label-warning">Deneme</span>';
    return '<span class="badge bg-label-secondary">Bilinmiyor</span>';
  }

  function getStatusBadge(isActive, statusTextRaw) {
    // is_active boolean varsa onu kullan, yoksa status metninden oku
    if (typeof isActive === 'boolean') {
      if (isActive) {
        return '<span class="badge bg-label-success">Aktif</span>';
      }
      return '<span class="badge bg-label-secondary">Pasif</span>';
    }

    const statusText = (statusTextRaw || '').toLowerCase();
    if (statusText.includes('aktif')) {
      return '<span class="badge bg-label-success">Aktif</span>';
    }
    if (statusText.includes('pasif')) {
      return '<span class="badge bg-label-secondary">Pasif</span>';
    }
    if (statusText.includes('bekle')) {
      return '<span class="badge bg-label-warning">Beklemede</span>';
    }
    return '<span class="badge bg-label-secondary">Bilinmiyor</span>';
  }

  function updatePlanBadges(counts) {
    if (!planCountBadges.length) return;

    planCountBadges.forEach((badge) => {
      const planType = (badge.dataset.planCount || '').toLowerCase();
      const value = counts[planType];
      if (typeof value === 'number') {
        badge.textContent = value;
      }
    });
  }

  // Plan bazlı belediye tablosunu doldur
  function renderPlanMunicipalityTable(municipalities = []) {
    if (!tableBody) return;

    if (!Array.isArray(municipalities) || municipalities.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            Kayıtlı belediye bulunamadı.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = '';

    municipalities.forEach((municipality) => {
      const rawType =
        municipality.plan_type ||
        municipality.plan ||
        municipality.subscription_type;

      const planBadge = getPlanBadge(rawType);

      const name = municipality.name || municipality.municipality_name || '—';

      // İl / ilçe alanları sende nasıl tutuluyorsa ona göre aşağıyı revize edebilirsin
      const city =
        municipality.city ||
        municipality.il ||
        municipality.province ||
        municipality.province_name ||
        '';
      const district =
        municipality.district ||
        municipality.ilce ||
        municipality.county ||
        municipality.district_name ||
        '';

      const cityDistrict =
        city && district ? `${city} / ${district}` : city || district || '—';

      const statusBadge = getStatusBadge(
        municipality.is_active,
        municipality.status
      );

      // Ödeme tarihleri: şu anda lisans bitiş tarihini "Son Ödeme" gibi kullanıyoruz.
      // Eğer backend'de last_payment_date vs. varsa buraya ekleyebilirsin.
      const lastPaymentDate =
        municipality.last_payment_date || municipality.license_end_date;
      const nextRenewalDate = municipality.next_renewal_date || null;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${planBadge}</td>
        <td>${name}</td>
        <td>${cityDistrict}</td>
        <td>${statusBadge}</td>
        <td>${formatDate(lastPaymentDate)}</td>
        <td>${formatDate(nextRenewalDate)}</td>
      `;

      tableBody.appendChild(row);
    });
  }

  function applyCounts(municipalities = []) {
    const counts = {
      pro: 0,
      standard: 0,
      deneme: 0,
    };

    municipalities.forEach((municipality) => {
      const rawType =
        municipality.plan_type ||
        municipality.plan ||
        municipality.subscription_type;
      const type = (rawType || '').toLowerCase();

      if (type === 'standart') {
        // DB'de "standart" yazıyorsa sayımı "standard" altında tut
        counts.standard += 1;
      } else if (counts[type] !== undefined) {
        counts[type] += 1;
      }
    });

    const totalPlans = municipalities.length;

    setText(labels.active, totalPlans ?? '-');
    setText(labels.pro, counts.pro ?? '-');
    setText(labels.standard, counts.standard ?? '-');
    setText(labels.deneme, counts.deneme ?? '-');

    updatePlanBadges(counts);
    renderPlanMunicipalityTable(municipalities);
  }

  // Belediyeleri çek
  fetch('http://localhost:4000/api/superadmin/municipalities', {
    method: 'GET',
    headers,
    credentials: 'include',
  })
    .then((response) => {
      console.log('[plans] fetch status:', response.status);
      if (!response.ok) {
        throw new Error(`Belediye listesi alınamadı: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log('[plans] gelen data:', data);

      if (!Array.isArray(data)) {
        throw new Error('Geçersiz belediye verisi alındı (array değil)');
      }

      applyCounts(data);
    })
    .catch((err) => {
      console.error('[plans] Hata:', err);
      setText(labels.active, '-');
      setText(labels.pro, '-');
      setText(labels.standard, '-');
      setText(labels.deneme, '-');

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-muted py-4">
              Belediyeler yüklenemedi.
            </td>
          </tr>
        `;
      }
    });
});
