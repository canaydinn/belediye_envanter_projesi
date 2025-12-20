// Initialization code for asset movements page

document.addEventListener('DOMContentLoaded', async () => {
  await loadMovementCounters();
  await loadMovements();
  initDepartmentFilter();
  initMovementDistribution();
  initFilterButtons();
});

