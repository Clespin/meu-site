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

/* ==========================================================================
   Reveal amarrado ao scroll — progresso contínuo, avança e recua
   conforme a posição real da página (sem disparo único)
   ========================================================================== */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SCRAMBLE_CHARS = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Zona da tela em que a animação começa (perto do rodapé) e termina (mais acima)
const ENTER_AT = 0.92; // 92% da altura da viewport
const SETTLE_AT = 0.55; // 55% da altura da viewport

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

// Elementos que dividem um mesmo container ganham um pequeno atraso
// progressivo (cascata), calculado pela posição entre os irmãos .reveal
function buildRevealList() {
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach(el => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });

  const items = [];
  groups.forEach(siblings => {
    siblings.forEach((el, index) => {
      items.push({ el, offset: index * 46 }); // 46px de defasagem por item
    });
  });
  return items;
}

const revealItems = buildRevealList();
const scrambleItems = Array.from(document.querySelectorAll('[data-text]')).map(el => ({
  el,
  final: el.dataset.text || el.textContent
}));

function updateReveal() {
  const vh = window.innerHeight;
  const start = vh * ENTER_AT;
  const end = vh * SETTLE_AT;

  revealItems.forEach(({ el, offset }) => {
    const top = el.getBoundingClientRect().top - offset;
    const progress = clamp01((start - top) / (start - end));
    el.style.setProperty('--p', progress.toFixed(3));
  });

  scrambleItems.forEach(({ el, final }) => {
    const top = el.getBoundingClientRect().top;
    const progress = clamp01((start - top) / (start - end));
    const revealCount = Math.floor(progress * final.length);

    if (progress <= 0) {
      el.textContent = '';
      return;
    }
    if (progress >= 1) {
      el.textContent = final;
      return;
    }

    el.textContent = final
      .split('')
      .map((char, index) => {
        if (char === ' ') return ' ';
        if (index < revealCount) return final[index];
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      })
      .join('');
  });
}

if (prefersReducedMotion) {
  revealItems.forEach(({ el }) => el.style.setProperty('--p', 1));
  scrambleItems.forEach(({ el, final }) => { el.textContent = final; });
} else {
  let ticking = false;
  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateReveal();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
  updateReveal();
}

/* ==========================================================================
   Malha Cognitiva — fundo poligonal com parallax sutil
   ========================================================================== */
(function initMeshBackground() {
  const canvas = document.getElementById('meshBg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height, nodes;

  const NODE_COUNT_DENSITY = 14000; // px² por nó
  const LINK_DISTANCE = 160;
  const ACCENT_A = '6, 182, 212';   // ciano
  const ACCENT_B = '139, 92, 246';  // roxo

  function buildNodes() {
    const count = Math.max(24, Math.floor((width * height) / NODE_COUNT_DENSITY));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08
    }));
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    buildNodes();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DISTANCE) {
          const opacity = 1 - dist / LINK_DISTANCE;
          const color = (i + j) % 2 === 0 ? ACCENT_A : ACCENT_B;
          ctx.strokeStyle = `rgba(${color}, ${opacity * 0.6})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const node of nodes) {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.7)';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  function onScroll() {
    // Parallax sutil: a malha se move mais devagar que o conteúdo
    const offset = window.scrollY * -0.04;
    canvas.style.transform = `translateY(${offset}px)`;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('resize', resize);
  window.addEventListener('scroll', onScroll, { passive: true });

  resize();
  onScroll();
  if (!prefersReducedMotion) requestAnimationFrame(draw);
})();

/* ==========================================================================
   Painel de previsibilidade
   ========================================================================== */
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
