// Locations initialization - Initialize all location page components

document.addEventListener('DOMContentLoaded', async () => {
  await window.loadLocations?.();
  await window.initDepartmentFilter?.();
  await window.loadLocationStats?.();
  await window.loadLocationTypeDistribution?.();
  window.wireLocationFilters?.();
});

