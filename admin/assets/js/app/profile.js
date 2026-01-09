const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'   // Lokal
    : window.location.origin + '/api';
const selectElements = () => ({
  profileName: document.getElementById('profileFullName'),
  profileUsername: document.getElementById('profileUsername'),
  profileEmail: document.getElementById('profileEmail'),
  profilePhone: document.getElementById('profilePhone'),
  profileRole: document.getElementById('profileRole'),
  profileMunicipality: document.getElementById('profileMunicipality'),
  profileStatus: document.getElementById('profileStatus'),
  profileLastLogin: document.getElementById('profileLastLogin'),
  profileIp: document.getElementById('profileLastLoginIp'),
  profileEmailVerified: document.getElementById('profileEmailVerified'),
  profileCreatedAt: document.getElementById('profileCreatedAt'),
  profileUpdatedAt: document.getElementById('profileUpdatedAt'),
  profileForm: document.getElementById('profileForm'),
  profileFormSuccess: document.getElementById('profileFormSuccess'),
  profileFormError: document.getElementById('profileFormError'),
  profileSaveButton: document.getElementById('profileSaveButton'),
  fullNameInput: document.getElementById('profileFullNameInput'),
  usernameInput: document.getElementById('profileUsernameInput'),
  emailInput: document.getElementById('profileEmailInput'),
  phoneInput: document.getElementById('profilePhoneInput'),
  municipalityBadge: document.getElementById('profileMunicipalityBadge'),
  roleBadge: document.getElementById('profileRoleBadge'),
  passwordForm: document.getElementById('passwordForm'),
  passwordSaveButton: document.getElementById('passwordSaveButton'),
  passwordSuccess: document.getElementById('passwordSuccess'),
  passwordError: document.getElementById('passwordError'),
  currentPasswordInput: document.getElementById('currentPassword'),
  newPasswordInput: document.getElementById('newPassword'),
  confirmPasswordInput: document.getElementById('confirmPassword'),
});

const toggleAlert = (element, message, variant = 'success') => {
  if (!element) return;
  if (!message) {
    element.classList.add('d-none');
    element.textContent = '';
    return;
  }

  element.classList.remove('d-none');
  element.classList.toggle('alert-success', variant === 'success');
  element.classList.toggle('alert-danger', variant === 'danger');
  element.textContent = message;
};

const toggleButtonState = (button, isDisabled) => {
  if (!button) return;
  button.disabled = isDisabled;
  const loadingText = button.dataset.loadingText;
  if (!loadingText) return;
  if (isDisabled) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
  } else if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
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

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('tr-TR');
};

const setTextContent = (element, value) => {
  if (!element) return;
  element.textContent = value ?? '—';
};

const buildAuthorizedOptions = () => ({
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
});

const fetchProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: 'GET',
    ...buildAuthorizedOptions(),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.message || 'Profil bilgileri alınamadı';
    throw new Error(message);
  }

  return data?.profile;
};

const updateProfile = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    ...buildAuthorizedOptions(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.message || 'Profil güncellenemedi';
    throw new Error(message);
  }

  return data?.profile;
};

const updatePassword = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/profile/password`, {
    method: 'PUT',
    ...buildAuthorizedOptions(),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message = data?.message || 'Şifre güncellenemedi';
    throw new Error(message);
  }

  return data;
};

const validateProfileForm = (elements) => {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!elements.fullNameInput?.value.trim()) {
    errors.push('Ad soyad zorunludur.');
  }

  if (!elements.usernameInput?.value.trim()) {
    errors.push('Kullanıcı adı zorunludur.');
  }

  const email = elements.emailInput?.value.trim();
  if (!email || !emailRegex.test(email)) {
    errors.push('Geçerli bir e-posta adresi girin.');
  }

  return errors;
};

const validatePasswordForm = (elements) => {
  const errors = [];
  const currentPassword = elements.currentPasswordInput?.value;
  const newPassword = elements.newPasswordInput?.value;
  const confirmPassword = elements.confirmPasswordInput?.value;

  if (!currentPassword) {
    errors.push('Mevcut şifre zorunludur.');
  }

  if (!newPassword || newPassword.length < 8) {
    errors.push('Yeni şifre en az 8 karakter olmalıdır.');
  }

  if (newPassword !== confirmPassword) {
    errors.push('Şifreler eşleşmiyor.');
  }

  return errors;
};

const renderProfile = (profile) => {
  const elements = selectElements();
  setTextContent(elements.profileName, profile?.full_name || '—');
  setTextContent(elements.profileUsername, profile?.username || '—');
  setTextContent(elements.profileEmail, profile?.email || '—');
  setTextContent(elements.profilePhone, profile?.phone || '—');
  setTextContent(elements.profileRole, profile?.role_name || '—');
  setTextContent(elements.profileMunicipality, profile?.municipality_name || '—');
  setTextContent(elements.profileStatus, profile?.is_active ? 'Aktif' : 'Pasif');
  setTextContent(elements.profileLastLogin, formatDateTime(profile?.last_login_at));
  setTextContent(elements.profileIp, profile?.last_login_ip || '—');
  setTextContent(elements.profileEmailVerified, formatDateTime(profile?.email_verified_at));
  setTextContent(elements.profileCreatedAt, formatDateTime(profile?.created_at));
  setTextContent(elements.profileUpdatedAt, formatDateTime(profile?.updated_at));

  if (elements.municipalityBadge) {
    elements.municipalityBadge.textContent = profile?.municipality_name || '—';
  }

  if (elements.roleBadge) {
    elements.roleBadge.textContent = profile?.role_name || '—';
  }

  if (elements.fullNameInput) {
    elements.fullNameInput.value = profile?.full_name || '';
  }

  if (elements.usernameInput) {
    elements.usernameInput.value = profile?.username || '';
  }

  if (elements.emailInput) {
    elements.emailInput.value = profile?.email || '';
  }

  if (elements.phoneInput) {
    elements.phoneInput.value = profile?.phone || '';
  }
};

const handleProfileSubmit = async (event) => {
  event.preventDefault();
  const elements = selectElements();
  toggleAlert(elements.profileFormSuccess, '');
  toggleAlert(elements.profileFormError, '');

  const errors = validateProfileForm(elements);
  if (errors.length > 0) {
    toggleAlert(elements.profileFormError, errors.join(' '), 'danger');
    return;
  }

  const payload = {
    full_name: elements.fullNameInput?.value.trim(),
    username: elements.usernameInput?.value.trim(),
    email: elements.emailInput?.value.trim(),
    phone: elements.phoneInput?.value.trim() || null,
  };

  toggleButtonState(elements.profileSaveButton, true);

  try {
    const profile = await updateProfile(payload);
    renderProfile(profile);
    toggleAlert(elements.profileFormSuccess, 'Profiliniz başarıyla güncellendi.');
  } catch (error) {
    toggleAlert(elements.profileFormError, error.message, 'danger');
  } finally {
    toggleButtonState(elements.profileSaveButton, false);
  }
};

const handlePasswordSubmit = async (event) => {
  event.preventDefault();
  const elements = selectElements();
  toggleAlert(elements.passwordSuccess, '');
  toggleAlert(elements.passwordError, '');

  const errors = validatePasswordForm(elements);
  if (errors.length > 0) {
    toggleAlert(elements.passwordError, errors.join(' '), 'danger');
    return;
  }

  const payload = {
    current_password: elements.currentPasswordInput?.value,
    new_password: elements.newPasswordInput?.value,
  };

  toggleButtonState(elements.passwordSaveButton, true);

  try {
    await updatePassword(payload);
    toggleAlert(elements.passwordSuccess, 'Şifreniz güncellendi. Güvenlik için tekrar giriş yapmanız önerilir.');
    elements.passwordForm?.reset();
  } catch (error) {
    toggleAlert(elements.passwordError, error.message, 'danger');
  } finally {
    toggleButtonState(elements.passwordSaveButton, false);
  }
};

let initialized = false;
const initPage = async () => {
  if (initialized) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
    return;
  }

  initialized = true;
  const elements = selectElements();

  if (elements.profileForm) {
    elements.profileForm.addEventListener('submit', handleProfileSubmit);
  }

  if (elements.passwordForm) {
    elements.passwordForm.addEventListener('submit', handlePasswordSubmit);
  }

  try {
    const profile = await fetchProfile();
    renderProfile(profile);
  } catch (error) {
    toggleAlert(selectElements().profileFormError, error.message, 'danger');
  }
};

initPage();