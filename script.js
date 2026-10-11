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

// Scroll progress
const progress = document.querySelector('.progress span');
let scrollQueued = false;
addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    scrollQueued = false;
  });
}, { passive: true });

// Terminal that types, holds, deletes and cycles phrases
const typed = document.querySelector('.typed');
if (typed) {
  const phrases = typed.dataset.phrases.split('|');
  if (reducedMotion) {
    typed.textContent = phrases[0];
  } else {
    let p = 0, i = 0, deleting = false;
    const tick = () => {
      const word = phrases[p];
      i += deleting ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let delay = deleting ? 35 : 75;
      if (!deleting && i === word.length) { deleting = true; delay = 1800; }
      else if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 400; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 900);
  }
}

// Copy email
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const label = btn.querySelector('span');
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      label.textContent = 'Copied ✓';
    } catch {
      label.textContent = btn.dataset.copy;
    }
    setTimeout(() => { label.textContent = 'Copy email'; }, 1800);
  });
});

if (finePointer && !reducedMotion) {
  // Magnetic buttons
  document.querySelectorAll('.magnetic, .magnetic-soft').forEach((el) => {
    const pull = el.classList.contains('magnetic-soft') ? 0.08 : 0.3;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * pull}px, ${y * pull * 1.2}px)`;
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // 3D tilt + spotlight cards
  document.querySelectorAll('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.transform = `perspective(1400px) rotateX(${(0.5 - py) * 4}deg) rotateY(${(px - 0.5) * 5}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  // Hero depth: portrait drifts against the name, warm light follows the pointer
  const hero = document.querySelector('.hero');
  const visual = hero.querySelector('.hero-visual');
  const title = hero.querySelector('h1');
  const portrait = hero.querySelector('.portrait');
  hero.addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    visual.style.transform = `translate(${x * 18}px, ${y * 12}px)`;
    title.style.transform = `translate(${x * -14}px, ${y * -8}px)`;
    const r = portrait.getBoundingClientRect();
    portrait.style.setProperty('--lx', `${e.clientX - r.left}px`);
    portrait.style.setProperty('--ly', `${e.clientY - r.top}px`);
  });
  hero.addEventListener('pointerleave', () => {
    visual.style.transform = '';
    title.style.transform = '';
  });
}
