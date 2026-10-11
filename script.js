document.getElementById('year').textContent = new Date().getFullYear();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasIO = 'IntersectionObserver' in window;

// Break headline text into letters that drop in and hop on hover
function splitLetters(root) {
  let n = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const word = document.createElement('span');
          word.style.whiteSpace = 'nowrap';
          [...part].forEach((letter) => {
            const ch = document.createElement('span');
            ch.className = 'ch';
            ch.setAttribute('aria-hidden', 'true');
            ch.textContent = letter;
            ch.style.setProperty('--d', `${n * 22}ms`);
            ch.style.setProperty('--r', `${Math.round(Math.random() * 20 - 10)}deg`);
            ch.style.setProperty('--r0', `${Math.round(Math.random() * 30 - 15)}deg`);
            word.append(ch);
            n++;
          });
          frag.append(word);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('grad-text') && child.tagName !== 'svg' && !child.classList.contains('giant-dot')) {
        walk(child);
      }
    });
  };
  if (!root.getAttribute('aria-label')) root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
  walk(root);
}
document.querySelectorAll('.fx').forEach(splitLetters);
document.querySelectorAll('[data-split]').forEach(splitLetters);

// Reveal blocks, headline letters and counters as they scroll into view
const formatCount = (el, value) => {
  el.textContent = value.toFixed(Number(el.dataset.decimals || 0)) + (el.dataset.suffix || '');
};
const countUp = (el) => {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const tick = (now) => {
    const k = Math.min((now - start) / 1200, 1);
    formatCount(el, target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
// Split body copy into words that slide up out of a mask
function splitWords(root) {
  if (root.dataset.splitDone) return;
  root.dataset.splitDone = '1';
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const inner = document.createElement('span');
          inner.textContent = part;
          w.append(inner);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches('img, svg, input, textarea, .ch, .w') && !child.hasAttribute('data-count')) {
        walk(child);
      }
    });
  };
  walk(root);
}
const WORD_TARGETS = '.index, .lead, .actions .link, .numbers dd, .portrait figcaption, .about-lead, .facts dt, .facts dd, .hint, .work h3, .work-body > p, .work-meta, .paper .venue, .paper h3, .paper p, #research > p .link, .mail, .socials a, .form-title, .field > span';
if (!reducedMotion) document.querySelectorAll(WORD_TARGETS).forEach(splitWords);

// Every page animates its text in when it arrives and back out when it leaves
const pagesForText = [...document.querySelectorAll('.page')];
pagesForText.forEach((page) => {
  let n = 0;
  page.querySelectorAll('.w > span, .ch').forEach((el) => {
    el.style.setProperty('--d', `${Math.min(n++, 40) * 18}ms`);
  });
});
const enterPage = (page) => {
  if (page.classList.contains('shown')) return;
  page.classList.add('shown');
  page.querySelectorAll('.reveal, .fx, .giant').forEach((el) => el.classList.add('is-visible'));
  page.querySelectorAll('[data-count]').forEach(countUp);
};
if (reducedMotion || !hasIO) {
  pagesForText.forEach(enterPage);
} else {
  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) enterPage(entry.target); });
  }, { threshold: 0.2 });
  pagesForText.forEach((page) => textObserver.observe(page));
}

// Scene changes: the page colour follows whichever section fills the middle of the screen
const pages = [...document.querySelectorAll('.page')];
const pagerLinks = [...document.querySelectorAll('.pager a')];
const setScene = (page) => {
  document.body.dataset.scene = page.dataset.scene;
  page.classList.add('in-view');
  pagerLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${page.id}`));
};
if (hasIO) {
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) setScene(entry.target); });
  }, { rootMargin: '-48% 0px -48% 0px' });
  pages.forEach((page) => sceneObserver.observe(page));
}

// Scene wipe on navigation: keycap-coloured bars cover the screen, jump, then uncover
const wipe = document.querySelector('.wipe');
let wiping = false;
document.querySelectorAll('[data-wipe]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target || reducedMotion || wiping) return;
    e.preventDefault();
    wiping = true;
    wipe.classList.remove('leave');
    wipe.classList.add('cover');
    setTimeout(() => {
      window.scrollTo({ top: target.offsetTop, behavior: 'instant' });
      setScene(target);
      history.replaceState(null, '', link.getAttribute('href'));
      wipe.classList.add('leave');
      wipe.classList.remove('cover');
      setTimeout(() => { wiping = false; }, 800);
    }, 780);
  });
});

// Skills keyboard: hovering or focusing a key presses it and shows its note
const SKILLS = {
  python: { cat: 'Language', name: 'Python', desc: 'My main language for everything — data wrangling, model training, evaluation and the APIs that serve the results.', used: ['Every project', 'Research code'] },
  numpy: { cat: 'Python library · Numerics', name: 'NumPy', desc: 'Fast array maths under every pipeline: feature engineering, tensor manipulation and computing metrics.', used: ['Feature engineering', 'Evaluation'] },
  pandas: { cat: 'Python library · Data', name: 'pandas', desc: 'Loading, cleaning, joining and exploring tabular data before it ever reaches a model.', used: ['Historical price data', 'Dataset cleaning'] },
  sql: { cat: 'Language · Data', name: 'SQL', desc: 'Querying and shaping data in relational databases, from quick exploration to the tables behind an app.', used: ['PostgreSQL', 'Backend services'] },
  matplotlib: { cat: 'Python library · Visualisation', name: 'Matplotlib', desc: 'Training curves, confusion matrices and publication-quality figures for papers and reports.', used: ['Paper figures', 'Model diagnostics'] },
  seaborn: { cat: 'Python library · Visualisation', name: 'Seaborn', desc: 'Quick statistical plots to explore distributions, correlations and class balance during EDA.', used: ['Exploratory analysis'] },
  pytorch: { cat: 'Deep learning framework', name: 'PyTorch', desc: 'My go-to for custom deep learning models and research experiments where full control of the training loop matters.', used: ['Computer vision', 'Research experiments'] },
  tensorflow: { cat: 'Deep learning framework', name: 'TensorFlow', desc: 'Building and training deep networks end to end, from data pipelines to saved models.', used: ['Deep learning coursework', 'CNN / LSTM models'] },
  keras: { cat: 'Deep learning API', name: 'Keras', desc: 'High-level API for quickly prototyping and comparing architectures like CNNs and LSTMs.', used: ['Rapid prototyping'] },
  sklearn: { cat: 'Machine learning library', name: 'scikit-learn', desc: 'Classical ML done right: preprocessing, TF–IDF, Logistic Regression, SVM baselines and honest evaluation.', used: ['Comment emotion · 89.5%', 'SVM baseline for speech'] },
  xgboost: { cat: 'Machine learning library', name: 'XGBoost', desc: 'Gradient-boosted trees for strong, fast baselines on tabular and time-series features.', used: ['Stock forecasting · 1.3 Sharpe'] },
  opencv: { cat: 'Computer vision library', name: 'OpenCV', desc: 'Image and video processing: capture, preprocessing and augmentation for vision pipelines.', used: ['Secure Face Login', 'Insect detection'] },
  yolo: { cat: 'Object detection', name: 'YOLO', desc: 'Real-time object detection — trained to find and classify insects for agricultural pest control.', used: ['ICIIT 2026 paper (ACM)'] },
  docker: { cat: 'Deployment', name: 'Docker', desc: 'Packaging models and APIs into containers so they run the same on my laptop and on AWS EC2.', used: ['AWS EC2 deploys', 'Backend AI services'] },
  fastapi: { cat: 'Python library · Serving', name: 'FastAPI', desc: 'Serving models as fast, typed REST APIs with automatic docs.', used: ['Real-time emotion API'] },
  streamlit: { cat: 'Python library · Apps', name: 'Streamlit', desc: 'Turning notebooks into interactive dashboards people can click through.', used: ['Stock forecasting dashboard'] },
  libs: { cat: 'Python ecosystem', name: 'Python libraries', desc: 'The toolbox I reach for daily: NumPy and pandas for data, Matplotlib and Seaborn for plots, scikit-learn and XGBoost for classical ML, PyTorch, TensorFlow and Keras for deep learning, OpenCV and YOLO for vision, FastAPI and Streamlit to ship.', used: ['16 keys on this board'] },
};

const note = document.querySelector('.key-note');
const keys = [...document.querySelectorAll('.key')];
keys.forEach((key) => {
  ['front', 'back', 'left', 'right'].forEach((side) => {
    const el = document.createElement('span');
    el.className = `side s-${side}`;
    el.setAttribute('aria-hidden', 'true');
    key.prepend(el);
  });
});
// On narrow screens the note sits under the board instead of along its edge
const noteHome = note?.parentElement;
const narrow = window.matchMedia('(max-width: 900px)');
const placeNote = () => {
  if (!note) return;
  if (narrow.matches) document.querySelector('.skills-layout').append(note);
  else noteHome.prepend(note);
};
narrow.addEventListener('change', placeNote);
placeNote();
let soundOn = false;
let audio;

function click() {
  if (!soundOn) return;
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  const len = Math.floor(audio.sampleRate * 0.03);
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  const src = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  filter.type = 'bandpass'; filter.frequency.value = 2400 + Math.random() * 800; filter.Q.value = 1.2;
  gain.gain.value = 0.5;
  src.buffer = buf;
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start();
}

function showSkill(key) {
  const skill = SKILLS[key.dataset.skill];
  if (!skill || key.classList.contains('active')) return;
  keys.forEach((k) => k.classList.toggle('active', k === key));
  click();
  note.classList.add('swap');
  setTimeout(() => {
    note.style.setProperty('--note', key.dataset.skill === 'libs' ? '' : getComputedStyle(key).getPropertyValue('--c'));
    note.querySelector('.note-cat').textContent = skill.cat;
    note.querySelector('.note-name').textContent = skill.name;
    note.querySelector('.note-desc').textContent = skill.desc;
    note.querySelector('.note-used b').textContent = skill.used.join(', ');
    note.classList.remove('swap');
  }, reducedMotion ? 0 : 140);
}

keys.forEach((key) => {
  key.addEventListener('pointerenter', () => showSkill(key));
  key.addEventListener('focus', () => showSkill(key));
  key.addEventListener('click', () => {
    key.classList.add('pressed');
    setTimeout(() => key.classList.remove('pressed'), 140);
    showSkill(key);
  });
});

const soundToggle = document.querySelector('.sound-toggle');
soundToggle?.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  soundToggle.querySelector('b').textContent = soundOn ? 'on' : 'off';
  if (soundOn) click();
});

// Keys fly in from scattered points when Skills arrives and fly back out when it leaves
const stage = document.querySelector('.keyboard-stage');
if (stage) {
  const board = stage.querySelector('.keyboard');
  keys.forEach((key) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 380 + Math.random() * 420;
    key.style.setProperty('--fx', `${Math.round(Math.cos(angle) * dist)}px`);
    key.style.setProperty('--fy', `${Math.round(Math.sin(angle) * dist * 0.7 - 120)}px`);
    key.style.setProperty('--fr', `${Math.round(Math.random() * 120 - 60)}deg`);
    key.style.setProperty('--fz', `${Math.round(250 + Math.random() * 450)}px`);
  });
  let rippleTimer;
  const ripple = () => {
    if (stage.matches(':hover')) return;
    const order = [...keys].sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.left + ra.top) - (rb.left + rb.top);
    });
    order.forEach((key, i) => setTimeout(() => {
      key.classList.add('typing');
      setTimeout(() => key.classList.remove('typing'), 170);
    }, i * 55));
  };
  if (reducedMotion || !hasIO) {
    stage.classList.add('in');
  } else {
    new IntersectionObserver(([entry]) => {
      stage.classList.toggle('in', entry.isIntersecting);
      clearInterval(rippleTimer);
      if (entry.isIntersecting) {
        setTimeout(ripple, 1700);
        rippleTimer = setInterval(ripple, 5200);
      }
    }, { threshold: 0.3 }).observe(stage);
    if (finePointer) {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        board.style.setProperty('--rx', `${54 - y * 8}deg`);
        board.style.setProperty('--rz', `${-38 + x * 10}deg`);
      });
      stage.addEventListener('pointerleave', () => {
        board.style.removeProperty('--rx');
        board.style.removeProperty('--rz');
      });
    }
  }
}

// Contact form: send through FormSubmit, fall back to the visitor's mail app
const form = document.querySelector('.mail-form');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (form.elements._honey.value) return;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('.send');
  const label = button.querySelector('.send-label');
  const data = Object.fromEntries(new FormData(form));
  if (!data._subject) data._subject = `Portfolio message from ${data.name}`;
  button.disabled = true;
  label.textContent = 'Sending…';
  status.className = 'form-status';
  status.textContent = '';
  try {
    const res = await fetch('https://formsubmit.co/ajax/hoaimyn05@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || String(json.success) === 'false') throw new Error(json.message || 'Send failed');
    form.reset();
    status.classList.add('ok');
    status.textContent = 'Thanks! Your message is on its way — I will reply soon.';
  } catch {
    status.classList.add('err');
    status.textContent = 'Could not send from here, opening your email app instead…';
    const body = `${data.message}\n\n— ${data.name} (${data.email})`;
    location.href = `mailto:hoaimyn05@gmail.com?subject=${encodeURIComponent(data._subject)}&body=${encodeURIComponent(body)}`;
  } finally {
    button.disabled = false;
    label.textContent = 'Send message';
  }
});

// Text scramble on hover: letters shuffle through glyphs before settling
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=<>/';
document.querySelectorAll('[data-scramble]').forEach((el) => {
  const original = el.textContent;
  let raf;
  const run = () => {
    if (reducedMotion) return;
    cancelAnimationFrame(raf);
    const start = performance.now();
    const step = (now) => {
      const p = (now - start) / 450;
      el.textContent = [...original].map((c, i) => {
        if (c === ' ' || i / original.length < p) return c;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }).join('');
      if (p < 1) raf = requestAnimationFrame(step);
      else el.textContent = original;
    };
    raf = requestAnimationFrame(step);
  };
  (el.closest('a, button') || el).addEventListener('pointerenter', run);
});

// About paragraph: words light up as the paragraph scrolls through the viewport
const lit = document.querySelector('[data-scroll-lit]');
const litWords = [];
if (lit) {
  const text = lit.textContent.trim();
  lit.setAttribute('aria-label', text);
  lit.textContent = '';
  const hot = /^(research|engineering|models|APIs|use\.?)$/i;
  text.split(/\s+/).forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'lw' + (hot.test(word.replace(/[,:]/g, '')) ? ' hot-word' : '');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = word;
    if (i) lit.append(' ');
    lit.append(span);
    litWords.push(span);
  });
}

// Scroll-driven effects: hero parallax, marquee velocity, lit words
const nameParts = document.querySelectorAll('.hero-stage .hn-1, .hero-stage .hn-2');
const cut = document.querySelector('.cutout-wrap');
const bandTrack = document.querySelector('.band-track');
let lastY = scrollY, bandX = 0, velocity = 0;
const loop = () => {
  const y = scrollY;
  velocity = velocity * 0.9 + (y - lastY) * 0.1;
  lastY = y;
  if (!reducedMotion) {
    const k = Math.min(y / innerHeight, 1.2);
    nameParts.forEach((el) => {
      el.style.setProperty('--px', `${(el.classList.contains('hn-1') ? -1 : 1) * k * 18}vw`);
    });
    if (cut) {
      cut.style.setProperty('--cy', `${k * 8}%`);
      cut.style.setProperty('--sx', `${k * 22}vw`);
      cut.style.setProperty('--rz2', `${k * 6}deg`);
    }
    if (bandTrack) {
      bandX -= 0.6 + Math.abs(velocity) * 0.25;
      const half = bandTrack.scrollWidth / 2;
      if (-bandX > half) bandX += half;
      bandTrack.style.setProperty('--bx', `${bandX}px`);
    }
  }
  if (lit) {
    const r = lit.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.4)));
    const on = Math.round(p * litWords.length);
    litWords.forEach((w, i) => {
      w.classList.toggle('on', i < on || reducedMotion);
      w.classList.toggle('hot', w.classList.contains('hot-word') && i < on);
    });
  }
  if (!reducedMotion) sceneTransition();
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

// Magnetic buttons
if (finePointer && !reducedMotion) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}


// Scroll scene transition: each page opens from a rounded window as it arrives,
// then sinks back and dims as the next one scrolls over it
const scenePages = [...document.querySelectorAll('.page')];
function sceneTransition() {
  const vh = innerHeight;
  scenePages.forEach((page) => {
    const r = page.getBoundingClientRect();
    const enter = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.7)));
    const out = Math.max(0, Math.min(1, (vh * 0.6 - r.bottom) / (vh * 0.6)));
    page.classList.add('tx');
    const inv = 1 - enter;
    page.style.setProperty('--in-x', `${inv * 8}%`);
    page.style.setProperty('--in-y', `${inv * 6}%`);
    page.style.setProperty('--in-r', `${inv * 60}px`);
    page.style.setProperty('--out-s', `${1 - out * 0.08}`);
    page.style.setProperty('--out-o', `${1 - out * 0.7}`);
  });
}

// Pointer interaction: background spotlight, portrait follows and tilts, title letters react
if (finePointer && !reducedMotion) {
  const spot = document.querySelector('.spotlight');
  const glow = document.querySelector('.hero-glow');
  let px = innerWidth / 2, py = innerHeight / 2;
  addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY;
    spot.style.setProperty('--sx2', `${px}px`);
    spot.style.setProperty('--sy2', `${py}px`);
    if (scrollY < innerHeight) {
      glow?.style.setProperty('--gx2', `${(px / innerWidth - 0.5) * 260}px`);
      glow?.style.setProperty('--gy2', `${(py / innerHeight - 0.5) * 120}px`);
    }
  }, { passive: true });

  const letters = () => [...document.querySelectorAll('.page.shown .title .ch, .page.shown .giant .ch')];
  let pool = letters();
  setInterval(() => { pool = letters(); }, 1500);
  const near = () => {
    pool.forEach((ch) => {
      const r = ch.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py);
      const k = Math.max(0, 1 - d / 140);
      ch.classList.toggle('near', k > 0.35);
      ch.style.transform = k > 0 ? `translateY(${-k * 0.18}em) scale(${1 + k * 0.25})` : '';
    });
    requestAnimationFrame(near);
  };
  requestAnimationFrame(near);
}

// Projects: hover (or tap) a row to open its details
document.querySelectorAll('.work').forEach((row) => {
  row.addEventListener('click', () => {
    const open = !row.classList.contains('open');
    document.querySelectorAll('.work.open').forEach((r) => r.classList.remove('open'));
    row.classList.toggle('open', open);
  });
});

// About photo tilts toward the pointer
const aboutPhoto = document.querySelector('.about-photo');
if (aboutPhoto && finePointer && !reducedMotion) {
  aboutPhoto.addEventListener('pointermove', (e) => {
    const r = aboutPhoto.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    aboutPhoto.style.setProperty('--tx', `${x * 12}deg`);
    aboutPhoto.style.setProperty('--ty', `${-y * 12}deg`);
    aboutPhoto.style.setProperty('--lx', `${(x + 0.5) * 100}%`);
    aboutPhoto.style.setProperty('--ly', `${(y + 0.5) * 100}%`);
  });
  aboutPhoto.addEventListener('pointerleave', () => {
    aboutPhoto.style.setProperty('--tx', '0deg');
    aboutPhoto.style.setProperty('--ty', '0deg');
  });
}
