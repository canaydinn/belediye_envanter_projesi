(() => {
  const form = document.getElementById('create-user-form');
  const submitButton = document.getElementById('submit-create-user');
  const feedback = document.getElementById('create-user-feedback');
  const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || '/api';

  const setFeedback = (type, message) => {
    if (!feedback) return;
    feedback.className = `alert alert-${type}`;
    feedback.textContent = message;
  };

  const clearFeedback = () => {
    if (!feedback) return;
    feedback.classList.add('d-none');
    feedback.textContent = '';
  };

  const disableSubmit = isDisabled => {
    if (!submitButton) return;
    submitButton.disabled = isDisabled;
    submitButton.classList.toggle('disabled', isDisabled);
  };

  const showFeedback = (type, message) => {
    if (!feedback) return;
    setFeedback(type, message);
    feedback.classList.remove('d-none');
  };

  const collectPayload = () => {
    const fullName = document.getElementById('full-name')?.value.trim();
    const username = document.getElementById('username')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const municipalityValue = document.getElementById('municipality')?.value;
    const roleValue = document.getElementById('role')?.value;
    const password = document.getElementById('password')?.value;
    const passwordConfirm = document.getElementById('password-confirm')?.value;
    const isActive = document.getElementById('status')?.checked;
    const emailVerified = document.getElementById('email-verified')?.checked;

    return {
      fullName,
      username,
      email,
      phone,
      municipalityValue,
      roleValue,
      password,
      passwordConfirm,
      isActive,
      emailVerified,
    };
  };

  const validatePayload = payload => {
    const { password, passwordConfirm, roleValue, municipalityValue } = payload;

    if (password && passwordConfirm && password !== passwordConfirm) {
      throw new Error('Şifre ve şifre tekrar alanları eşleşmiyor');
    }

    const roleId = Number(roleValue);
    if (!roleId || Number.isNaN(roleId)) {
      throw new Error('Geçerli bir rol seçin');
    }

    let municipality_id = null;
    if (municipalityValue) {
      const parsed = Number(municipalityValue);
      if (Number.isNaN(parsed)) {
        throw new Error('Belediye seçimi geçerli değil');
      }
      municipality_id = parsed;
    }

    return {
      ...payload,
      role_id: roleId,
      municipality_id,
    };
  };

  const handleSubmit = async event => {
    event.preventDefault();
    clearFeedback();

    if (!form || !submitButton) return;

    try {
      const collected = collectPayload();
      const validated = validatePayload(collected);

      const payload = {
        username: validated.username,
        email: validated.email,
        password: validated.password,
        full_name: validated.fullName,
        role_id: validated.role_id,
        municipality_id: validated.municipality_id,
        phone: validated.phone || undefined,
        is_active: validated.isActive,
        email_verified: validated.emailVerified,
      };

      disableSubmit(true);

      const response = await fetch(`${API_BASE_URL}/superadmin/users`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result?.message || 'Kullanıcı kaydedilemedi';
        throw new Error(message);
      }

      showFeedback('success', result?.message || 'Kullanıcı başarıyla oluşturuldu');
      form.reset();
    } catch (err) {
      console.error('Kullanıcı oluşturma hatası:', err);
      showFeedback('danger', err.message || 'Bir hata oluştu');
    } finally {
      disableSubmit(false);
    }
  };

  submitButton?.addEventListener('click', handleSubmit);
  form?.addEventListener('submit', handleSubmit);
})();

