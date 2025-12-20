// Footer yıl bilgisini dinamik olarak yazdır
document.addEventListener('DOMContentLoaded', function() {
  const yearElements = document.querySelectorAll('[data-footer-year]');
  const currentYear = new Date().getFullYear();
  yearElements.forEach(element => {
    element.textContent = currentYear;
  });
});

