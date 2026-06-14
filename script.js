const menuButton = document.getElementById('menuButton');
const nav = document.getElementById('nav');

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

const stages = {
  "6m": { gestao: 30, excelencia: 20, faturamento: 10 },
  "1a": { gestao: 60, excelencia: 30, faturamento: 20 },
  "2a": { gestao: 100, excelencia: 50, faturamento: 30 }
};

function setStage(stage) {
  const data = stages[stage];
  if (!data) return;

  const gestaoValue = document.getElementById("gestaoValue");
  const excelenciaValue = document.getElementById("excelenciaValue");
  const faturamentoValue = document.getElementById("faturamentoValue");
  const gestaoBar = document.getElementById("gestaoBar");
  const excelenciaBar = document.getElementById("excelenciaBar");
  const faturamentoBar = document.getElementById("faturamentoBar");

  if (!gestaoValue || !excelenciaValue || !faturamentoValue) return;

  gestaoValue.innerText = data.gestao + "%";
  excelenciaValue.innerText = data.excelencia + "%";
  faturamentoValue.innerText = data.faturamento + "%";

  gestaoBar.style.width = data.gestao + "%";
  excelenciaBar.style.width = data.excelencia + "%";
  faturamentoBar.style.width = data.faturamento + "%";

  document.querySelectorAll(".stage-buttons button").forEach(btn => btn.classList.remove("active"));
  const activeButton = document.getElementById("btn" + stage);
  if (activeButton) activeButton.classList.add("active");
}

setStage("6m");
