// Initialization code for asset movements page

document.addEventListener('DOMContentLoaded', async () => {
  await window.loadMovementCounters?.();
  await window.loadMovements?.();
  window.initDepartmentFilter?.();
  await window.initMovementDistribution?.();
  window.initFilterButtons?.();
});

