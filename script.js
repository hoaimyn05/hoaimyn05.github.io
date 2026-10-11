document.getElementById('year').textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasIO = 'IntersectionObserver' in window;

// Fade elements up as they enter the viewport, staggered within each group
const items = document.querySelectorAll('.reveal');
if (reducedMotion || !hasIO) {
  items.forEach((item) => item.classList.add('is-visible'));
} else {
  items.forEach((item) => {
    const siblings = [...item.parentElement.children].filter((el) => el.classList.contains('reveal'));
    item.style.transitionDelay = `${Math.min(siblings.indexOf(item), 4) * 70}ms`;
  });
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

// Count numbers up once they are visible
const formatCount = (el, value) => {
  el.textContent = value.toFixed(Number(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
};
const counters = document.querySelectorAll('[data-count]');
if (!reducedMotion && hasIO) {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count);
      const start = performance.now();
      const tick = (now) => {
        const k = Math.min((now - start) / 1200, 1);
        formatCount(el, target * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((el) => countObserver.observe(el));
}

// Audio bars in the featured project tile
document.querySelectorAll('.wave').forEach((wave) => {
  for (let i = 0; i < 28; i++) {
    const bar = document.createElement('i');
    bar.style.setProperty('--h', `${25 + Math.abs(Math.sin(i * 0.7)) * 75}%`);
    bar.style.setProperty('--d', `${-(i % 7) * 0.2}s`);
    wave.append(bar);
  }
});

// Warm spotlight that follows the pointer inside each tile
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.tile').forEach((tile) => {
    tile.addEventListener('pointermove', (e) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
      tile.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

// Frosted header once the page scrolls
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 20);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
