document.getElementById('year').textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Scroll reveal
const items = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  items.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}

// Animated counters
const formatCount = (el, value) => {
  const decimals = Number(el.dataset.decimals || 0);
  el.textContent = value.toFixed(decimals) + (el.dataset.suffix || '');
};
const counters = document.querySelectorAll('[data-count]');
const runCounter = (el) => {
  const target = Number(el.dataset.count);
  if (reducedMotion) return formatCount(el, target);
  const start = performance.now();
  const tick = (now) => {
    const k = Math.min((now - start) / 1400, 1);
    formatCount(el, target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if ('IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => countObserver.observe(el));
} else {
  counters.forEach(runCounter);
}

// Scroll progress + hero parallax
const progress = document.querySelector('.progress span');
const nameLines = document.querySelectorAll('.hero-name-line');
let scrollQueued = false;
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  if (!reducedMotion) {
    nameLines.forEach((line) => {
      const depth = Number(line.dataset.depth);
      line.style.setProperty('--scroll-x', `${scrollY * depth * 0.02}%`);
    });
  }
  scrollQueued = false;
};
addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

if (finePointer && !reducedMotion) {
  document.documentElement.classList.add('has-cursor');

  // Custom cursor with a lagging ring
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  const label = ring.querySelector('em');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    document.body.classList.add('cursor-ready');
  });
  document.addEventListener('pointerleave', () => document.body.classList.remove('cursor-ready'));
  const follow = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  };
  follow();

  document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
    el.addEventListener('pointerenter', () => {
      document.body.classList.add('cursor-hover');
      label.textContent = el.dataset.cursor || '';
      document.body.classList.toggle('cursor-label', Boolean(el.dataset.cursor));
    });
    el.addEventListener('pointerleave', () => {
      document.body.classList.remove('cursor-hover', 'cursor-label');
    });
  });

  // Magnetic buttons
  document.querySelectorAll('.magnetic').forEach((el) => {
    const inner = el.querySelector('span');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`;
      if (inner) inner.style.transform = `translate(${x * 0.12}px, ${y * 0.16}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
      if (inner) inner.style.transform = '';
    });
  });

  // 3D tilt + spotlight cards
  document.querySelectorAll('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateY(-4px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // Hero name follows the mouse a little
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', (e) => {
    const x = (e.clientX / innerWidth - 0.5);
    const y = (e.clientY / innerHeight - 0.5);
    nameLines.forEach((line) => {
      const depth = Number(line.dataset.depth);
      line.style.setProperty('--mouse-x', `${x * depth}px`);
      line.style.setProperty('--mouse-y', `${y * depth}px`);
    });
  });
}
