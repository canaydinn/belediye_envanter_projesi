// Category edit page - Load and update category
const API_BASE = window.API_BASE_URL || 'http:// /api';

document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden kategori ID'sini al
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('id');

  if (!categoryId) {
    showFeedback('Geçerli bir kategori ID\'si bulunamadı.', 'danger');
    return;
  }

  const categoryUpdateForm = document.getElementById('categoryUpdateForm');
  const feedbackEl = document.querySelector('[data-role="feedback"]');

  // Yardımcı fonksiyonlar
  function toNullable(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed !== '' ? trimmed : null;
  }

  function showFeedback(message, type = 'info') {
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `alert alert-${type}`;
      feedbackEl.classList.remove('d-none');
      
      // 4 saniye sonra otomatik gizle
      setTimeout(() => {
        feedbackEl.classList.add('d-none');
      }, 4000);
    }
  }

  function hideFeedback() {
    if (feedbackEl) {
      feedbackEl.classList.add('d-none');
    }
  }

  // Kategori detayını yükle
  async function loadCategory() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/asset-categories/${categoryId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          showFeedback('Kategori bulunamadı.', 'danger');
          return;
        }
        if (response.status === 401) {
          showFeedback('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'danger');
          setTimeout(() => {
            window.location.href = '/admin/login.html';
          }, 2000);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Kategori yüklenemedi');
      }

      const category = await response.json();
      populateForm(category);
    } catch (error) {
      console.error('Kategori yüklenirken hata:', error);
      showFeedback('Kategori bilgileri yüklenemedi: ' + error.message, 'danger');
    }
  }

  // Form alanlarını doldur
  function populateForm(category) {
    // Kategori kodu badge
    const categoryCodeBadge = document.querySelector('[data-role="category-code"]');
    if (categoryCodeBadge) {
      categoryCodeBadge.textContent = category.code || '-';
    }

    // Form alanları
    const codeInput = document.getElementById('code');
    const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');

    if (codeInput) codeInput.value = category.code || '';
    if (nameInput) nameInput.value = category.name || '';
    if (descriptionInput) descriptionInput.value = category.description || '';
  }

  // Form submit
  if (categoryUpdateForm) {
    categoryUpdateForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      categoryUpdateForm.classList.add('was-validated');
      hideFeedback();

      const formData = {
        code: document.getElementById('code').value.trim(),
        name: document.getElementById('name').value.trim(),
        description: toNullable(document.getElementById('description').value),
      };

      // Zorunlu alanlar kontrolü
      if (!formData.code || !formData.name) {
        showFeedback('Lütfen gerekli alanları (Kod ve Ad) doldurun.', 'warning');
        return;
      }

      if (!categoryUpdateForm.checkValidity()) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const updateButton = document.querySelector('[data-role="update-button"]');
        if (updateButton) {
          updateButton.disabled = true;
          updateButton.textContent = 'Güncelleniyor...';
        }

        const response = await fetch(`${API_BASE}/asset-categories/${categoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        });

        let data = null;
        try {
          data = await response.json();
        } catch (e) {
          // JSON dönmediyse, status'e göre mesaj vereceğiz
        }

        if (!response.ok) {
          if (response.status === 401) {
            showFeedback('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.', 'danger');
            setTimeout(() => {
              window.location.href = '/admin/login.html';
            }, 2000);
            return;
          }
          const message =
            data?.message ||
            `Kategori güncelleme sırasında bir hata oluştu (status: ${response.status}).`;
          throw new Error(message);
        }

        showFeedback('Kategori başarıyla güncellendi.', 'success');

        // Kategori kodu badge'ini güncelle
        const categoryCodeBadge = document.querySelector('[data-role="category-code"]');
        if (categoryCodeBadge) {
          categoryCodeBadge.textContent = formData.code;
        }

        // 2 saniye sonra kategori listesine yönlendir
        setTimeout(() => {
          window.location.href = '/admin/categories.html';
        }, 2000);
      } catch (error) {
        console.error('Kategori güncelleme hatası:', error);
        showFeedback(
          error.message || 'Kategori güncelleme sırasında bir hata oluştu.',
          'danger'
        );
      } finally {
        const updateButton = document.querySelector('[data-role="update-button"]');
        if (updateButton) {
          updateButton.disabled = false;
          updateButton.textContent = 'Güncelle';
        }
      }
    });
  }

  // Sayfa yüklendiğinde kategori bilgilerini yükle
  loadCategory();
});

