const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'   // Lokal
    : window.location.origin + '/api';  

const selectElements = () => ({
  form: document.getElementById('createUserForm'),
  fullNameInput: document.getElementById('fullName'),
  usernameInput: document.getElementById('username'),
  emailInput: document.getElementById('email'),
  phoneInput: document.getElementById('phone'),
  municipalitySelect: document.getElementById('municipality'),
  roleSelect: document.getElementById('role'),
  passwordInput: document.getElementById('password'),
  passwordConfirmInput: document.getElementById('passwordConfirm'),
  statusSwitch: document.getElementById('status'),
  emailVerifiedSwitch: document.getElementById('emailVerified'),
  successAlert: document.getElementById('createUserSuccess'),
  errorAlert: document.getElementById('createUserError'),
  submitButton: document.getElementById('createUserButton'),
});

const buildHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const toggleAlert = (element, message) => {
  if (!element) return;
  if (!message) {
    element.classList.add('d-none');
    element.textContent = '';
    return;
  }

  element.textContent = message;
  element.classList.remove('d-none');
};

const toggleSubmitting = (button, isSubmitting) => {
  if (!button) return;
  button.disabled = isSubmitting;
  const label = button.querySelector('span');
  if (label) {
    label.textContent = isSubmitting ? 'Kaydediliyor...' : 'Kaydet';
  }
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    console.warn('JSON parse hatası:', error);
    return {};
  }
};

const populateRoles = async () => {
  const { roleSelect, errorAlert } = selectElements();
  if (!roleSelect) return;

  const response = await fetch(`${API_BASE_URL}/roles`, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'include',
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message = data?.message || 'Roller yüklenemedi. Varsayılan seçenek kullanılacak.';
    toggleAlert(errorAlert, message);
    return;
  }

  roleSelect.replaceChildren();
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Rol seçin';
  roleSelect.appendChild(placeholderOption);

  // Superadmin rolü (id: 1) hariç tüm rolleri göster
  const filteredRoles = Array.isArray(data) 
    ? data.filter((role) => role.id !== 1)
    : [];

  filteredRoles.forEach((role) => {
    if (!role?.id || !role?.name) return;
    const option = document.createElement('option');
    option.value = role.id;
    option.textContent = role.name;
    roleSelect.appendChild(option);
  });
};

const populateMunicipalities = async () => {
  const { municipalitySelect, errorAlert } = selectElements();
  if (!municipalitySelect) return;

  const response = await fetch(`${API_BASE_URL}/admin/municipalities`, {
    method: 'GET',
    headers: buildHeaders(),
    credentials: 'include',
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message = data?.message || 'Belediyeler yüklenemedi. Varsayılan seçenek kullanılacak.';
    toggleAlert(errorAlert, message);
    return;
  }

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Seçiniz';

  municipalitySelect.replaceChildren(defaultOption);

  data.forEach((municipality) => {
    if (!municipality?.id || !municipality?.name) return;
    const option = document.createElement('option');
    option.value = municipality.id;
    option.textContent = municipality.name;
    municipalitySelect.appendChild(option);
  });
};

const validateInputs = (elements) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const fullName = elements.fullNameInput?.value.trim();
  const username = elements.usernameInput?.value.trim();
  const email = elements.emailInput?.value.trim();
  const password = elements.passwordInput?.value.trim();
  const passwordConfirm = elements.passwordConfirmInput?.value.trim();
  const roleId = elements.roleSelect?.value;

  if (!fullName) errors.push('Ad soyad zorunludur.');
  if (!username) errors.push('Kullanıcı adı zorunludur.');
  if (!email || !emailRegex.test(email)) errors.push('Geçerli bir e-posta adresi girin.');
  if (!roleId) errors.push('Rol seçimi zorunludur.');
  if (!password || password.length < 8) errors.push('Şifre en az 8 karakter olmalıdır.');
  if (password !== passwordConfirm) errors.push('Şifreler eşleşmiyor.');

  return errors;
};

const submitUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.message || 'Kullanıcı oluşturulurken bir hata oluştu.';
    throw new Error(message);
  }

  return data;
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const elements = selectElements();

  toggleAlert(elements.successAlert, '');
  toggleAlert(elements.errorAlert, '');

  const validationErrors = validateInputs(elements);
  if (validationErrors.length > 0) {
    toggleAlert(elements.errorAlert, validationErrors.join(' '));
    return;
  }

  const municipalityId = elements.municipalitySelect?.value || null;
  const payload = {
    full_name: elements.fullNameInput?.value.trim(),
    username: elements.usernameInput?.value.trim(),
    email: elements.emailInput?.value.trim(),
    phone: elements.phoneInput?.value.trim() || null,
    municipality_id: municipalityId ? Number(municipalityId) : null,
    role_id: Number(elements.roleSelect?.value),
    password: elements.passwordInput?.value.trim(),
    is_active: Boolean(elements.statusSwitch?.checked),
    email_verified: Boolean(elements.emailVerifiedSwitch?.checked),
  };

  toggleSubmitting(elements.submitButton, true);

  try {
    await submitUser(payload);
    toggleAlert(elements.successAlert, 'Kullanıcı başarıyla oluşturuldu.');
    elements.form?.reset();
  } catch (error) {
    toggleAlert(elements.errorAlert, error.message);
  } finally {
    toggleSubmitting(elements.submitButton, false);
  }
};

let initialized = false;
const initPage = () => {
  if (initialized) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
    return;
  }
  initialized = true;

  populateRoles().catch((error) => {
    console.warn('Rol listesi yüklenirken hata:', error);
  });
  populateMunicipalities().catch((error) => {
    console.warn('Belediye listesi yüklenirken hata:', error);
  });

  const { form } = selectElements();
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
};

initPage();