// Ember cursor: a glowing core that sheds flame and drifting smoke as it moves,
// flares over links, bursts into sparks on click, and seeds rising embers in the hero.
(() => {
  const canvas = document.getElementById('fire');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) document.documentElement.classList.add('fire-cursor');

  const MAX = 520;
  const particles = [];
  let w = 0, h = 0, dpr = 1;
  let mouse = { x: -100, y: -100, px: -100, py: -100, active: false, last: 0 };
  let hot = false, frame = 0, running = false;
  const hero = document.querySelector('.home');
  let heroVisible = true;

  function sprite(size, stops) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([o, col]) => grad.addColorStop(o, col));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const FIRE = sprite(64, [[0, 'rgba(255,245,215,1)'], [0.22, 'rgba(255,190,90,.9)'], [0.5, 'rgba(255,100,25,.35)'], [1, 'rgba(255,60,10,0)']]);
  const RED = sprite(64, [[0, 'rgba(255,130,40,.8)'], [0.45, 'rgba(220,60,20,.3)'], [1, 'rgba(160,30,10,0)']]);
  const SMOKE = sprite(64, [[0, 'rgba(170,160,152,.6)'], [0.5, 'rgba(120,110,105,.26)'], [1, 'rgba(80,75,75,0)']]);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const rand = (a, b) => a + Math.random() * (b - a);

  function spawn(type, x, y, vx, vy) {
    if (particles.length >= MAX) particles.shift();
    const p = { type, x, y, vx, vy, t: 0, seed: Math.random() * 100 };
    if (type === 'fire') { p.life = rand(28, 55); p.size = rand(10, 22); }
    else if (type === 'smoke') { p.life = rand(80, 140); p.size = rand(14, 24); }
    else if (type === 'spark') { p.life = rand(25, 50); p.size = rand(1.2, 2.6); }
    else { p.life = rand(160, 260); p.size = rand(1, 2.2); } // ember
    particles.push(p);
  }

  function emitTrail() {
    const dx = mouse.x - mouse.px, dy = mouse.y - mouse.py;
    const speed = Math.hypot(dx, dy);
    const steps = Math.min(8, Math.ceil(speed / 10));
    for (let s = 0; s < steps; s++) {
      const k = steps ? s / steps : 0;
      const x = mouse.px + dx * k, y = mouse.py + dy * k;
      spawn('fire', x + rand(-3, 3), y + rand(-3, 3), -dx * 0.03 + rand(-0.6, 0.6), -dy * 0.03 + rand(-1, 0.2));
      if (Math.random() < 0.6) spawn('smoke', x, y, -dx * 0.02 + rand(-0.4, 0.4), rand(-0.9, -0.3));
    }
    mouse.px = mouse.x; mouse.py = mouse.y;
  }

  function emitIdle() {
    if (!mouse.active) return;
    const n = hot ? 3 : 1;
    for (let i = 0; i < n; i++) spawn('fire', mouse.x + rand(-4, 4), mouse.y + rand(-2, 4), rand(-0.4, 0.4), rand(-1.6, -0.6));
    if (frame % (hot ? 2 : 4) === 0) spawn('smoke', mouse.x + rand(-3, 3), mouse.y - 6, rand(-0.3, 0.3), rand(-1.1, -0.5));
    if (hot && frame % 5 === 0) spawn('spark', mouse.x, mouse.y, rand(-1.5, 1.5), rand(-3, -1));
  }

  function emitAmbient() {
    if (!hero || !heroVisible || frame % 24) return;
    const r = hero.getBoundingClientRect();
    spawn('ember', rand(r.left, r.right), Math.min(r.bottom, h) - rand(0, 40), rand(-0.3, 0.3), rand(-1.4, -0.6));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const time = frame * 0.03;

    // smoke first so flame glows on top of it
    ctx.globalCompositeOperation = 'source-over';
    for (const p of particles) {
      if (p.type !== 'smoke') continue;
      const k = p.t / p.life;
      const s = p.size * (1 + k * 3.2);
      ctx.globalAlpha = 0.75 * Math.sin(Math.PI * Math.min(1, k * 1.4)) * (1 - k);
      ctx.drawImage(SMOKE, p.x - s / 2, p.y - s / 2, s, s);
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      const k = p.t / p.life;
      if (p.type === 'fire') {
        const s = p.size * (1 - k * 0.55);
        ctx.globalAlpha = Math.pow(1 - k, 1.4);
        ctx.drawImage(k < 0.45 ? FIRE : RED, p.x - s / 2, p.y - s / 2, s, s);
      } else if (p.type === 'spark' || p.type === 'ember') {
        const flick = 0.6 + 0.4 * Math.sin(time * 8 + p.seed);
        ctx.globalAlpha = (1 - k) * flick;
        ctx.fillStyle = k < 0.5 ? '#ffd9a0' : '#ff7a1f';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (p.type === 'ember') {
          ctx.globalAlpha *= 0.35;
          ctx.drawImage(RED, p.x - 6, p.y - 6, 12, 12);
        }
      }
    }

    // glowing core under the pointer
    if (mouse.active && finePointer) {
      const flick = 1 + Math.sin(time * 9) * 0.08 + Math.sin(time * 23) * 0.05;
      const core = (hot ? 46 : 30) * flick;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(FIRE, mouse.x - core / 2, mouse.y - core / 2, core, core);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff4dc';
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, hot ? 3.2 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function update() {
    const time = frame * 0.03;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t++;
      if (p.t >= p.life) { particles.splice(i, 1); continue; }
      // buoyancy + gentle curl so smoke and flame lick upwards
      const curl = Math.sin(p.y * 0.018 + time + p.seed) * (p.type === 'smoke' ? 0.06 : 0.04);
      p.vx = p.vx * 0.96 + curl;
      p.vy = p.vy * 0.97 - (p.type === 'smoke' ? 0.025 : p.type === 'fire' ? 0.06 : 0.015);
      if (p.type === 'spark') p.vy += 0.05;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  function loop() {
    frame++;
    if (mouse.active && (mouse.x !== mouse.px || mouse.y !== mouse.py)) emitTrail();
    else emitIdle();
    emitAmbient();
    update();
    draw();
    if (document.hidden) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  addEventListener('pointermove', (e) => {
    if (!mouse.active) { mouse.px = e.clientX; mouse.py = e.clientY; }
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    start();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.active = false; });
  addEventListener('blur', () => { mouse.active = false; });
  addEventListener('pointerdown', (e) => {
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2), v = rand(1.5, 5);
      spawn('spark', e.clientX, e.clientY, Math.cos(a) * v, Math.sin(a) * v - 1);
    }
    for (let i = 0; i < 6; i++) spawn('smoke', e.clientX, e.clientY, rand(-1, 1), rand(-1.5, -0.5));
  });
  document.addEventListener('pointerover', (e) => {
    hot = Boolean(e.target.closest('a, button, [data-cursor], .tilt'));
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(hero);
  }
  addEventListener('resize', resize);
  resize();
  start();
})();
