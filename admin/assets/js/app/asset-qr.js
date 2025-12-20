// Asset QR Codes - Display QR codes for assets
document.addEventListener('DOMContentLoaded', async () => {
  const qrCodesContainer = document.getElementById('qrCodesContainer');
  const qrCodesCount = document.getElementById('qrCodesCount');
  const filterBtn = document.getElementById('filterBtn');
  const printAllBtn = document.getElementById('printAllQRCodes');
  
  let allAssets = [];
  let filteredAssets = [];

  // Get asset ID from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const assetId = urlParams.get('id');

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const options = await apiFetch('/assets/filters');
      
      // Populate category filter
      const categorySelect = document.getElementById('filterCategory');
      if (categorySelect && options.categories) {
        options.categories.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = cat.name;
          categorySelect.appendChild(option);
        });
      }

      // Populate department filter
      const departmentSelect = document.getElementById('filterDepartment');
      if (departmentSelect && options.departments) {
        options.departments.forEach(dept => {
          const option = document.createElement('option');
          option.value = dept.id;
          option.textContent = dept.name;
          departmentSelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error('Filtre seçenekleri yüklenemedi:', err);
    }
  };

  // Generate QR code URL for an asset
  const getQRCodeUrl = (asset) => {
    // Use asset_code or id for QR code
    const qrData = asset.asset_code || `ASSET-${asset.id}`;
    return `/api/assets/${asset.id}/qrcode?data=${encodeURIComponent(qrData)}`;
  };

  // Render QR code card
  const renderQRCodeCard = (asset) => {
    const qrCodeUrl = getQRCodeUrl(asset);
    return `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3">
        <div class="card h-100">
          <div class="card-body text-center">
            <div class="mb-3">
              <img 
                src="${qrCodeUrl}" 
                alt="QR Code for ${asset.name || asset.asset_code}"
                class="img-fluid"
                style="max-width: 200px; height: auto;"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3EQR Kod Yüklenemedi%3C/text%3E%3C/svg%3E'"
              />
            </div>
            <h6 class="card-title mb-1">${asset.name || 'İsimsiz Varlık'}</h6>
            <p class="text-muted small mb-2">${asset.asset_code || `ID: ${asset.id}`}</p>
            ${asset.category_name ? `<p class="text-muted small mb-2"><i class="ti ti-folder me-1"></i>${asset.category_name}</p>` : ''}
            ${asset.department_name ? `<p class="text-muted small mb-2"><i class="ti ti-building me-1"></i>${asset.department_name}</p>` : ''}
            <div class="mt-3">
              <button 
                class="btn btn-sm btn-outline-primary print-qr-btn" 
                data-asset-id="${asset.id}"
                data-asset-name="${asset.name || asset.asset_code}"
              >
                <i class="ti ti-printer me-1"></i>Yazdır
              </button>
              <a 
                href="/admin/asset-detail.html?id=${asset.id}" 
                class="btn btn-sm btn-outline-secondary"
              >
                <i class="ti ti-eye me-1"></i>Detay
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // Load and display QR codes
  const loadQRCodes = async (filters = {}) => {
    if (!qrCodesContainer) return;

    // Show loading state
    qrCodesContainer.innerHTML = `
      <div class="col-12 text-center text-muted py-5">
        <i class="ti ti-qrcode ti-xl mb-2"></i>
        <p>QR kodlar yükleniyor...</p>
      </div>
    `;

    try {
      // Load all assets if not already loaded
      if (allAssets.length === 0) {
        allAssets = await apiFetch('/assets', { method: 'GET' });
        if (!Array.isArray(allAssets)) allAssets = [];
      }

      // Apply filters
      filteredAssets = [...allAssets];

      // Filter by asset ID if specified in URL
      if (assetId) {
        filteredAssets = filteredAssets.filter(asset => String(asset.id) === String(assetId));
      }

      // Filter by name/code
      if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        filteredAssets = filteredAssets.filter(asset => 
          (asset.name?.toLowerCase().includes(searchTerm) || 
           asset.asset_code?.toLowerCase().includes(searchTerm))
        );
      }

      // Filter by category
      if (filters.category_id) {
        filteredAssets = filteredAssets.filter(asset => 
          String(asset.category_id) === String(filters.category_id)
        );
      }

      // Filter by department
      if (filters.department_id) {
        filteredAssets = filteredAssets.filter(asset => 
          String(asset.department_id) === String(filters.department_id)
        );
      }

      // Update count
      if (qrCodesCount) {
        qrCodesCount.textContent = `${filteredAssets.length} varlık`;
      }

      // Render QR codes
      if (filteredAssets.length === 0) {
        qrCodesContainer.innerHTML = `
          <div class="col-12 text-center text-muted py-5">
            <i class="ti ti-qrcode ti-xl mb-2"></i>
            <p>Filtre kriterlerine uygun varlık bulunamadı.</p>
          </div>
        `;
        return;
      }

      qrCodesContainer.innerHTML = filteredAssets.map(renderQRCodeCard).join('');

      // Add print event listeners
      document.querySelectorAll('.print-qr-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const assetId = e.target.closest('.print-qr-btn').dataset.assetId;
          const assetName = e.target.closest('.print-qr-btn').dataset.assetName;
          printQRCode(assetId, assetName);
        });
      });

    } catch (err) {
      console.error('QR kodlar yüklenemedi:', err);
      qrCodesContainer.innerHTML = `
        <div class="col-12 text-center text-danger py-5">
          <i class="ti ti-alert-circle ti-xl mb-2"></i>
          <p>QR kodlar yüklenirken hata oluştu.</p>
        </div>
      `;
    }
  };

  // Print single QR code
  const printQRCode = (assetId, assetName) => {
    const qrCodeUrl = `/api/assets/${assetId}/qrcode`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Kod - ${assetName}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            h2 { margin-bottom: 20px; }
            img { max-width: 300px; height: auto; }
            .info { margin-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h2>${assetName}</h2>
          <img src="${qrCodeUrl}" alt="QR Code" />
          <div class="info">
            <p><strong>Varlık:</strong> ${assetName}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Print all QR codes
  if (printAllBtn) {
    printAllBtn.addEventListener('click', () => {
      if (filteredAssets.length === 0) {
        alert('Yazdırılacak QR kod bulunamadı.');
        return;
      }

      const printWindow = window.open('', '_blank');
      const qrCodesHtml = filteredAssets.map(asset => {
        const qrCodeUrl = getQRCodeUrl(asset);
        return `
          <div style="page-break-after: always; text-align: center; padding: 20px;">
            <h3>${asset.name || 'İsimsiz Varlık'}</h3>
            <p><strong>Kod:</strong> ${asset.asset_code || `ID: ${asset.id}`}</p>
            <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 300px; height: auto;" />
            ${asset.category_name ? `<p><strong>Kategori:</strong> ${asset.category_name}</p>` : ''}
            ${asset.department_name ? `<p><strong>Birim:</strong> ${asset.department_name}</p>` : ''}
          </div>
        `;
      }).join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Tüm QR Kodlar</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
            </style>
          </head>
          <body>
            ${qrCodesHtml}
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  }

  // Filter button event
  if (filterBtn) {
    filterBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const filters = {
        name: document.getElementById('filterName')?.value.trim() || null,
        category_id: document.getElementById('filterCategory')?.value || null,
        department_id: document.getElementById('filterDepartment')?.value || null
      };

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        if (!filters[key] || filters[key] === '') {
          delete filters[key];
        }
      });

      await loadQRCodes(filters);
    });
  }

  // Initial load
  await loadFilterOptions();
  await loadQRCodes();
});

