const stages = {
  "6m": { gestao: 30, excelencia: 20, faturamento: 10 },
  "1a": { gestao: 60, excelencia: 30, faturamento: 20 },
  "2a": { gestao: 100, excelencia: 50, faturamento: 30 }
};

function setStage(stage) {
  const data = stages[stage];
  document.getElementById("gestaoValue").innerText = data.gestao + "%";
  document.getElementById("excelenciaValue").innerText = data.excelencia + "%";
  document.getElementById("faturamentoValue").innerText = data.faturamento + "%";
  document.getElementById("gestaoBar").style.width = data.gestao + "%";
  document.getElementById("excelenciaBar").style.width = data.excelencia + "%";
  document.getElementById("faturamentoBar").style.width = data.faturamento + "%";
  document.querySelectorAll(".stage-buttons button").forEach(btn => btn.classList.remove("active"));
  if (stage === "6m") document.getElementById("btn6m").classList.add("active");
  if (stage === "1a") document.getElementById("btn1a").classList.add("active");
  if (stage === "2a") document.getElementById("btn2a").classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  setStage("6m");
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".nav-menu");
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
  document.querySelectorAll(".nav-menu a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});
