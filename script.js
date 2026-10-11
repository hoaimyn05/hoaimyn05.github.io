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

// Page indicator follows the section in view
const pagerLinks = [...document.querySelectorAll('.pager a')];
if (hasIO && pagerLinks.length) {
  const pageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      pagerLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('.page').forEach((page) => pageObserver.observe(page));
}

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
    note.querySelector('.note-cat').textContent = skill.cat;
    note.querySelector('.note-name').textContent = skill.name;
    note.querySelector('.note-desc').textContent = skill.desc;
    note.querySelector('.note-used').replaceChildren(...skill.used.map((u) => {
      const li = document.createElement('li');
      li.textContent = u;
      return li;
    }));
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
if (keys[0]) keys[0].classList.add('active');

const soundToggle = document.querySelector('.sound-toggle');
soundToggle?.addEventListener('click', () => {
  soundOn = !soundOn;
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  soundToggle.querySelector('b').textContent = soundOn ? 'on' : 'off';
  soundToggle.querySelector('.sound-icon').textContent = soundOn ? '🔊' : '🔈';
  if (soundOn) click();
});

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

// Keyboard glides in when the Skills page arrives and back out when it leaves;
// while visible, a ripple of key presses runs across the board now and then.
const stage = document.querySelector('.keyboard-stage');
if (stage) {
  const board = stage.querySelector('.keyboard');
  let rippleTimer;
  const ripple = () => {
    if (stage.matches(':hover')) return;
    const order = [...keys].sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.left + ra.top) - (rb.left + rb.top);
    });
    order.forEach((key, i) => {
      setTimeout(() => {
        key.classList.add('typing');
        setTimeout(() => key.classList.remove('typing'), 170);
      }, i * 55);
    });
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

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        board.style.setProperty('--rx', `${32 - y * 10}deg`);
        board.style.setProperty('--rz', `${-7 + x * 8}deg`);
      });
      stage.addEventListener('pointerleave', () => {
        board.style.removeProperty('--rx');
        board.style.removeProperty('--rz');
      });
    }
  }
}
