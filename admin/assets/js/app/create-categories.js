const API_BASE_URL = 'https://envanter360.vercel.app/api';

const selectElements = () => ({
  form: document.getElementById('createCategoryForm'),
  codeInput: document.getElementById('categoryCode'),
  nameInput: document.getElementById('categoryName'),
  descriptionInput: document.getElementById('categoryDescription'),
  successAlert: document.getElementById('categorySuccessAlert'),
  errorAlert: document.getElementById('categoryErrorAlert'),
  submitButton: document.getElementById('saveCategoryButton'),
});

const buildHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const setAlertState = (element, message) => {
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
  const label = button.querySelector('span:last-child');
  if (label) {
    label.textContent = isSubmitting ? 'Kaydediliyor...' : 'Kaydet';
  }
};

const validatePayload = (code, name) => {
  if (!code) return 'Kategori kodu zorunludur.';
  if (!name) return 'Kategori adı zorunludur.';
  return '';
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    console.warn('JSON parse hatası:', error);
    return {};
  }
};

const submitCategory = async (payload, elements) => {
  const response = await fetch(`${API_BASE_URL}/asset-categories`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const errorMessage = data?.message || 'Kategori kaydedilirken bir hata oluştu.';
    throw new Error(errorMessage);
  }

  return data;
};

const handleSubmit = async (event) => {
  event.preventDefault();

  const elements = selectElements();
  setAlertState(elements.successAlert, '');
  setAlertState(elements.errorAlert, '');

  const code = elements.codeInput?.value.trim() || '';
  const name = elements.nameInput?.value.trim() || '';
  const description = elements.descriptionInput?.value.trim() || '';

  const validationError = validatePayload(code, name);
  if (validationError) {
    setAlertState(elements.errorAlert, validationError);
    return;
  }

  toggleSubmitting(elements.submitButton, true);

  try {
    const result = await submitCategory({ code, name, description }, elements);
    const successMessage = result?.message || 'Kategori başarıyla oluşturuldu.';
    setAlertState(elements.successAlert, successMessage);
    if (elements.form) {
      elements.form.reset();
    }
  } catch (error) {
    setAlertState(elements.errorAlert, error.message);
  } finally {
    toggleSubmitting(elements.submitButton, false);
  }
};

const initPage = () => {
  const { form } = selectElements();
  if (!form) return;

  form.addEventListener('submit', handleSubmit);
};

initPage();