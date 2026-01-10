// Distribution chart functions for asset movements

async function initMovementDistribution() {
  const container = document.querySelector('[data-role="movement-distribution"]');
  if (!container) return;

  try {
    const data = await apiFetch('/asset-movements/movement-type-distribution');
    renderDistribution(data.distribution || [], data.totalMovements || 0);
  } catch (err) {
    container.innerHTML =
      '<p class="text-muted">Dağılım verisi alınamadı</p>';
  }
}

function renderDistribution(distribution, totalMovements) {
  const container = document.querySelector('[data-role="movement-distribution"]');
  const alertContainer = document.querySelector('[data-role="movement-distribution-alert"]');
  
  if (!container) return;

  if (!distribution || distribution.length === 0) {
    container.innerHTML = '<p class="text-muted mb-0">Henüz hareket kaydı bulunmuyor.</p>';
    return;
  }

  const html = `
    <ul class="list-unstyled mb-0">
      ${distribution.map(item => {
        const label = getMovementTypeLabel(item.movement_type);
        const badgeClass = getMovementTypeBadgeClass(item.movement_type);
        return `
          <li class="d-flex align-items-center justify-content-between mb-2">
            <div>
              <span class="badge ${badgeClass} badge-dot me-2"></span>
              ${label}
            </div>
            <span class="fw-semibold">${item.percentage}%</span>
          </li>
        `;
      }).join('')}
    </ul>
  `;

  container.innerHTML = html;
}

// Expose for module-to-module coordination (init file)
window.initMovementDistribution = initMovementDistribution;

