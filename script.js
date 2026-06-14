// ===== Forecast stages =====
const stages = {
  '6m': { gestao: 30, excelencia: 20, faturamento: 10 },
  '1a': { gestao: 60, excelencia: 50, faturamento: 35 },
  '2a': { gestao: 90, excelencia: 85, faturamento: 70 }
};

function setStage(stage) {
  const data = stages[stage];
  if (!data) return;

  document.getElementById('gestaoValue').textContent = data.gestao + '%';
  document.getElementById('excelenciaValue').textContent = data.excelencia + '%';
  document.getElementById('faturamentoValue').textContent = data.faturamento + '%';

  document.getElementById('gestaoBar').style.width = data.gestao + '%';
  document.getElementById('excelenciaBar').style.width = data.excelencia + '%';
  document.getElementById('faturamentoBar').style.width = data.faturamento + '%';

  ['6m', '1a', '2a'].forEach((s) => {
    document.getElementById('btn' + s).classList.toggle('active', s === stage);
  });
}

// Init default stage on load
document.addEventListener('DOMContentLoaded', () => {
  setStage('6m');

  // ===== Scroll reveal =====
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // ===== Mobile nav toggle =====
  const menuButton = document.getElementById('menuButton');
  const nav = document.getElementById('nav');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', isOpen);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
