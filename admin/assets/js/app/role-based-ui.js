// role-based-ui.js
// Rol bazlı UI kontrolü - Menü öğeleri ve butonları rol bazlı gösterir/gizler

const API_BASE_URL =
  window.APP_CONFIG?.API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000/api'
    : window.location.origin + '/api');

// Rol sabitleri (backend ile aynı)
const ROLES = {
  SUPERADMIN: 1,
  ADMIN: 2,
  TASINIR_KAYIT: 3,
  TASINIR_KONTROL: 4,
  BIRIM_SORUMLUSU: 5,
  KULLANICI: 6,
};

// Menü öğeleri ve hangi rollerin görebileceği
const MENU_PERMISSIONS = {
  'dashboard': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL, ROLES.BIRIM_SORUMLUSU, ROLES.KULLANICI],
  'assets': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL, ROLES.BIRIM_SORUMLUSU, ROLES.KULLANICI],
  'assets-movements': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL, ROLES.BIRIM_SORUMLUSU, ROLES.KULLANICI],
  'locations': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL, ROLES.BIRIM_SORUMLUSU, ROLES.KULLANICI],
  'categories': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL, ROLES.BIRIM_SORUMLUSU, ROLES.KULLANICI],
  'users': [ROLES.SUPERADMIN, ROLES.ADMIN], // Sadece admin
  'profile': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL, ROLES.BIRIM_SORUMLUSU, ROLES.KULLANICI],
  'settings': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL, ROLES.BIRIM_SORUMLUSU, ROLES.KULLANICI],
};

// Buton/aksiyon izinleri (data-role attribute ile kontrol edilir)
const BUTTON_PERMISSIONS = {
  'create-asset': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT], // Yeni varlık ekle
  'create-user': [ROLES.SUPERADMIN, ROLES.ADMIN], // Yeni kullanıcı ekle
  'create-category': [ROLES.SUPERADMIN, ROLES.ADMIN], // Yeni kategori ekle
  'create-location': [ROLES.SUPERADMIN, ROLES.ADMIN], // Yeni lokasyon ekle
  'create-department': [ROLES.SUPERADMIN, ROLES.ADMIN], // Yeni birim ekle
  'create-movement': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.BIRIM_SORUMLUSU], // Yeni hareket ekle
  'edit-asset': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT, ROLES.TASINIR_KONTROL], // Varlık düzenle
  'delete-asset': [ROLES.SUPERADMIN, ROLES.ADMIN], // Varlık sil
  'approve-asset': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL], // Varlık onayla
  'reject-asset': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KONTROL], // Varlık reddet
  'edit-category': [ROLES.SUPERADMIN, ROLES.ADMIN], // Kategori düzenle
  'delete-category': [ROLES.SUPERADMIN, ROLES.ADMIN], // Kategori sil
  'edit-location': [ROLES.SUPERADMIN, ROLES.ADMIN], // Lokasyon düzenle
  'delete-location': [ROLES.SUPERADMIN, ROLES.ADMIN], // Lokasyon sil
  'edit-department': [ROLES.SUPERADMIN, ROLES.ADMIN], // Birim düzenle
  'delete-department': [ROLES.SUPERADMIN, ROLES.ADMIN], // Birim sil
  'edit-user': [ROLES.SUPERADMIN, ROLES.ADMIN], // Kullanıcı düzenle
  'delete-user': [ROLES.SUPERADMIN, ROLES.ADMIN], // Kullanıcı sil
  'bulk-import': [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.TASINIR_KAYIT], // Toplu içe aktar
};

/**
 * Kullanıcının rolünü alır
 * @returns {Promise<number|null>} role_id veya null
 */
async function getCurrentUserRole() {
  try {
    // Not: localStorage cache'i hesap değişimlerinde stale kalabiliyor.
    // Bu yüzden öncelikle /auth/me ile doğrula; başarısız olursa cache'e düş.
    const cachedRole = localStorage.getItem('user_role_id');

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      return cachedRole ? Number(cachedRole) : null;
    }

    const data = await response.json();
    const roleId = data?.user?.role_id || null;

    if (roleId) {
      localStorage.setItem('user_role_id', String(roleId));
    }

    return roleId || (cachedRole ? Number(cachedRole) : null);
  } catch (error) {
    console.error('Kullanıcı rolü alınamadı:', error);
    const cachedRole = localStorage.getItem('user_role_id');
    return cachedRole ? Number(cachedRole) : null;
  }
}

/**
 * Kullanıcının belirtilen rollere sahip olup olmadığını kontrol eder
 * @param {number} userRoleId - Kullanıcının rol ID'si
 * @param {number[]} allowedRoles - İzin verilen rol ID'leri
 * @returns {boolean}
 */
function hasPermission(userRoleId, allowedRoles) {
  if (!userRoleId || !Array.isArray(allowedRoles)) return false;
  return allowedRoles.includes(userRoleId);
}

/**
 * Menü öğelerini rol bazlı gösterir/gizler
 * @param {number} userRoleId - Kullanıcının rol ID'si
 */
function applyMenuPermissions(userRoleId) {
  if (!userRoleId) {
    console.warn('applyMenuPermissions: userRoleId yok');
    return;
  }

  // Tüm menü linklerini bul (sadece sidebar menü içindekiler)
  const menuContainer = document.querySelector('#layout-menu, .menu-inner, .navigation-main');
  const menuLinks = menuContainer 
    ? menuContainer.querySelectorAll('a.menu-link')
    : document.querySelectorAll('a.menu-link');
  
  if (menuLinks.length === 0) {
    console.warn('applyMenuPermissions: Menü linkleri bulunamadı');
    return;
  }
  
  console.log(`[RBAC] ${menuLinks.length} menü linki bulundu, kontroller uygulanıyor...`);
  
  menuLinks.forEach((link, index) => {
    const href = link.getAttribute('href') || '';
    // Text içeriğini hem link'ten hem de içindeki div'den al
    const menuText = (link.textContent?.trim() || '').toLowerCase();
    const lowerHref = href.toLowerCase();
    
    // Debug: Her menü linkini logla
    if (lowerHref.includes('user') || menuText.includes('kullanıcı')) {
      console.log(`[RBAC Debug] Menü linki ${index + 1}:`, {
        href: href,
        text: menuText,
        lowerHref: lowerHref,
        element: link
      });
    }
    
    // URL'den sayfa anahtarını çıkar
    let menuKey = null;
    
    // Dashboard kontrolü
    if (lowerHref.includes('dashboard') || lowerHref.includes('index.html') || menuText.includes('dashboard')) {
      menuKey = 'dashboard';
    }
    // Assets Movements kontrolü (önce kontrol et, çünkü assets.html'den önce gelmeli)
    else if (lowerHref.includes('assets-movements') || menuText.includes('hareket')) {
      menuKey = 'assets-movements';
    }
    // Assets kontrolü (assets-movements hariç)
    else if (lowerHref.includes('assets.html') || (lowerHref.includes('asset') && !lowerHref.includes('movements') && !lowerHref.includes('profile'))) {
      menuKey = 'assets';
    }
    // Locations kontrolü
    else if (lowerHref.includes('locations') || lowerHref.includes('location-') || menuText.includes('lokasyon')) {
      menuKey = 'locations';
    }
    // Categories kontrolü
    else if (lowerHref.includes('categories') || lowerHref.includes('category-') || menuText.includes('kategori')) {
      menuKey = 'categories';
    }
    // Users kontrolü - En spesifik kontrol (profile ve user-check gibi şeyleri hariç tut)
    else if (
      (lowerHref.includes('users.html') || 
       (lowerHref.includes('/users') && !lowerHref.includes('profile') && !lowerHref.includes('user-check'))) ||
      (menuText.includes('kullanıcı') && !menuText.includes('profil'))
    ) {
      menuKey = 'users';
    }
    // Profile kontrolü
    else if (lowerHref.includes('profile') || menuText.includes('profil')) {
      menuKey = 'profile';
    }
    // Settings kontrolü
    else if (lowerHref.includes('settings') || menuText.includes('ayar')) {
      menuKey = 'settings';
    }
    
    // Eğer menuKey bulunduysa, yetki kontrolü yap
    if (menuKey) {
      const allowedRoles = MENU_PERMISSIONS[menuKey];
      if (!allowedRoles) {
        console.warn(`MENU_PERMISSIONS'de ${menuKey} bulunamadı`);
        return;
      }
      
      const hasAccess = hasPermission(userRoleId, allowedRoles);
      const menuItem = link.closest('.menu-item');
      
      if (menuItem) {
        if (!hasAccess) {
          console.log(`[RBAC] ${menuKey} menüsü gizleniyor (rol: ${userRoleId}, href: ${href})`);
          menuItem.style.display = 'none';
          // !important ekle (CSS override için)
          menuItem.setAttribute('style', 'display: none !important;');
        } else {
          console.log(`[RBAC] ${menuKey} menüsü gösteriliyor (rol: ${userRoleId})`);
          menuItem.style.display = '';
          menuItem.removeAttribute('style');
        }
      }
    }
  });
}

/**
 * Butonları ve aksiyonları rol bazlı gösterir/gizler
 * @param {number} userRoleId - Kullanıcının rol ID'si
 */
function applyButtonPermissions(userRoleId) {
  if (!userRoleId) return;

  const disableElement = (element) => {
    if (!element) return;

    const mode = element.getAttribute('data-rbac-mode') || 'hide';

    if (mode === 'disable') {
      // Görünür kalsın ama tıklanamaz olsun
      element.classList.add('disabled');
      element.setAttribute('aria-disabled', 'true');
      element.setAttribute('tabindex', '-1');
      element.setAttribute('title', 'Bu işlem için yetkiniz yok');

      if (element.tagName === 'A') {
        const href = element.getAttribute('href');
        if (href && !element.dataset.originalHref) {
          element.dataset.originalHref = href;
        }
        element.setAttribute('href', 'javascript:void(0);');
      } else if ('disabled' in element) {
        element.disabled = true;
      }

      // Anchor'lar için (bootstrap) tıklanmayı tamamen kes
      element.style.pointerEvents = 'none';
      element.style.opacity = '0.6';
      return;
    }

    // default: hide
    element.style.display = 'none';
    const parent = element.parentElement;
    if (parent && parent.children.length === 1 && parent.classList.contains('d-flex')) {
      parent.style.display = 'none';
    }
  };

  const enableElement = (element) => {
    if (!element) return;

    // restore visibility
    element.style.display = '';

    // restore disabled state if any
    element.classList.remove('disabled');
    element.removeAttribute('aria-disabled');
    element.removeAttribute('tabindex');
    element.removeAttribute('title');
    element.style.pointerEvents = '';
    element.style.opacity = '';

    if (element.tagName === 'A') {
      if (element.dataset.originalHref) {
        element.setAttribute('href', element.dataset.originalHref);
        delete element.dataset.originalHref;
      }
    } else if ('disabled' in element) {
      element.disabled = false;
    }
  };

  // data-role attribute'u olan elementleri kontrol et
  Object.keys(BUTTON_PERMISSIONS).forEach(buttonRole => {
    const allowedRoles = BUTTON_PERMISSIONS[buttonRole];
    const hasAccess = hasPermission(userRoleId, allowedRoles);

    // data-role attribute'u ile elementleri bul
    const elements = document.querySelectorAll(`[data-role="${buttonRole}"]`);
    elements.forEach(element => {
      if (!hasAccess) {
        disableElement(element);
      } else {
        enableElement(element);
      }
    });
  });

  // Özel durumlar: href içinde create_asset, create-user vb. geçen linkler
  const specialButtonPatterns = [
    { 
      pattern: /create_asset|create-asset/, 
      roles: BUTTON_PERMISSIONS['create-asset'],
      exclude: ['create-assets-movements'] // Bu pattern'i exclude et
    },
    { pattern: /create-user|create-users/, roles: BUTTON_PERMISSIONS['create-user'] },
    { pattern: /create-category|create-categories/, roles: BUTTON_PERMISSIONS['create-category'] },
    { pattern: /create-location|create-locations/, roles: BUTTON_PERMISSIONS['create-location'] },
    { pattern: /create-department|create-departments/, roles: BUTTON_PERMISSIONS['create-department'] },
    { pattern: /bulk-import/, roles: BUTTON_PERMISSIONS['bulk-import'] },
  ];

  specialButtonPatterns.forEach(({ pattern, roles, exclude = [] }) => {
    const hasAccess = hasPermission(userRoleId, roles);
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      
      // Exclude listesinde varsa atla
      if (exclude.some(ex => href.includes(ex))) {
        return;
      }
      
      if (pattern.test(href)) {
        if (!hasAccess) {
          disableElement(link);
        }
      }
    });
  });

  // Tablo içindeki action butonlarını kontrol et
  const actionButtons = document.querySelectorAll('a[href*="asset-edit"], a[href*="asset-detail"], a[href*="category-edit"], a[href*="location-edit"], a[href*="user-edit"], a[href*="user-detail"]');
  actionButtons.forEach(button => {
    const href = button.getAttribute('href') || '';
    
    // Edit butonları
    if (href.includes('asset-edit')) {
      const hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['edit-asset']);
      if (!hasAccess) {
        button.style.display = 'none';
      }
    } else if (href.includes('category-edit')) {
      const hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['edit-category']);
      if (!hasAccess) {
        button.style.display = 'none';
      }
    } else if (href.includes('location-edit')) {
      const hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['edit-location']);
      if (!hasAccess) {
        button.style.display = 'none';
      }
    } else if (href.includes('user-edit') || href.includes('municipality-user-edit')) {
      const hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['edit-user']);
      if (!hasAccess) {
        button.style.display = 'none';
      }
    }
    
    // Delete butonları (href içinde delete geçen)
    if (href.includes('delete') || href.includes('_delete')) {
      let hasAccess = false;
      if (href.includes('asset') || href.includes('create-asset')) {
        hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['delete-asset']);
      } else if (href.includes('category')) {
        hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['delete-category']);
      } else if (href.includes('location')) {
        hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['delete-location']);
      } else if (href.includes('user')) {
        hasAccess = hasPermission(userRoleId, BUTTON_PERMISSIONS['delete-user']);
      }
      
      if (!hasAccess) {
        button.style.display = 'none';
      }
    }
  });
}

/**
 * Sayfa erişim kontrolü - Eğer kullanıcının bu sayfaya erişim yetkisi yoksa yönlendir
 * @param {number} userRoleId - Kullanıcının rol ID'si
 * @param {string} pageKey - Sayfa anahtarı (örn: 'users', 'assets')
 */
function checkPageAccess(userRoleId, pageKey) {
  if (!userRoleId || !pageKey) return;

  const allowedRoles = MENU_PERMISSIONS[pageKey];
  if (!allowedRoles) return; // Sayfa tanımlı değilse kontrol etme

  const hasAccess = hasPermission(userRoleId, allowedRoles);
  if (!hasAccess) {
    // Yetkisiz erişim - dashboard'a yönlendir
    console.warn(`Kullanıcının ${pageKey} sayfasına erişim yetkisi yok. Dashboard'a yönlendiriliyor.`);
    window.location.href = '/admin/dashboard.html';
    return;
  }
}

/**
 * URL path'inden sayfa anahtarını çıkarır
 * @param {string} path - URL path
 * @returns {string|null} Sayfa anahtarı
 */
function getPageKeyFromPath(path) {
  const pathMap = {
    'dashboard': 'dashboard',
    'assets.html': 'assets',
    'assets-movements.html': 'assets-movements',
    'asset-edit.html': 'assets',
    'asset-detail.html': 'assets',
    'create_asset.html': 'assets',
    'locations.html': 'locations',
    'location-edit.html': 'locations',
    'location-detail.html': 'locations',
    'create-locations.html': 'locations',
    'categories.html': 'categories',
    'category-edit.html': 'categories',
    'category-detail.html': 'categories',
    'create-categories.html': 'categories',
    'users.html': 'users',
    'create-users.html': 'users',
    'municipality-user-edit.html': 'users',
    'municipality-user-detail.html': 'users',
    'profile.html': 'profile',
    'settings.html': 'settings',
  };

  for (const [key, value] of Object.entries(pathMap)) {
    if (path.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Ana fonksiyon - Sayfa yüklendiğinde çalışır
 */
async function initRoleBasedUI() {
  const userRoleId = await getCurrentUserRole();
  
  if (!userRoleId) {
    console.warn('Kullanıcı rolü alınamadı, UI kontrolleri uygulanamadı');
    return;
  }

  // Menü öğelerini kontrol et
  applyMenuPermissions(userRoleId);

  // Butonları kontrol et
  applyButtonPermissions(userRoleId);

  // Sayfa erişim kontrolü (mevcut sayfanın anahtarını URL'den al)
  const currentPath = window.location.pathname;
  const pageKey = getPageKeyFromPath(currentPath);
  if (pageKey) {
    checkPageAccess(userRoleId, pageKey);
  }
}

// Sayfa yüklendiğinde çalıştır
// DOM tamamen yüklendikten sonra çalıştır (menü öğelerinin render edilmesi için)
function runWhenReady() {
  const runInit = () => {
    // Menü linklerinin render edilip edilmediğini kontrol et
    const menuLinks = document.querySelectorAll('a.menu-link');
    if (menuLinks.length > 0) {
      console.log(`[RBAC] ${menuLinks.length} menü linki bulundu, kontroller uygulanıyor...`);
      initRoleBasedUI();
    } else {
      // Menü henüz render edilmemiş, tekrar dene
      console.log('[RBAC] Menü linkleri henüz render edilmemiş, tekrar deneniyor...');
      setTimeout(runInit, 200);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(runInit, 100);
    });
  } else {
    // Sayfa zaten yüklü, kısa bir gecikme ile çalıştır
    setTimeout(runInit, 100);
  }

  // MutationObserver ile menü değişikliklerini izle (dinamik menü render için)
  const observer = new MutationObserver((mutations) => {
    const menuLinks = document.querySelectorAll('a.menu-link');
    if (menuLinks.length > 0) {
      // Menü render edildi, kontrolleri uygula
      getCurrentUserRole().then(roleId => {
        if (roleId) {
          applyMenuPermissions(roleId);
        }
      });
    }
  });

  // Menü container'ını izle
  const menuContainer = document.querySelector('#layout-menu, .menu-inner, .navigation-main');
  if (menuContainer) {
    observer.observe(menuContainer, {
      childList: true,
      subtree: true
    });
  }
}

runWhenReady();

// Global fonksiyonlar
window.getCurrentUserRole = getCurrentUserRole;
window.hasPermission = hasPermission;
window.ROLES = ROLES;
window.MENU_PERMISSIONS = MENU_PERMISSIONS;
window.BUTTON_PERMISSIONS = BUTTON_PERMISSIONS;
