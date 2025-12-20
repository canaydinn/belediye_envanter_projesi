// Category detail page - Load and display category details
document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden kategori ID'sini al
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('id');

  if (!categoryId) {
    showFeedback('Geçerli bir kategori ID\'si bulunamadı.', 'danger');
    return;
  }

  const feedbackEl = document.querySelector('[data-role="feedback"]');

  // Yardımcı fonksiyonlar
  function showFeedback(message, type = 'info') {
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `alert alert-${type}`;
      feedbackEl.classList.remove('d-none');
      
      setTimeout(() => {
        feedbackEl.classList.add('d-none');
      }, 4000);
    }
  }

  // Tarih formatlama
  function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
  }

  // Kategori detayını yükle
  async function loadCategoryDetail() {
    try {
      const category = await apiFetch(`/asset-categories/${categoryId}`);
      populateDetail(category);
    } catch (error) {
      console.error('Kategori yüklenirken hata:', error);
      if (error.message && error.message.includes('404')) {
        showFeedback('Kategori bulunamadı.', 'danger');
      } else {
        showFeedback('Kategori bilgileri yüklenemedi: ' + error.message, 'danger');
      }
    }
  }

  // Form alanlarını doldur
  function populateDetail(category) {
    // Başlık
    const categoryNameHeader = document.querySelector('[data-role="category-name"]');
    if (categoryNameHeader) {
      categoryNameHeader.textContent = category.name || 'Kategori Detayı';
    }

    // Edit link (eğer category-edit.html sayfası varsa)
    const editLink = document.querySelector('[data-role="edit-link"]');
    if (editLink) {
      editLink.href = `category-edit.html?id=${category.id}`;
    }

    // Kategori kodu badge
    const categoryCodeBadge = document.querySelector('[data-role="category-code"]');
    if (categoryCodeBadge) {
      categoryCodeBadge.textContent = category.code || '-';
    }

    // Detay alanları
    const codeDetail = document.querySelector('[data-role="category-code-detail"]');
    const nameDetail = document.querySelector('[data-role="category-name-detail"]');
    const descriptionDetail = document.querySelector('[data-role="category-description"]');
    const assetCountDetail = document.querySelector('[data-role="category-asset-count"]');
    const createdDetail = document.querySelector('[data-role="category-created"]');
    const updatedDetail = document.querySelector('[data-role="category-updated"]');

    if (codeDetail) codeDetail.textContent = category.code || '-';
    if (nameDetail) nameDetail.textContent = category.name || '-';
    if (descriptionDetail) descriptionDetail.textContent = category.description || '-';
    if (assetCountDetail) assetCountDetail.textContent = category.asset_count !== undefined ? category.asset_count : '-';
    if (createdDetail) createdDetail.textContent = formatDate(category.created_at);
    if (updatedDetail) updatedDetail.textContent = formatDate(category.updated_at);
  }

  // Sayfa yüklendiğinde kategori bilgilerini yükle
  loadCategoryDetail();
});

