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
   Gráfico em canvas puro (sem biblioteca externa, sem CDN) com animação de
   mola: cada ponto parte em sequência (esquerda → direita, série por série),
   ultrapassa levemente o alvo e assenta. Números e barras acompanham o gráfico.
   Handlers via addEventListener (data-stage) e aria-pressed sincronizado.
   ========================================================================== */
(function initForecastPanel() {
  const stages = {
    "6m": {
      graph: {
        gestao:       [0, 55, 15, 60, 20, 40], // termina em 40%
        excelencia:   [0, 35, 5, 45, 10, 20],  // termina em 20%
        faturamento:  [0, 20, 2, 25, 5, 10]    // termina em 10%
      }
    },
    "1a": {
      graph: {
        gestao:       [0, 75, 25, 85, 35, 60], // termina em 60%
        excelencia:   [0, 45, 10, 55, 15, 30], // termina em 30%
        faturamento:  [0, 30, 5, 40, 10, 20]   // termina em 20%
      }
    },
    "2a": {
      graph: {
        gestao:       [0, 85, 45, 98, 60, 95], // termina em 95%
        excelencia:   [0, 50, 20, 80, 35, 65], // termina em 65%
        faturamento:  [0, 35, 15, 65, 25, 55]  // termina em 55%
      }
    }
  };

  const SERIES = [
    { key: "gestao",      label: "Renovar gestão",         color: "#bc8cff", rgb: "188,140,255", delay: 0.00 },
    { key: "excelencia",  label: "Crescer com excelência", color: "#58a6ff", rgb: "88,166,255",  delay: 0.12 },
    { key: "faturamento", label: "Conquistar faturamento", color: "#38d3c6", rgb: "56,211,198",  delay: 0.24 }
  ];

  const valueEls = {
    gestao: document.getElementById("gestaoValue"),
    excelencia: document.getElementById("excelenciaValue"),
    faturamento: document.getElementById("faturamentoValue")
  };
  const barEls = {
    gestao: document.getElementById("gestaoBar"),
    excelencia: document.getElementById("excelenciaBar"),
    faturamento: document.getElementById("faturamentoBar")
  };
  const stageButtons = document.querySelectorAll(".stage-buttons button[data-stage]");
  const chartContainer = document.getElementById("forecastChart");

  const allPresent = SERIES.every(s => valueEls[s.key] && barEls[s.key]);
  if (!allPresent || !stageButtons.length || !chartContainer) return;

  /* ---------- Configuração da animação (física de mola) ---------- */
  const STIFFNESS = 70;       // maior = mola mais rápida
  const DAMPING = 11;         // menor = mais ultrapasse; maior = movimento mais seco
  const POINT_STAGGER = 0.09; // segundos entre um ponto e o seguinte (onda esquerda → direita)
  const POINTS = 6;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

  /* ---------- Estado ---------- */
  const state = {};
  SERIES.forEach(s => {
    state[s.key] = Array.from({ length: POINTS }, () => ({ x: 0, v: 0, target: 0, delay: 0 }));
  });

  let canvas = null;
  let ctx = null;
  let cssW = 0;
  let cssH = 0;
  let rafId = null;
  let running = false;

  // As barras são guiadas quadro a quadro pelo JS: sem transição CSS para não "atrasar"
  SERIES.forEach(s => { barEls[s.key].style.transition = "none"; });

  /* ---------- Canvas ---------- */
  function resizeCanvas() {
    const rect = chartContainer.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setupCanvas() {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    chartContainer.innerHTML = "";
    chartContainer.appendChild(canvas);
    ctx = canvas.getContext("2d");
    if (!ctx) return false;
    resizeCanvas();

    const onResize = () => { resizeCanvas(); draw(); };
    if ("ResizeObserver" in window) {
      new ResizeObserver(onResize).observe(chartContainer);
    } else {
      window.addEventListener("resize", onResize);
    }
    return true;
  }

  /* ---------- Desenho ---------- */
  const PAD = { l: 6, r: 12, t: 12, b: 6 };

  function plotX(i) { return PAD.l + i * ((cssW - PAD.l - PAD.r) / (POINTS - 1)); }
  function plotY(v) { return PAD.t + (cssH - PAD.t - PAD.b) * (1 - clamp(v) / 100); }

  // Curva suave (Catmull-Rom → Bézier) com pontos de controle limitados à área do gráfico
  function tracePath(pts) {
    const top = PAD.t, bottom = cssH - PAD.b;
    const cy = y => Math.max(top, Math.min(bottom, y));
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, cy(p1[1] + (p2[1] - p0[1]) / 6),
        p2[0] - (p3[0] - p1[0]) / 6, cy(p2[1] - (p3[1] - p1[1]) / 6),
        p2[0], p2[1]
      );
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cssW, cssH);

    // Linhas de grade
    ctx.save();
    ctx.strokeStyle = "#262938";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    [25, 50, 75].forEach(pct => {
      const y = Math.round(plotY(pct)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(PAD.l, y);
      ctx.lineTo(cssW - PAD.r, y);
      ctx.stroke();
    });
    ctx.restore();

    const pulse = ((performance.now() / 1000) % 1.2) / 1.2;

    SERIES.forEach(s => {
      const pts = state[s.key].map((p, i) => [plotX(i), plotY(p.x)]);

      // Preenchimento em gradiente
      const grad = ctx.createLinearGradient(0, PAD.t, 0, cssH - PAD.b);
      grad.addColorStop(0, `rgba(${s.rgb},0.30)`);
      grad.addColorStop(1, `rgba(${s.rgb},0)`);
      ctx.beginPath();
      tracePath(pts);
      ctx.lineTo(pts[pts.length - 1][0], cssH - PAD.b);
      ctx.lineTo(pts[0][0], cssH - PAD.b);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Linha com brilho suave
      ctx.save();
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.4;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      tracePath(pts);
      ctx.stroke();
      ctx.restore();

      // Ponto luminoso no fim da linha (anel pulsante enquanto recalcula)
      const hx = pts[pts.length - 1][0];
      const hy = pts[pts.length - 1][1];
      ctx.save();
      if (running) {
        ctx.beginPath();
        ctx.arc(hx, hy, 4 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${s.rgb},${0.55 * (1 - pulse)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(hx, hy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "#0A0B10";
      ctx.fill();
      ctx.restore();
    });
  }

  /* ---------- Números, barras e acessibilidade ---------- */
  function renderNumbers() {
    SERIES.forEach(s => {
      const v = Math.round(clamp(state[s.key][POINTS - 1].x));
      valueEls[s.key].textContent = v + "%";
      barEls[s.key].style.width = v + "%";
    });
  }

  function updateAriaLabel() {
    const parts = SERIES.map(s => `${s.label}: ${Math.round(state[s.key][POINTS - 1].target)}%`);
    chartContainer.setAttribute("aria-label", "Gráfico de evolução dos vetores estratégicos. " + parts.join(", "));
  }

  /* ---------- Animação ----------
     Cada ponto é uma mola: aceleração = -k·(x - alvo) - c·v.
     Ao trocar de período no meio da animação, a velocidade é preservada
     (transição sempre contínua). */
  function animateTo(stage) {
    const data = stages[stage];
    if (!data) return;

    SERIES.forEach(s => {
      state[s.key].forEach((p, i) => {
        p.target = data.graph[s.key][i];
        p.delay = s.delay + i * POINT_STAGGER;
      });
    });
    updateAriaLabel();

    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    if (reduceMotion || !ctx) {
      SERIES.forEach(s => state[s.key].forEach(p => { p.x = p.target; p.v = 0; }));
      running = false;
      renderNumbers();
      draw();
      return;
    }

    running = true;
    const start = performance.now();
    let last = start;

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const elapsed = (now - start) / 1000;
      let settled = true;

      SERIES.forEach(s => {
        state[s.key].forEach(p => {
          if (elapsed < p.delay) { settled = false; return; }
          const h = dt / 2; // 2 sub-passos para estabilidade
          for (let n = 0; n < 2; n++) {
            const a = -STIFFNESS * (p.x - p.target) - DAMPING * p.v;
            p.v += a * h;
            p.x += p.v * h;
          }
          if (Math.abs(p.x - p.target) < 0.04 && Math.abs(p.v) < 0.08) {
            p.x = p.target;
            p.v = 0;
          } else {
            settled = false;
          }
        });
      });

      renderNumbers();

      if (settled) {
        running = false;
        rafId = null;
        draw();
      } else {
        draw();
        rafId = requestAnimationFrame(frame);
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  function setStage(stage) {
    if (!stages[stage]) return;
    stageButtons.forEach(btn => {
      const isActive = btn.dataset.stage === stage;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
    animateTo(stage);
  }

  stageButtons.forEach(btn => {
    btn.addEventListener("click", () => setStage(btn.dataset.stage));
  });

  /* ---------- Início ---------- */
  setupCanvas();
  renderNumbers(); // parte de 0%
  draw();
  // Pequena pausa para o painel terminar de aparecer (.reveal) antes da primeira animação
  window.setTimeout(() => setStage("6m"), reduceMotion ? 0 : 450);
})();


/* ==========================================================================
   Formulário de contato — monta a mensagem e abre o WhatsApp (sem backend)
   ========================================================================== */
(function initLeadForm() {
  const form = document.getElementById('leadForm');
  if (!form) return;
  const area = document.getElementById('lfArea');
  const mail = document.getElementById('lfMail');
  const WPP = '5515997963306';

  function buildText() {
    const d = new FormData(form);
    return [
      'Olá, quero um diagnóstico inicial com a DASAIhub.',
      'Nome: ' + (d.get('nome') || '').trim(),
      'Empresa: ' + (d.get('empresa') || '').trim(),
      'E-mail: ' + (d.get('email') || '').trim(),
      'Área de interesse: ' + d.get('area'),
      'Decisão/problema: ' + (d.get('mensagem') || '').trim()
    ].join('\n');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    window.open('https://wa.me/' + WPP + '?text=' + encodeURIComponent(buildText()), '_blank', 'noopener');
  });

  mail.addEventListener('click', () => {
    mail.href = 'mailto:contato@dasaihub.com.br?subject=' +
      encodeURIComponent('Diagnóstico inicial — ' + (form.empresa.value || 'nova empresa')) +
      '&body=' + encodeURIComponent(buildText());
  });

  document.querySelectorAll('[data-interest]').forEach(el => {
    el.addEventListener('click', () => { if (area) area.value = el.dataset.interest; });
  });
})();
