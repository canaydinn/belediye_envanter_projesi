// assets-approval.js
// Envanter onay/red işlemleri

const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'
    : window.location.origin + '/api';

/**
 * Kullanıcının rolünü kontrol eder
 * @returns {Promise<number|null>} role_id veya null
 */
async function getCurrentUserRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.user?.role_id || null;
  } catch (error) {
    console.error('Kullanıcı rolü alınamadı:', error);
    return null;
  }
}

/**
 * Envanteri onaylar
 * @param {number} assetId - Envanter ID'si
 * @returns {Promise<Object>}
 */
async function approveAsset(assetId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/assets/${assetId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Onay işlemi başarısız');
  }

  return data;
}

/**
 * Envanteri reddeder
 * @param {number} assetId - Envanter ID'si
 * @param {string} reason - Red nedeni (opsiyonel)
 * @returns {Promise<Object>}
 */
async function rejectAsset(assetId, reason = '') {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/assets/${assetId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Red işlemi başarısız');
  }

  return data;
}

/**
 * Onay durumu badge'i oluşturur
 * @param {string} approvalStatus - 'pending', 'approved', 'rejected'
 * @returns {string} HTML badge
 */
function renderApprovalStatusBadge(approvalStatus) {
  const statusMap = {
    pending: { label: 'Beklemede', className: 'badge bg-label-warning' },
    approved: { label: 'Onaylandı', className: 'badge bg-label-success' },
    rejected: { label: 'Reddedildi', className: 'badge bg-label-danger' },
  };

  const status = statusMap[approvalStatus] || {
    label: approvalStatus || 'Bilinmiyor',
    className: 'badge bg-label-secondary',
  };

  return `<span class="${status.className}">${status.label}</span>`;
}

/**
 * Onay/Red butonlarını oluşturur (sadece kontrol yetkilisi için)
 * @param {Object} asset - Envanter objesi
 * @param {number} currentUserRoleId - Mevcut kullanıcının rol ID'si
 * @returns {string} HTML butonlar
 */
function renderApprovalButtons(asset, currentUserRoleId) {
  // Sadece ADMIN (2) veya TASINIR_KONTROL (4) rolü için butonları göster
  const canApprove = currentUserRoleId === 1 || currentUserRoleId === 2 || currentUserRoleId === 4;

  if (!canApprove || asset.approval_status !== 'pending') {
    return '';
  }

  return `
    <div class="d-inline-flex gap-1">
      <button 
        class="btn btn-sm btn-success btn-icon" 
        onclick="handleApproveAsset(${asset.id})"
        title="Onayla"
      >
        <i class="ti ti-check"></i>
      </button>
      <button 
        class="btn btn-sm btn-danger btn-icon" 
        onclick="handleRejectAsset(${asset.id})"
        title="Reddet"
      >
        <i class="ti ti-x"></i>
      </button>
    </div>
  `;
}

/**
 * Onay işlemini yönetir
 * @param {number} assetId - Envanter ID'si
 */
async function handleApproveAsset(assetId) {
  if (!confirm('Bu envanteri onaylamak istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await approveAsset(assetId);
    
    // Başarı mesajı göster
    showNotification('Envanter başarıyla onaylandı', 'success');
    
    // Listeyi yenile
    if (typeof loadAssets === 'function') {
      await loadAssets();
    } else {
      // Sayfayı yenile
      window.location.reload();
    }
  } catch (error) {
    console.error('Onay hatası:', error);
    showNotification(error.message || 'Onay işlemi başarısız', 'danger');
  }
}

/**
 * Red işlemini yönetir
 * @param {number} assetId - Envanter ID'si
 */
async function handleRejectAsset(assetId) {
  const reason = prompt('Red nedeni (opsiyonel):');
  if (reason === null) {
    // Kullanıcı iptal etti
    return;
  }

  if (!confirm('Bu envanteri reddetmek istediğinizden emin misiniz?')) {
    return;
  }

  try {
    await rejectAsset(assetId, reason || '');
    
    // Başarı mesajı göster
    showNotification('Envanter reddedildi', 'success');
    
    // Listeyi yenile
    if (typeof loadAssets === 'function') {
      await loadAssets();
    } else {
      // Sayfayı yenile
      window.location.reload();
    }
  } catch (error) {
    console.error('Red hatası:', error);
    showNotification(error.message || 'Red işlemi başarısız', 'danger');
  }
}

/**
 * Bildirim gösterir
 * @param {string} message - Mesaj
 * @param {string} type - 'success', 'danger', 'warning', 'info'
 */
function showNotification(message, type = 'info') {
  // Basit bir toast/alert göster
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  // 3 saniye sonra otomatik kapat
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

// Global fonksiyonlar (window'a ekle)
window.handleApproveAsset = handleApproveAsset;
window.handleRejectAsset = handleRejectAsset;
window.renderApprovalStatusBadge = renderApprovalStatusBadge;
window.renderApprovalButtons = renderApprovalButtons;
window.getCurrentUserRole = getCurrentUserRole;
