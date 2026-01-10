// Utility functions for asset movements

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function getMovementTypeLabel(type) {
  const labels = {
    'assign': 'Zimmet',
    'transfer': 'Devir',
    'location_change': 'Lokasyon Değişikliği',
    'maintenance': 'Bakım',
    'dispose': 'Hurda',
    'return': 'İade'
  };
  return labels[type] || type;
}

function getMovementTypeBadgeClass(type) {
  const classes = {
    'assign': 'bg-label-primary',
    'transfer': 'bg-label-info',
    'location_change': 'bg-label-secondary',
    'maintenance': 'bg-label-warning',
    'dispose': 'bg-label-danger',
    'return': 'bg-label-success'
  };
  return classes[type] || 'bg-label-secondary';
}

// Expose for module-to-module coordination (movements-list.js template rendering)
window.formatDate = formatDate;
window.getMovementTypeLabel = getMovementTypeLabel;
window.getMovementTypeBadgeClass = getMovementTypeBadgeClass;

