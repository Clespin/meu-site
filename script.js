/* ==========================================================================
   Menu mobile
   ========================================================================== */
(function initMenu() {
  const menuButton = document.getElementById('menuButton');
  const nav = document.getElementById('nav');
  if (!menuButton || !nav) return;

  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ==========================================================================
   Reveal on scroll — cascata de carregamento de dados
   ========================================================================== */
(function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(element => revealObserver.observe(element));

  // Rede de segurança: se por algum motivo o observer não disparar a tempo
  // (ex.: captura automatizada de tela/PDF antes do scroll acontecer),
  // nada fica permanentemente invisível.
  window.setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => el.classList.add('visible'));
  }, 1800);
})();

/* ==========================================================================
   Scramble Text — decodificação da linguagem natural pelo modelo
   ========================================================================== */
(function initScramble() {
  const targets = document.querySelectorAll('[data-text]');
  if (!targets.length) return;

  const SCRAMBLE_CHARS = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrambleReveal(el) {
    const final = el.dataset.text || el.textContent;

    if (prefersReducedMotion) {
      el.textContent = final;
      return;
    }

    const duration = 900;
    const frameRate = 32;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      const revealCount = Math.floor((frame / totalFrames) * final.length);

      el.textContent = final
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (index < revealCount) return final[index];
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join('');

      if (frame >= totalFrames) {
        el.textContent = final;
        clearInterval(interval);
      }
    }, frameRate);
  }

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => { el.textContent = el.dataset.text || el.textContent; });
    return;
  }

  const scrambleObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        scrambleReveal(entry.target);
        scrambleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  targets.forEach(element => scrambleObserver.observe(element));
})();

/* ==========================================================================
   Malha Cognitiva — fundo poligonal com parallax sutil
   Correções: pausa quando a aba está oculta (Page Visibility API),
   debounce no resize, densidade de nós reduzida em telas pequenas.
   ========================================================================== */
(function initMeshBackground() {
  const canvas = document.getElementById('meshBg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width, height, nodes;
  let animationId = null;
  let resizeTimeout = null;

  const NODE_COUNT_DENSITY_DESKTOP = 14000; // px² por nó
  const NODE_COUNT_DENSITY_MOBILE = 26000;  // menos nós em telas pequenas: menor custo de CPU/bateria
  const MOBILE_BREAKPOINT = 620;
  const LINK_DISTANCE = 160;
  const ACCENT_A = '6, 182, 212';   // ciano
  const ACCENT_B = '139, 92, 246';  // roxo

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildNodes() {
    const density = width <= MOBILE_BREAKPOINT ? NODE_COUNT_DENSITY_MOBILE : NODE_COUNT_DENSITY_DESKTOP;
    const count = Math.max(18, Math.floor((width * height) / density));
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

  function debouncedResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 150);
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

    animationId = requestAnimationFrame(draw);
  }

  function startAnimation() {
    if (prefersReducedMotion || animationId !== null) return;
    animationId = requestAnimationFrame(draw);
  }

  function stopAnimation() {
    if (animationId === null) return;
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  function onScroll() {
    // Parallax sutil: a malha se move mais devagar que o conteúdo
    const offset = window.scrollY * -0.04;
    canvas.style.transform = `translateY(${offset}px)`;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  }

  window.addEventListener('resize', debouncedResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);

  resize();
  onScroll();
  startAnimation();
})();

/* ==========================================================================
   Painel de previsibilidade
   Correção: handlers via addEventListener (data-stage) em vez de onclick
   inline, aria-pressed sincronizado para leitores de tela, e gráfico
   Chart.js (linha, 3 séries) sincronizado com os cartões de percentual —
   dados fiéis à referência aprovada, mapeados para gestão/excelência/faturamento.
   ========================================================================== */
(function initForecastPanel() {
  const stages = {
    "6m": {
      graph: {
        gestao:       [0, 55, 15, 60, 20, 40], // termina em 40%
        excelencia:   [0, 35, 5, 45, 10, 20],  // termina em 20%
        faturamento:  [0, 20, 2, 25, 5, 10]    // termina em 10%
      },
      percents: { gestao: 40, excelencia: 20, faturamento: 10 }
    },
    "1a": {
      graph: {
        gestao:       [0, 75, 25, 85, 35, 60], // termina em 60%
        excelencia:   [0, 45, 10, 55, 15, 30], // termina em 30%
        faturamento:  [0, 30, 5, 40, 10, 20]   // termina em 20%
      },
      percents: { gestao: 60, excelencia: 30, faturamento: 20 }
    },
    "2a": {
      graph: {
        gestao:       [0, 85, 45, 98, 60, 95], // oscila até 98%, termina em 95%
        excelencia:   [0, 50, 20, 80, 35, 65], // termina em 65%
        faturamento:  [0, 35, 15, 65, 25, 55]  // termina em 55%
      },
      percents: { gestao: 95, excelencia: 65, faturamento: 55 }
    }
  };

  const gestaoValue = document.getElementById("gestaoValue");
  const excelenciaValue = document.getElementById("excelenciaValue");
  const faturamentoValue = document.getElementById("faturamentoValue");
  const gestaoBar = document.getElementById("gestaoBar");
  const excelenciaBar = document.getElementById("excelenciaBar");
  const faturamentoBar = document.getElementById("faturamentoBar");
  const stageButtons = document.querySelectorAll(".stage-buttons button[data-stage]");
  const chartContainer = document.getElementById("forecastChart");

  if (!gestaoValue || !excelenciaValue || !faturamentoValue || !gestaoBar || !excelenciaBar || !faturamentoBar || !stageButtons.length) {
    return;
  }

  // Gráfico desenhado em SVG puro (sem CDN externo) — elimina o risco de
  // painel vazio quando uma biblioteca de terceiros não carrega.
  const SERIES = [
    { key: "gestao", color: "#bc8cff" },
    { key: "excelencia", color: "#58a6ff" },
    { key: "faturamento", color: "#38d3c6" }
  ];
  const VIEW_W = 600, VIEW_H = 200, PAD = 6;

  function buildPoints(values) {
    const step = (VIEW_W - PAD * 2) / (values.length - 1);
    return values.map((v, i) => {
      const x = PAD + i * step;
      const y = PAD + (VIEW_H - PAD * 2) * (1 - v / 100);
      return [x, y];
    });
  }

  function pointsToPath(points) {
    return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }

  function renderChart(stageData) {
    if (!chartContainer) return;

    const gridLines = [25, 50, 75].map(pct => {
      const y = (PAD + (VIEW_H - PAD * 2) * (1 - pct / 100)).toFixed(1);
      return `<line x1="${PAD}" y1="${y}" x2="${VIEW_W - PAD}" y2="${y}" stroke="#262938" stroke-width="1" stroke-dasharray="4 4" />`;
    }).join("");

    const seriesMarkup = SERIES.map(s => {
      const points = buildPoints(stageData.graph[s.key]);
      const line = pointsToPath(points);
      const fillPoints = `${PAD},${VIEW_H - PAD} ${line} ${VIEW_W - PAD},${VIEW_H - PAD}`;
      return `
        <polygon points="${fillPoints}" fill="${s.color}" fill-opacity="0.14" />
        <polyline points="${line}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      `;
    }).join("");

    chartContainer.innerHTML = `
      <svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        ${gridLines}
        ${seriesMarkup}
      </svg>
    `;
  }

  function setStage(stage) {
    const data = stages[stage];
    if (!data) return;

    gestaoValue.innerText = data.percents.gestao + "%";
    excelenciaValue.innerText = data.percents.excelencia + "%";
    faturamentoValue.innerText = data.percents.faturamento + "%";

    gestaoBar.style.width = data.percents.gestao + "%";
    excelenciaBar.style.width = data.percents.excelencia + "%";
    faturamentoBar.style.width = data.percents.faturamento + "%";

    renderChart(data);

    stageButtons.forEach(btn => {
      const isActive = btn.dataset.stage === stage;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  stageButtons.forEach(btn => {
    btn.addEventListener("click", () => setStage(btn.dataset.stage));
  });

  setStage("6m");
})();
