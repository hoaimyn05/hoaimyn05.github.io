document.getElementById('year').textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasIO = 'IntersectionObserver' in window;

// Scroll reveal
const items = document.querySelectorAll('.reveal');
if (reducedMotion || !hasIO) {
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

// Page colour shifts as each themed section reaches the middle of the screen
if (hasIO) {
  const themeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) document.body.dataset.theme = entry.target.dataset.theme;
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  document.querySelectorAll('[data-theme]').forEach((section) => themeObserver.observe(section));
}

// Animated counters
const formatCount = (el, value) => {
  el.textContent = value.toFixed(Number(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
};
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
const counters = document.querySelectorAll('[data-count]');
if (hasIO) {
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

// Split the statement into words that light up while scrolling
const statement = document.querySelector('[data-words]');
const words = [];
if (statement) {
  const text = statement.textContent.trim();
  statement.setAttribute('aria-label', text);
  statement.textContent = '';
  text.split(/\s+/).forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    statement.append(span);
    if (i) span.before(' ');
    words.push(span);
  });
}

// Scroll-driven effects: progress bar, hero parallax, lit words
const progress = document.querySelector('.progress span');
const nameSpans = document.querySelectorAll('.hero-name [data-speed], .hero-outline [data-speed]');
let scrollQueued = false;
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  if (!reducedMotion) {
    if (scrollY < innerHeight * 1.2) {
      nameSpans.forEach((span) => {
        span.style.setProperty('--sy', `${scrollY * Number(span.dataset.speed)}px`);
      });
    }
    if (words.length) {
      const r = statement.getBoundingClientRect();
      const k = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
      const lit = Math.round(Math.max(0, Math.min(1, k)) * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }
  }
  scrollQueued = false;
};
addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

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

  // Light source that follows the pointer across the menu
  const nav = document.querySelector('.nav');
  nav.addEventListener('pointermove', (e) => {
    nav.style.setProperty('--lx', `${e.clientX - nav.getBoundingClientRect().left}px`);
  });

  // Hero depth: name and portrait drift in opposite directions, light on the photo
  const hero = document.querySelector('.hero');
  const portrait = document.querySelector('.portrait');
  const portraitInner = portrait.querySelector('.portrait-inner');
  hero.addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    nameSpans.forEach((span) => {
      span.style.setProperty('--mx', `${x * -40}px`);
      span.style.setProperty('--my', `${y * -20}px`);
    });
    portraitInner.style.setProperty('--px', `${x * 24}px`);
    portraitInner.style.setProperty('--py', `${y * 12}px`);
    const r = portrait.getBoundingClientRect();
    portrait.style.setProperty('--lx', `${e.clientX - r.left}px`);
    portrait.style.setProperty('--ly', `${e.clientY - r.top}px`);
  });

  // Project hover preview that trails the cursor
  const preview = document.querySelector('.preview');
  const previewMetric = preview.querySelector('b');
  const previewCaption = preview.querySelector('span');
  let tx = 0, ty = 0, px = 0, py = 0, previewOn = false;
  document.querySelectorAll('.project').forEach((row) => {
    row.addEventListener('pointerenter', () => {
      previewMetric.textContent = row.dataset.metric;
      previewCaption.textContent = row.dataset.caption;
      preview.style.setProperty('--hue', row.dataset.hue);
      preview.classList.add('show');
      if (!previewOn) { px = innerWidth - 330; py = my; }
      previewOn = true;
    });
    row.addEventListener('pointerleave', () => {
      preview.classList.remove('show');
      previewOn = false;
    });
  });
  const trail = () => {
    tx = innerWidth - 330 + (mx - innerWidth / 2) * 0.06; ty = my;
    px += (tx - px) * 0.14;
    py += (ty - py) * 0.14;
    if (previewOn) preview.style.transform = `translate(${px}px, ${py}px)`;
    requestAnimationFrame(trail);
  };
  trail();
}
