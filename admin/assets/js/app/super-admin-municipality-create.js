

// admin/assets/js/app/super-admin-municipality-create.js
(function () {
  const createForm = document.querySelector('[data-role="municipality-create-form"]');
  const feedbackEl = document.querySelector('[data-role="municipality-create-feedback"]');
  const submitBtn = document.querySelector('[data-role="municipality-create-submit"]');




//yeni belediye oluşturma
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const showFeedback = (type, message) => {
    if (!feedbackEl) return;

    feedbackEl.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
    feedbackEl.classList.add(`alert-${type}`);
    feedbackEl.textContent = message;
  };

  const toPayload = (formData) => {
    const payload = {};

    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        payload[key] = trimmed === '' ? null : trimmed;
      } else {
        payload[key] = value;
      }
    });

    return payload;
  };

  if (!createForm) {
    // Bu dosya sadece create sayfasında çalışacak; yoksa sessizce çık.
    console.warn('Municipality create form bulunamadı.');
    return;
  }

  createForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Kaydediliyor...';
    }

    const formData = new FormData(createForm);
    const payload = toPayload(formData);
    console.log('Belediye create payload:', payload);

    try {
      const response = await fetch('http://localhost:4000/api/superadmin/municipalities/create', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Belediye create response:', response.status, data);

      if (!response.ok) {
        const errorMessage = data?.message || 'Belediye kaydedilemedi, lütfen bilgileri kontrol edin.';
        throw new Error(errorMessage);
      }

      showFeedback('success', 'Belediye başarıyla oluşturuldu.');
      createForm.reset();
    } catch (error) {
      console.error('Belediye oluşturma hatası:', error);
      showFeedback('danger', error.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kaydet';
      }
    }
  });

//////////////////////
///tablo filtreleme

///////



})();
