// Interactive pixel portrait: pixels assemble on load, scatter away from the
// cursor, spring back home, and the character blinks every few seconds.
(() => {
  const GRID = [
    '........KKKKKKKK........',
    '......KKHHHHHHHHKK......',
    '.....KHHHHHhhHHHHHK.....',
    '....KHHHHhhHHHHHHHHK....',
    '...KHHHhhHHHHHHHHCCHK...',
    '...KHHHHHHHHHHHHHCCHK...',
    '..KHHHHHHHHHHHHHHHHHHK..',
    '..KHHHHHSSHHHHSSSHHHHK..',
    '..KHHHSSSSSHHSSSSSSHHK..',
    '..KHHSSSSSSSSSSSSSSHHK..',
    '..KHHSSEESSSSSSEESSHHK..',
    '..KHHSSEWSSSSSSEWSSHHK..',
    '..KHHSSEESSSSSSEESSHHK..',
    '..KHHSBBSSSSSSSSBBSHHK..',
    '..KHHSSSSSSMMSSSSSSHHK..',
    '..KHHHsSSSSSSSSSSsHHHK..',
    '..KHHHHsssSSSSsssHHHHK..',
    '..KHHHHHKsSSSSsKHHHHHK..',
    '.KHHHHHHKsSSSSsKHHHHHHK.',
    '.KHHHHPPPPsSSsPPPPHHHHK.',
    'KHHHHPPPPPPCCPPPPPPHHHHK',
    'KHHHPPPPPPPPPPPPPPPPHHHK',
    'KHHPPPpPPPPPPPPPPpPPPHHK',
    'KHPPPPpPPPPPPPPPPpPPPPHK',
    'KPPPPPpPPPPPPPPPPpPPPPPK',
    'KPPPPPpPPPPPPPPPPpPPPPPK',
  ];
  const PALETTE = {
    K: '#150f22', H: '#2b1d40', h: '#5b3f86', S: '#f7cdb0', s: '#e2a987',
    E: '#1b1428', W: '#ffffff', B: '#f59ab0', M: '#c2506a',
    P: '#7c3aed', p: '#a78bfa', C: '#22d3ee',
  };
  const SPARKLES = [[-2, 3, '#22d3ee'], [26, 6, '#a78bfa'], [-2, 17, '#a78bfa'], [27, 19, '#22d3ee'], [25, -1, '#f59ab0']];

  window.PIXEL_AVATAR = { GRID, PALETTE };

  const canvas = document.getElementById('pixel-avatar');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rows = GRID.length;
  const cols = GRID[0].length;
  const pad = 3; // grid cells of breathing room for sparkles and scatter
  let size = 10, ox = 0, oy = 0, dpr = 1;
  let pixels = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let blinkUntil = 0, nextBlink = performance.now() + 2500;
  let running = false, visible = true, t0 = performance.now();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = GRID[r][c];
      if (ch === '.') continue;
      pixels.push({ r, c, ch, x: 0, y: 0, vx: 0, vy: 0, hx: 0, hy: 0 });
    }
  }

  function layout(scatter) {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    size = Math.floor(Math.min(rect.width / (cols + pad * 2), rect.height / (rows + pad)));
    ox = Math.round((rect.width - cols * size) / 2);
    oy = Math.round(rect.height - rows * size);
    for (const p of pixels) {
      p.hx = ox + p.c * size;
      p.hy = oy + p.r * size;
      if (scatter) {
        const a = Math.random() * Math.PI * 2;
        const d = rect.width * (0.6 + Math.random() * 0.6);
        p.x = p.hx + Math.cos(a) * d;
        p.y = p.hy + Math.sin(a) * d;
      } else {
        p.x = p.hx; p.y = p.hy;
      }
    }
  }

  function colorFor(p, now) {
    if (now < blinkUntil && (p.ch === 'E' || p.ch === 'W') && p.r !== 12) return PALETTE.S;
    if (now < blinkUntil && p.ch === 'W') return PALETTE.E;
    return PALETTE[p.ch];
  }

  function draw(now) {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    const gap = Math.max(1, Math.round(size * 0.08));

    const t = (now - t0) / 1000;
    for (const [c, r, col] of SPARKLES) {
      const tw = (Math.sin(t * 2 + c) + 1) / 2;
      ctx.globalAlpha = 0.25 + tw * 0.75;
      ctx.fillStyle = col;
      const x = ox + c * size, y = oy + r * size, s = size * 0.6;
      ctx.fillRect(x, y - s, s, s * 3);
      ctx.fillRect(x - s, y, s * 3, s);
    }
    ctx.globalAlpha = 1;

    for (const p of pixels) {
      ctx.fillStyle = colorFor(p, now);
      ctx.fillRect(p.x, p.y, size - gap, size - gap);
    }
  }

  function step(now) {
    if (now > nextBlink) {
      blinkUntil = now + 160;
      nextBlink = now + 2600 + Math.random() * 2600;
    }
    const radius = size * 5;
    let moving = false;
    for (const p of pixels) {
      let ax = (p.hx - p.x) * 0.07;
      let ay = (p.hy - p.y) * 0.07;
      if (mouse.active) {
        const dx = p.x + size / 2 - mouse.x;
        const dy = p.y + size / 2 - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < radius && d > 0.01) {
          const f = (1 - d / radius) * size * 0.9;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }
      p.vx = (p.vx + ax) * 0.78;
      p.vy = (p.vy + ay) * 0.78;
      p.x += p.vx;
      p.y += p.vy;
      if (Math.abs(p.vx) + Math.abs(p.vy) > 0.05) moving = true;
    }
    draw(now);
    return moving;
  }

  function loop(now) {
    if (!visible) { running = false; return; }
    step(now);
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
  });
  canvas.addEventListener('pointerleave', () => { mouse.active = false; });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { layout(false); draw(performance.now()); }, 120);
  });

  layout(!reduced);
  draw(performance.now());
  start();
})();
