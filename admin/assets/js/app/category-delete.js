// Category delete page - Load category details and handle deletion
document.addEventListener('DOMContentLoaded', () => {
  // URL parametrelerinden kategori ID'sini al
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('id');

  if (!categoryId) {
    showFeedback('Geçerli bir kategori ID\'si bulunamadı.', 'danger');
    window.location.href = '../admin/categories.html';
    return;
  }

  const feedbackEl = document.querySelector('[data-role="feedback"]');
  const deleteBtn = document.getElementById('deleteCategoryBtn');
  const assetWarning = document.querySelector('[data-role="asset-warning"]');
  const assetSafe = document.querySelector('[data-role="asset-safe"]');

  // Yardımcı fonksiyonlar
  function showFeedback(message, type = 'info') {
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = `alert alert-${type}`;
      feedbackEl.classList.remove('d-none');
      
      setTimeout(() => {
        feedbackEl.classList.add('d-none');
      }, 5000);
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
      
      // Varlık sayısına göre silme butonunu aktif/pasif yap
      const assetCount = category.asset_count || 0;
      if (assetCount > 0) {
        if (deleteBtn) {
          deleteBtn.disabled = true;
          deleteBtn.innerHTML = '<i class="ti ti-ban me-2"></i>Varlık Bulunduğu İçin Silinemez';
        }
        if (assetWarning) {
          assetWarning.classList.remove('d-none');
        }
        if (assetSafe) {
          assetSafe.classList.add('d-none');
        }
      } else {
        if (deleteBtn) {
          deleteBtn.disabled = false;
        }
        if (assetWarning) {
          assetWarning.classList.add('d-none');
        }
        if (assetSafe) {
          assetSafe.classList.remove('d-none');
        }
      }
    } catch (error) {
      console.error('Kategori yüklenirken hata:', error);
      if (error.message && error.message.includes('404')) {
        showFeedback('Kategori bulunamadı.', 'danger');
        setTimeout(() => {
          window.location.href = '../admin/categories.html';
        }, 2000);
      } else {
        showFeedback('Kategori bilgileri yüklenemedi: ' + error.message, 'danger');
      }
    }
  }

  // Form alanlarını doldur
  function populateDetail(category) {
    // Başlık
    const categoryNameHeader = document.querySelector('h4.fw-bold');
    if (categoryNameHeader) {
      categoryNameHeader.textContent = `Kategori Sil: ${category.name || 'Bilinmeyen'}`;
    }

    // Edit link
    const editLink = document.querySelector('[data-role="edit-link"]');
    if (editLink) {
      editLink.href = `category-edit.html?id=${category.id}`;
    }

    // Detail link
    const detailLink = document.querySelector('[data-role="detail-link"]');
    if (detailLink) {
      detailLink.href = `category-detail.html?id=${category.id}`;
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

    if (codeDetail) codeDetail.textContent = category.code || '-';
    if (nameDetail) nameDetail.textContent = category.name || '-';
    if (descriptionDetail) descriptionDetail.textContent = category.description || 'Açıklama yok';
    if (assetCountDetail) assetCountDetail.textContent = category.asset_count !== undefined ? category.asset_count : '0';
    if (createdDetail) createdDetail.textContent = formatDate(category.created_at);
  }

  // Kategori silme işlemi
  async function deleteCategory() {
    if (!categoryId) {
      showFeedback('Kategori ID bulunamadı.', 'danger');
      return;
    }

    // SweetAlert2 ile onay iste
    if (typeof Swal !== 'undefined') {
      try {
        const result = await Swal.fire({
          title: 'Emin misiniz?',
          text: `"${document.querySelector('[data-role="category-name-detail"]')?.textContent || 'Bu kategori'}" kategorisi kalıcı olarak silinecek. Bu işlem geri alınamaz!`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal',
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          customClass: {
            confirmButton: 'btn btn-danger me-2',
            cancelButton: 'btn btn-secondary'
          },
          buttonsStyling: false
        });

        if (!result.isConfirmed) {
          return;
        }
      } catch (error) {
        console.error('SweetAlert2 hatası:', error);
        // Hata durumunda basit confirm kullan
        const categoryName = document.querySelector('[data-role="category-name-detail"]')?.textContent || 'Bu kategori';
        if (!confirm(`"${categoryName}" kategorisini silmek istediğinize emin misiniz?`)) {
          return;
        }
      }
    } else {
      // SweetAlert2 yoksa basit confirm kullan
      const categoryName = document.querySelector('[data-role="category-name-detail"]')?.textContent || 'Bu kategori';
      if (!confirm(`"${categoryName}" kategorisini silmek istediğinize emin misiniz?`)) {
        return;
      }
    }

    // Silme işlemini başlat
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Siliniyor...';
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/asset-categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMsg = 'Kategori silinemedi.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          // JSON parse hatası
        }

        if (typeof Swal !== 'undefined') {
          await Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: errorMsg,
            customClass: {
              confirmButton: 'btn btn-primary'
            },
            buttonsStyling: false
          });
        } else {
          alert(errorMsg);
        }

        if (deleteBtn) {
          deleteBtn.disabled = false;
          deleteBtn.innerHTML = '<i class="ti ti-trash me-2"></i>Kategoriyi Sil';
        }
        return;
      }

      // Başarılı silme
      if (typeof Swal !== 'undefined') {
        await Swal.fire({
          icon: 'success',
          title: 'Silindi!',
          text: 'Kategori başarıyla silindi.',
          customClass: {
            confirmButton: 'btn btn-success'
          },
          buttonsStyling: false
        });
      } else {
        alert('Kategori başarıyla silindi.');
      }

      // Kategoriler listesine yönlendir
      setTimeout(() => {
        window.location.href = '../admin/categories.html';
      }, 1500);

    } catch (error) {
      console.error('Kategori silme hatası:', error);
      const errorMsg = 'Kategori silinirken bir hata oluştu.';
      
      if (typeof Swal !== 'undefined') {
        await Swal.fire({
          icon: 'error',
          title: 'Hata',
          text: errorMsg,
          customClass: {
            confirmButton: 'btn btn-primary'
          },
          buttonsStyling: false
        });
      } else {
        alert(errorMsg);
      }

      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="ti ti-trash me-2"></i>Kategoriyi Sil';
      }
    }
  }

  // Silme butonuna event listener ekle
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteCategory);
  }

  // Sayfa yüklendiğinde kategori bilgilerini yükle
  loadCategoryDetail();
});

