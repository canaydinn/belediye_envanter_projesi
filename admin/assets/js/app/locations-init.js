// Locations initialization - Initialize all location page components

document.addEventListener('DOMContentLoaded', async () => {
  await loadLocations();
  initDepartmentFilter();
  loadLocationStats();
  loadLocationTypeDistribution();
  wireLocationFilters(); 
});

