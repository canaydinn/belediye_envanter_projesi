/**
 * Municipality User Detail Page Scripts Loader
 * Bu dosya, municipality-user-detail.html sayfası için gerekli tüm script dosyalarını yükler.
 */

(function() {
  'use strict';

  // Script dosyalarının yolu
  const scriptsPath = '../admin/assets/';
  
  // Yüklenecek script dosyaları (sırayla)
  const scripts = [
    // Core JS - Vendor Libraries
    { src: scriptsPath + 'vendor/libs/jquery/jquery.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/libs/popper/popper.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/js/bootstrap.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/libs/perfect-scrollbar/perfect-scrollbar.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/libs/node-waves/node-waves.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/libs/hammer/hammer.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/libs/i18n/i18n.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/libs/typeahead-js/typeahead.js', type: 'vendor' },
    { src: scriptsPath + 'vendor/js/menu.js', type: 'vendor' },
    
    // Main JS
    { src: scriptsPath + 'js/main.js', type: 'main' },
    
    // Super Admin Utilities
    { src: scriptsPath + 'js/app/super-admin-utils.js', type: 'app' },
    
    // Municipality User API
    { src: scriptsPath + 'js/app/municipality-user-api.js', type: 'app' },
    
    // Municipality User Renderer
    { src: scriptsPath + 'js/app/municipality-user-renderer.js', type: 'app' },
    
    // Municipality User Detail Page Logic
    { src: scriptsPath + 'js/app/municipality-user-detail.js', type: 'app' },
    
    // Logout
    { src: scriptsPath + 'js/app/logout.js', type: 'app' }
  ];

  /**
   * Script dosyasını yükler
   * @param {string} src - Script dosyasının yolu
   * @param {number} index - Script'in sırası
   * @returns {Promise} - Yükleme promise'i
   */
  function loadScript(src, index) {
    return new Promise(function(resolve, reject) {
      // Script zaten yüklenmiş mi kontrol et
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false; // Sıralı yükleme için
      script.defer = false;
      
      script.onload = function() {
        resolve();
      };
      
      script.onerror = function() {
        console.error('Script yüklenemedi: ' + src);
        reject(new Error('Script yüklenemedi: ' + src));
      };
      
      // Önceki script'ten sonra ekle
      const previousScript = document.querySelector('script[data-script-index="' + (index - 1) + '"]');
      if (previousScript && previousScript.nextSibling) {
        previousScript.parentNode.insertBefore(script, previousScript.nextSibling);
      } else {
        document.body.appendChild(script);
      }
      
      script.setAttribute('data-script-index', index);
    });
  }

  /**
   * Tüm script dosyalarını sırayla yükler
   */
  function loadAllScripts() {
    const loadPromises = scripts.map(function(script, index) {
      return loadScript(script.src, index);
    });

    Promise.all(loadPromises)
      .then(function() {
        console.log('Tüm script dosyaları başarıyla yüklendi.');
      })
      .catch(function(error) {
        console.error('Script yükleme hatası:', error);
      });
  }

  // DOM hazır olduğunda script'leri yükle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllScripts);
  } else {
    loadAllScripts();
  }
})();

