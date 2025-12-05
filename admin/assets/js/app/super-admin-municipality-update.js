// admin/assets/js/app/super-admin-municipalities-update.js
(function () {
  const form = document.getElementById('municipalityUpdateForm');
  const feedback = document.querySelector('[data-role="feedback"]');
  const codeBadge = document.querySelector('[data-role="municipality-code"]');
  const updateButton = document.querySelector('[data-role="update-button"]');

  const params = new URLSearchParams(window.location.search);
  const municipalityId = params.get('id');

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  function setLoading(isLoading) {
    if (updateButton) {
      updateButton.disabled = isLoading;
      updateButton.textContent = isLoading ? 'Güncelleniyor...' : 'Güncelle';
    }
  }

  function showFeedback(type, message) {
    if (!feedback) return;

    feedback.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
    feedback.classList.add(`alert-${type}`);
    feedback.textContent = message;
  }

  function formatDateInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  function parseNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function fillForm(data) {
    if (!data) return;

    codeBadge && (codeBadge.textContent = data.code || '-');
    document.getElementById('name').value = data.name || '';
    document.getElementById('province').value = data.province || '';
    document.getElementById('district').value = data.district || '';
    document.getElementById('tax_number').value = data.tax_number || '';
    document.getElementById('address').value = data.address || '';
    document.getElementById('contact_person').value = data.contact_person || '';
    document.getElementById('contact_email').value = data.contact_email || '';
    document.getElementById('contact_phone').value = data.contact_phone || '';
    document.getElementById('status').value = data.status || 'pending';
    document.getElementById('plan_type').value = data.plan_type || '';
    document.getElementById('domain_url').value = data.domain_url || '';
    document.getElementById('license_start_date').value = formatDateInput(data.license_start_date);
    document.getElementById('license_end_date').value = formatDateInput(data.license_end_date);
    document.getElementById('quota_end_date').value = formatDateInput(data.quota_end_date);
    document.getElementById('max_users').value = data.max_users ?? '';
    document.getElementById('max_assets').value = data.max_assets ?? '';
    document.getElementById('logo_url').value = data.logo_url || '';
    document.getElementById('notes').value = data.notes || '';
  }

  function loadMunicipality() {
    if (!municipalityId) {
      showFeedback('warning', 'Geçerli bir belediye ID bulunamadı.');
      setLoading(true);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:4000/api/superadmin/municipalities/${municipalityId}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Belediye bilgileri alınamadı');
        }
        return response.json();
      })
      .then((data) => {
        fillForm(data);
      })
      .catch((err) => {
        console.error(err);
        showFeedback('danger', 'Belediye bilgileri yüklenemedi.');
      })
      .finally(() => setLoading(false));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!municipalityId) {
      showFeedback('warning', 'Belediye ID bulunamadı.');
      return;
    }

    const payload = {
      name: document.getElementById('name').value.trim(),
      province: document.getElementById('province').value.trim(),
      district: document.getElementById('district').value.trim(),
      tax_number: document.getElementById('tax_number').value.trim() || null,
      address: document.getElementById('address').value.trim() || null,
      contact_person: document.getElementById('contact_person').value.trim() || null,
      contact_email: document.getElementById('contact_email').value.trim() || null,
      contact_phone: document.getElementById('contact_phone').value.trim() || null,
      status: document.getElementById('status').value,
      plan_type: document.getElementById('plan_type').value || null,
      domain_url: document.getElementById('domain_url').value.trim() || null,
      license_start_date: document.getElementById('license_start_date').value || null,
      license_end_date: document.getElementById('license_end_date').value || null,
      quota_end_date: document.getElementById('quota_end_date').value || null,
      max_users: parseNumber(document.getElementById('max_users').value),
      max_assets: parseNumber(document.getElementById('max_assets').value),
      logo_url: document.getElementById('logo_url').value.trim() || null,
      notes: document.getElementById('notes').value.trim() || null,
    };

    setLoading(true);
    fetch(`http://localhost:4000/api/superadmin/municipalities/${municipalityId}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    })
      .then((response) => {
        console.error(response); 
        if (!response.ok) {
          return response.json().then((err) => {
            const message = err?.message || 'Güncelleme başarısız';
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then((data) => {
        fillForm(data);
        showFeedback('success', 'Belediye bilgileri başarıyla güncellendi.');
      })
      .catch((err) => {
        console.error(err);
        showFeedback('danger', err.message || 'Güncelleme sırasında bir hata oluştu.');
      })
      .finally(() => setLoading(false));
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  loadMunicipality();
})();