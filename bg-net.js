// Background node network: slow-drifting points linked by faint lines,
// gently pulled toward the pointer and shifted by scroll for depth.
(() => {
  const canvas = document.getElementById('bg-net');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, dpr = 1, nodes = [];
  const mouse = { x: -9999, y: -9999 };
  const LINK = 140;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1 + Math.random() * 1.6,
      z: 0.4 + Math.random() * 0.6,
      hot: Math.random() < 0.12,
    }));
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    const shift = (scrollY * 0.15) % h;
    for (const n of nodes) {
      if (!reduced) {
        n.x += n.vx; n.y += n.vy;
        const dx = mouse.x - n.x, dy = mouse.y - (n.y - shift * n.z);
        const d = Math.hypot(dx, dy);
        if (d < 180) { n.x += dx * 0.0025; n.y += dy * 0.0025; }
        if (n.x < -20) n.x = w + 20; if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; if (n.y > h + 20) n.y = -20;
      }
      n.sy = (((n.y - shift * n.z) % h) + h) % h;
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.sy - b.sy);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(255,170,110,${(1 - d / LINK) * 0.16})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.sy); ctx.lineTo(b.x, b.sy); ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mouse.x, a.sy - mouse.y);
      if (md < 180) {
        ctx.strokeStyle = `rgba(255,122,31,${(1 - md / 180) * 0.35})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.sy); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    for (const n of nodes) {
      const pulse = n.hot ? 0.6 + 0.4 * Math.sin(t / 600 + n.x) : 1;
      ctx.fillStyle = n.hot ? `rgba(255,140,60,${0.8 * pulse})` : `rgba(244,241,236,${0.35 * n.z})`;
      ctx.beginPath(); ctx.arc(n.x, n.sy, n.r * (n.hot ? 1.5 : 1), 0, Math.PI * 2); ctx.fill();
    }
    if (!reduced) requestAnimationFrame(frame);
  }

  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
