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
const WORD_TARGETS = '.index, .lead, .actions .link, .numbers dd, .portrait figcaption, .about-lead, .facts dt, .facts dd, .hint, .work h3, .work p, .paper .venue, .paper h3, .paper p, #research > p .link, .mail, .socials a, .form-title, .field > span';
if (!reducedMotion) document.querySelectorAll(WORD_TARGETS).forEach(splitWords);

// Every page animates its text in when it arrives and back out when it leaves
const pagesForText = [...document.querySelectorAll('.page')];
pagesForText.forEach((page) => {
  let n = 0;
  page.querySelectorAll('.w, .ch').forEach((el) => {
    el.style.setProperty('--d', `${Math.min(n++, 60) * 14}ms`);
  });
});
const enterPage = (page) => {
  if (page.classList.contains('shown')) return;
  page.classList.add('shown');
  page.querySelectorAll('.reveal, .fx, .giant').forEach((el) => el.classList.add('is-visible'));
  page.querySelectorAll('[data-count]').forEach(countUp);
};
const leavePage = (page) => {
  page.classList.remove('shown');
  page.querySelectorAll('.reveal, .fx, .giant').forEach((el) => el.classList.remove('is-visible'));
};
if (reducedMotion || !hasIO) {
  pagesForText.forEach(enterPage);
} else {
  const textObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? enterPage(entry.target) : leavePage(entry.target)));
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
