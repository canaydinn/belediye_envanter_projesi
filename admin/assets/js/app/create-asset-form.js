const API_BASE = 'http://localhost:4000';

document.addEventListener('DOMContentLoaded', () => {
  const assetCreateForm = document.getElementById('assetCreateForm');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');

  function toNullable(value) {
    return value && value.trim() !== '' ? value.trim() : null;
  }

  function toNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  assetCreateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    assetCreateForm.classList.add('was-validated');
    successMessage.classList.add('d-none');
    errorMessage.classList.add('d-none');

    if (!assetCreateForm.checkValidity()) {
      return;
    }

    const formData = new FormData(assetCreateForm);
    const payload = {
      name: toNullable(formData.get('name')),
      description: toNullable(formData.get('description')),
      category_id: toNullable(formData.get('category_id')),
      department_id: toNullable(formData.get('department_id')),
      location_id: toNullable(formData.get('location_id')),
      assigned_user_id: toNumber(formData.get('assigned_user_id')),
      purchase_price: toNumber(formData.get('purchase_price')),
      purchase_date: toNullable(formData.get('purchase_date')),
      serial_number: toNullable(formData.get('serial_number')),
      status: toNullable(formData.get('status')),
      is_qr_tagged: formData.get('is_qr_tagged') === 'on',
      quantity: toNumber(formData.get('quantity')) ?? 1,
      unit: toNullable(formData.get('unit')) || 'Adet',
      tasinir_code: toNullable(formData.get('tasinir_code')),
      asset_type: toNullable(formData.get('asset_type')) || 'demirbas',
      qrcode: toNullable(formData.get('qrcode')),
      brand: toNullable(formData.get('brand')),
      model: toNullable(formData.get('model')),
      purchase_id: toNullable(formData.get('purchase_id')),
      warranty_end_date: toNullable(formData.get('warranty_end_date')),
      amortisman_suresi: toNumber(formData.get('amortisman_suresi')),
      hurda_degeri: toNumber(formData.get('hurda_degeri')),
      current_value: toNumber(formData.get('current_value')),
      is_movable: formData.get('is_movable') === 'on',
    };

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/api/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        // JSON dönmediyse, status'e göre mesaj vereceğiz
      }

      if (!response.ok) {
        const message =
          data?.message ||
          `Varlık kaydı sırasında bir hata oluştu (status: ${response.status}).`;
        throw new Error(message);
      }

      successMessage.textContent = `${
        data?.asset_code || payload.asset_code || 'Varlık'
      } başarıyla kaydedildi.`;
      successMessage.classList.remove('d-none');
      assetCreateForm.reset();
      assetCreateForm.classList.remove('was-validated');
    } catch (error) {
      console.error('Varlık kaydı hatası:', error);
      errorMessage.textContent =
        error.message || 'Varlık kaydı sırasında bir hata oluştu.';
      errorMessage.classList.remove('d-none');
    }
  });
});

