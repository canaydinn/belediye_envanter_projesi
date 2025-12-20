// QR Scan page - Camera-based QR code scanning
(function () {
  'use strict';

  let html5QrcodeScanner = null;
  let isScanning = false;
  let lastScannedCode = null;

  // Durum etiketleri için mapping
  const statusMap = {
    active: { label: 'Aktif', className: 'badge bg-label-success' },
    in_maintenance: { label: 'Bakımda', className: 'badge bg-label-warning' },
    disposed: { label: 'Hurda', className: 'badge bg-label-danger' },
    lost: { label: 'Pasif', className: 'badge bg-label-secondary' }
  };

  // Tarih formatlama fonksiyonu
  const formatDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
  };

  // Tarih formatlama (sadece tarih)
  const formatDateOnly = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? '-'
      : d.toLocaleDateString('tr-TR');
  };

  // Para formatlama
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Varlık tipi formatlama
  const formatAssetType = (type) => {
    const typeMap = {
      demirbas: 'Demirbaş',
      sarf: 'Sarf Malzeme',
      hizmet: 'Hizmet'
    };
    return typeMap[type] || type || '-';
  };

  // Durum render etme
  const renderStatus = (status) => {
    const key = (status || '').toLowerCase();
    const m = statusMap[key] || { label: status || 'Bilinmiyor', className: 'badge bg-label-secondary' };
    return { label: m.label, className: m.className };
  };

  // DOM elementleri
  const qrReaderElement = document.getElementById('qr-reader');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const assetInfoCard = document.getElementById('assetInfoCard');
  const loadingCard = document.getElementById('loadingCard');
  const errorCard = document.getElementById('errorCard');
  const initialCard = document.getElementById('initialCard');
  const assetInfoContent = document.getElementById('assetInfoContent');
  const assetStatusBadge = document.getElementById('assetStatusBadge');
  const viewAssetDetailBtn = document.getElementById('viewAssetDetailBtn');
  const editAssetBtn = document.getElementById('editAssetBtn');
  const errorMessage = document.getElementById('errorMessage');

  // Kamerayı başlat
  async function startCamera() {
    if (isScanning) {
      return;
    }

    try {
      // HTML5 QR Code Scanner'ı başlat
      html5QrcodeScanner = new Html5Qrcode('qr-reader');
      
      await html5QrcodeScanner.start(
        { facingMode: 'environment' }, // Arka kamera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanError
      );

      isScanning = true;
      startCameraBtn.style.display = 'none';
      stopCameraBtn.style.display = 'inline-block';
      showInitialState();
    } catch (err) {
      console.error('Kamera başlatılamadı:', err);
      alert('Kamera başlatılamadı. Lütfen kamera izinlerini kontrol edin.');
    }
  }

  // Kamerayı durdur
  async function stopCamera() {
    if (!isScanning || !html5QrcodeScanner) {
      return;
    }

    try {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner.clear();
      html5QrcodeScanner = null;
      isScanning = false;
      startCameraBtn.style.display = 'inline-block';
      stopCameraBtn.style.display = 'none';
    } catch (err) {
      console.error('Kamera durdurulamadı:', err);
    }
  }

  // QR kod başarıyla taranınca
  async function onScanSuccess(decodedText, decodedResult) {
    // Aynı kodu tekrar taramayı önle
    if (decodedText === lastScannedCode) {
      return;
    }

    lastScannedCode = decodedText;
    console.log('QR Kod taranan:', decodedText);

    // Varlık bilgisini yükle
    await loadAssetByQRCode(decodedText);
  }

  // QR kod tarama hatası
  function onScanError(errorMessage) {
    // Hata mesajlarını sessizce yoksay (sürekli log spam olmasın)
    // console.log('QR tarama hatası:', errorMessage);
  }

  // QR kod ile varlık bilgisini yükle
  async function loadAssetByQRCode(qrCode) {
    showLoadingState();

    try {
      const asset = await apiFetch(`/assets/qr/${encodeURIComponent(qrCode)}`, { method: 'GET' });
      console.log('Varlık bilgisi:', asset);
      
      if (!asset || !asset.id) {
        showErrorState('Varlık bilgisi bulunamadı');
        return;
      }
      
      renderAssetInfo(asset);
    } catch (err) {
      console.error('Varlık bilgisi alınamadı:', err);
      const errorMsg = err.message || 'Varlık bulunamadı';
      console.log('Hata mesajı:', errorMsg);
      showErrorState(errorMsg);
      
      // Kullanıcıya bildirim göster (eğer toastr varsa)
      if (typeof toastr !== 'undefined') {
        toastr.error(errorMsg, 'QR Kod Hatası', { timeOut: 3000 });
      }
    }
  }

  // Varlık bilgilerini render et
  function renderAssetInfo(asset) {
    if (!asset) {
      showErrorState('Varlık bilgisi bulunamadı');
      return;
    }

    const status = renderStatus(asset.status);

    // Durum badge
    if (assetStatusBadge) {
      assetStatusBadge.textContent = status.label;
      assetStatusBadge.className = status.className;
    }

    // Varlık bilgileri HTML'i oluştur
    const html = `
      <div class="row g-3">
        <div class="col-12">
          <small class="text-muted d-block">Varlık Adı</small>
          <p class="mb-0 fw-semibold">${asset.name || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Varlık Kodu</small>
          <p class="mb-0">${asset.asset_code || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Kategori</small>
          <p class="mb-0">${asset.category_name || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Birim</small>
          <p class="mb-0">${asset.department_name || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Lokasyon</small>
          <p class="mb-0">${asset.location_name || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Sorumlu Kullanıcı</small>
          <p class="mb-0">${asset.assigned_user_name || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Durum</small>
          <p class="mb-0"><span class="${status.className}">${status.label}</span></p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Miktar</small>
          <p class="mb-0">${asset.quantity || '-'} ${asset.unit || ''}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Seri Numarası</small>
          <p class="mb-0">${asset.serial_number || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Marka</small>
          <p class="mb-0">${asset.brand || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Model</small>
          <p class="mb-0">${asset.model || '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Satın Alma Fiyatı</small>
          <p class="mb-0">${asset.purchase_price ? formatCurrency(asset.purchase_price) : '-'}</p>
        </div>
        <div class="col-12 col-md-6">
          <small class="text-muted d-block">Satın Alma Tarihi</small>
          <p class="mb-0">${formatDateOnly(asset.purchase_date)}</p>
        </div>
        ${asset.description ? `
        <div class="col-12">
          <small class="text-muted d-block">Açıklama</small>
          <p class="mb-0">${asset.description}</p>
        </div>
        ` : ''}
      </div>
    `;

    if (assetInfoContent) {
      assetInfoContent.innerHTML = html;
    }

    // Buton linklerini ayarla
    if (viewAssetDetailBtn) {
      viewAssetDetailBtn.href = `/admin/asset-detail.html?id=${asset.id}`;
    }
    if (editAssetBtn) {
      editAssetBtn.href = `/admin/asset-edit.html?id=${asset.id}`;
    }

    showAssetInfoState();
  }

  // Durum gösterimi fonksiyonları
  function showInitialState() {
    if (initialCard) initialCard.style.display = 'block';
    if (assetInfoCard) assetInfoCard.classList.remove('show');
    if (loadingCard) loadingCard.style.display = 'none';
    if (errorCard) errorCard.style.display = 'none';
  }

  function showLoadingState() {
    if (initialCard) initialCard.style.display = 'none';
    if (assetInfoCard) assetInfoCard.classList.remove('show');
    if (loadingCard) loadingCard.style.display = 'block';
    if (errorCard) errorCard.style.display = 'none';
  }

  function showAssetInfoState() {
    if (initialCard) initialCard.style.display = 'none';
    if (assetInfoCard) assetInfoCard.classList.add('show');
    if (loadingCard) loadingCard.style.display = 'none';
    if (errorCard) errorCard.style.display = 'none';
  }

  function showErrorState(message) {
    console.log('showErrorState çağrıldı, mesaj:', message);
    
    if (initialCard) initialCard.style.display = 'none';
    if (assetInfoCard) assetInfoCard.classList.remove('show');
    if (loadingCard) loadingCard.style.display = 'none';
    
    if (errorCard) {
      errorCard.style.display = 'block';
      if (errorMessage) {
        errorMessage.textContent = message || 'Varlık bulunamadı';
        console.log('Hata mesajı gösterildi:', errorMessage.textContent);
      } else {
        console.error('errorMessage elementi bulunamadı!');
      }
    } else {
      console.error('errorCard elementi bulunamadı!');
    }
    
    // 5 saniye sonra tekrar başlangıç durumuna dön (daha uzun süre göster)
    setTimeout(() => {
      if (isScanning) {
        showInitialState();
        lastScannedCode = null; // Tekrar taramaya izin ver
      }
    }, 5000);
  }

  // Event listeners
  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', startCamera);
  }

  if (stopCameraBtn) {
    stopCameraBtn.addEventListener('click', stopCamera);
  }

  // Sayfa kapatılırken kamerayı durdur
  window.addEventListener('beforeunload', () => {
    if (isScanning) {
      stopCamera();
    }
  });

  // Sayfa görünürlüğü değiştiğinde kamerayı durdur/başlat
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isScanning) {
      stopCamera();
    }
  });
})();

