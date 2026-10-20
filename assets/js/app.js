/* Radix Endodontic Studio · app.js
   Edit content here: FILM (frame count / dir), STEPS colours, TOUR_STOPS, TIME_SLOTS. */
(() => {
'use strict';

/* ---------------- config ---------------- */
const FILM = { dir: 'assets/seq/film', count: 0 /* set from canvas data-count */, intro: 157 /* opening frames: patient opens mouth, camera dives to the tooth */ };
const STAGE_CANAL = ['#C22A3E', '#C22A3E', '#4FAFC2', '#E9705C', '#E9705C'];
const TOUR_STOPS = [
  { t: '09:00', title: 'Arrive', img: 'reception', text: 'Check in at reception. We go through your medical history and any medicines you take.',
    hs: [ { x: .62, y: .62, h: 'Check-in', p: 'Under five minutes. Bring any old X-rays if you have them.' },
          { x: .13, y: .70, h: 'Lounge', p: 'Most people wait under 10 minutes. Water and tea are on the side table.' } ] },
  { t: '09:10', title: '3D scan', img: 'scan', text: 'A low-dose CBCT scan maps every canal, including the small hidden ones a flat X-ray misses.',
    hs: [ { x: .52, y: .42, h: 'CBCT scanner', p: 'You stand still for about 15 seconds. The arm circles your head once.' },
          { x: .86, y: .72, h: 'Your scan', p: 'Ready in two minutes, in full 3D.' } ] },
  { t: '09:25', title: 'Consultation', img: 'consult', text: 'Dr. Carter shows you the scan, explains the plan and gives a written estimate before anything starts.',
    hs: [ { x: .48, y: .36, h: 'Your tooth in 3D', p: 'You’ll see the infection and the canals we will treat.' },
          { x: .33, y: .74, h: 'Ask anything', p: 'Nothing starts until you’re comfortable and have agreed the price.' } ] },
  { t: '09:40', title: 'Treatment', img: 'suite', text: 'The procedure you just watched, done under an operating microscope. Headphones and a ceiling screen help the time pass.',
    hs: [ { x: .82, y: .26, h: 'Operating microscope', p: '20× magnification, so canals are cleaned precisely and healthy tooth is kept.' },
          { x: .76, y: .60, h: 'The chair', p: 'Memory foam, a neck pillow and a blanket if you like.' } ] },
  { t: '11:00', title: 'Rest', img: 'recovery', text: 'Sit back for 15 minutes with an ice pack while we print your aftercare card and book the crown.',
    hs: [ { x: .44, y: .70, h: 'Recovery lounge', p: 'Quiet, warm, no rush. Stay as long as you need.' },
          { x: .84, y: .42, h: 'Garden view', p: 'Most people are back at work or home before lunch.' } ] }
];
const TIME_SLOTS = ['10:00', '11:30', '13:00', '15:30', '17:00', '18:30'];

/* ---------------- helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMob = () => matchMedia('(max-width: 820px)').matches;
const conn = navigator.connection || {};
const saveData = !!conn.saveData || /2g/.test(conn.effectiveType || '');

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800);
}

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (window.Lenis && !reduce) {
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, touchMultiplier: 1.4 });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); const el = id === '#top' ? document.body : $(id);
  if (!el) return; e.preventDefault();
  lenis ? lenis.scrollTo(el, { offset: id === '#top' ? 0 : -70, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' });
}));

/* ---------------- the surgery film (image sequence on canvas) ---------------- */
class Film {
  constructor(sec) {
    this.sec = sec; this.cv = $('canvas', sec); this.ctx = this.cv.getContext('2d');
    this.n = +this.cv.dataset.count || FILM.count; this.mob = isMob();
    this.step = saveData ? 2 : 1;
    this.imgs = new Array(this.n); this.ok = new Uint8Array(this.n);
    this.cur = 0; this.tgt = 0; this.lastKey = ''; this.bg = ['#e4eaed', '#d2dbe0'];
    this.blend = !saveData; this.slow = 0; this.frames = 0;
    this.resize(); addEventListener('resize', () => { this.resize(); this.lastKey = ''; });
  }
  src(i) { return `${FILM.dir}/${this.mob ? 'm' : 'd'}/f_${String(i + 1).padStart(4, '0')}.webp`; }
  load(i) {
    if (this.imgs[i]) return this.imgs[i].p;
    const im = new Image(); im.decoding = 'async';
    const p = new Promise(res => {
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { this.ok[i] = 1; if (i === FILM.intro) this.sampleBg(im); this.lastKey = ''; res(); }); };
      im.onerror = () => res();
    });
    im.src = this.src(i); this.imgs[i] = { im, p }; return p;
  }
  /* coarse-to-fine: every 16th frame first, then 8th, 4th, 2nd, all */
  async preload(onFirst) {
    const order = [], seen = new Set();
    for (const s of [16, 8, 4, 2, 1]) {
      if (s < this.step) break;
      for (let i = 0; i < this.n; i += s) if (!seen.has(i)) { seen.add(i); order.push(i); }
      if (!seen.has(this.n - 1)) { seen.add(this.n - 1); order.push(this.n - 1); }
      if (s === 16) order.push('first');
    }
    let k = 0; const firstCount = order.indexOf('first'); let done = 0;
    const work = async () => {
      while (k < order.length) {
        const i = order[k++]; if (i === 'first') continue;
        await this.load(i); done++;
        if (onFirst && done <= firstCount) onFirst(done / firstCount);
      }
    };
    await Promise.all(Array.from({ length: 6 }, work));
  }
  sampleBg(im) {
    try {
      const c = document.createElement('canvas'); c.width = 4; c.height = 16;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0, 4, 16);
      const d = x.getImageData(0, 0, 4, 16).data;
      const row = r => { let a = [0, 0, 0]; for (let j = 0; j < 4; j++) { const o = (r * 4 + j) * 4; a[0] += d[o]; a[1] += d[o + 1]; a[2] += d[o + 2]; } return `rgb(${a.map(v => Math.round(v / 4)).join(',')})`; };
      this.bg = [row(0), row(15)];
      this.sec.style.background = this.bg[0];
    } catch (e) {}
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, this.lowres ? 1.25 : 2);
    const w = this.cv.clientWidth, h = this.cv.clientHeight;
    const maxW = this.mob ? 1100 : 2400;
    const s = Math.min(dpr, maxW / w);
    this.cv.width = Math.round(w * s); this.cv.height = Math.round(h * s);
    this.W = this.cv.width; this.H = this.cv.height;
  }
  nearest(i) {
    i = clamp(Math.round(i), 0, this.n - 1);
    if (this.ok[i]) return i;
    for (let d = 1; d < this.n; d++) { if (this.ok[i - d]) return i - d; if (this.ok[i + d]) return i + d; }
    return -1;
  }
  rect(im, f = FILM.intro) {
    const { W, H } = this; const iw = im.naturalWidth, ih = im.naturalHeight;
    const k = smooth(FILM.intro - 30, FILM.intro, f); // opening shot is full-bleed, then eases to the treatment framing
    if (this.mob) { // square frame fitted to width, centred at 40% of the height
      const s = W / iw, dw = W, dh = ih * s; return [0, H * 0.40 - dh / 2, dw, dh];
    }
    const z = lerp(1, W / H < 1.25 ? 1 : DESK_ZOOM, k); // smaller tooth on wide screens, leave room for copy
    const s = Math.max(W / iw, H / ih) * z; const dw = iw * s, dh = ih * s;
    return [(W - dw) / 2 + (z < 1 ? W * DESK_SHIFT * k : 0), (H - dh) / 2 + H * 0.015 * k, dw, dh];
  }
  buildMask(r) { // alpha mask that feathers any frame edge that sits inside the canvas
    const m = document.createElement('canvas'); m.width = this.W; m.height = this.H;
    const c = m.getContext('2d'); c.fillStyle = '#000'; c.fillRect(r[0], r[1], r[2], r[3]);
    c.globalCompositeOperation = 'destination-out';
    const fy = r[3] * (this.mob ? 0.14 : 0.1), fx = r[2] * 0.09;
    const strip = (x0, y0, x1, y1, rx, ry, rw, rh) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(rx, ry, rw, rh); };
    if (r[1] > 0.5) strip(0, r[1], 0, r[1] + fy, r[0], r[1], r[2], fy);
    if (r[1] + r[3] < this.H - 0.5) strip(0, r[1] + r[3], 0, r[1] + r[3] - fy, r[0], r[1] + r[3] - fy, r[2], fy);
    if (!this.mob && r[0] > 0.5) strip(r[0], 0, r[0] + fx, 0, r[0], r[1], fx, r[3]);
    if (!this.mob && r[0] + r[2] < this.W - 0.5) strip(r[0] + r[2], 0, r[0] + r[2] - fx, 0, r[0] + r[2] - fx, r[1], fx, r[3]);
    this.mask = m; this.maskKey = `${this.W}x${this.H}|${r.map(Math.round).join(',')}`;
  }
  draw(f) {
    const a = Math.floor(f), t = f - a;
    const ia = this.nearest(a), ib = this.nearest(a + 1);
    if (ia < 0) return;
    const bl = this.blend && f >= FILM.intro - 1; // no cross-fade during the fast opening zoom: snap to crisp frames
    const key = bl && ib !== ia ? `${ia}|${ib}|${t.toFixed(2)}` : `${ia}`;
    if (key === this.lastKey) return; this.lastKey = key;
    const c = this.ctx, { W, H } = this;
    const A = this.imgs[ia].im, r = this.rect(A, f);
    const mk = `${W}x${H}|${r.map(Math.round).join(',')}`;
    if (this.maskKey !== mk) this.buildMask(r);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, W, H);
    c.drawImage(A, r[0], r[1], r[2], r[3]);
    if (bl && ib !== ia && ib >= 0 && t > 0.03) { c.globalAlpha = t; c.drawImage(this.imgs[ib].im, r[0], r[1], r[2], r[3]); c.globalAlpha = 1; }
    c.globalCompositeOperation = 'destination-in'; c.drawImage(this.mask, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, this.bg[0]); g.addColorStop(1, this.bg[1]);
    c.globalCompositeOperation = 'destination-over'; c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }
}

const filmSec = $('#film');
const film = new Film(filmSec);
const ui = {
  intro: $('#filmIntro'), steps: $$('.step'), meter: $('#meter'), pain: $('#mPain'), time: $('#mTime'),
  bar: $('#mBar'), done: $('#filmDone'), tooth: $('.meter-tooth')
};
let lastStep = -1, lastPain = -1, lastTime = -1;

/* scroll progress p (0..1 through the pinned film) → frame f (0..1) with holds at both ends */
const DESK_ZOOM = 0.84, DESK_SHIFT = 0.06;
const P_HOLD_A = 0.03, P_HOLD_B = 0.92;
function filmProgress() {
  const r = filmSec.getBoundingClientRect();
  return clamp(-r.top / (filmSec.offsetHeight - innerHeight));
}
function updateFilmUI(p, f, intro) { // f: 0..1 through the treatment; intro: still in the opening shot
  ui.intro.classList.toggle('gone', p > 0.035);
  ui.meter.classList.toggle('off', intro);
  hdr.classList.toggle('on-photo', intro);
  let step = -1;
  if (p > 0.035 && !intro) step = f <= 0.001 ? 0 : Math.min(4, 1 + Math.floor(f * 4 - 1e-6));
  if (p > P_HOLD_B + 0.015) step = 5;
  if (step !== lastStep) {
    ui.steps.forEach((el, i) => { el.classList.toggle('on', i === step); el.classList.toggle('past', i < step); });
    ui.done.classList.toggle('on', step === 5);
    ui.meter.classList.toggle('dim', step === -1);
    lastStep = step;
  }
  const pain = f < 0.03 ? 8 : Math.round(8 * (1 - smooth(0.02, 0.32, f)));
  const time = Math.round(75 * f);
  if (pain !== lastPain) { ui.pain.textContent = pain; lastPain = pain; }
  if (time !== lastTime) { ui.time.textContent = time; lastTime = time; }
  ui.bar.style.transform = `scaleX(${f.toFixed(3)})`;
  ui.tooth.style.setProperty('--canal', STAGE_CANAL[Math.min(4, Math.floor(f * 4 + 0.5))]);
  ui.tooth.style.setProperty('--cap', smooth(0.8, 0.96, f).toFixed(2));
}

/* perf guard: drop the cross-fade, then resolution, if frames are slow */
let lastTs = 0, slowN = 0, totN = 0;
function guard(ts) {
  if (lastTs) { const dt = ts - lastTs; totN++; if (dt > 24) slowN++;
    if (totN > 90) { const r = slowN / totN;
      if (r > 0.15 && film.blend) film.blend = false;
      else if (r > 0.2 && !film.lowres) { film.lowres = true; film.resize(); }
      totN = slowN = 0; } }
  lastTs = ts;
}

let filmActive = true;
new IntersectionObserver(es => es.forEach(e => filmActive = e.isIntersecting), { rootMargin: '100px' }).observe(filmSec);

function tick(ts) {
  if (filmActive && film.n) {
    const p = filmProgress();
    const f = clamp((p - P_HOLD_A) / (P_HOLD_B - P_HOLD_A));
    film.tgt = f * (film.n - 1);
    const d = film.tgt - film.cur;
    film.cur = Math.abs(d) < 0.01 ? film.tgt : film.cur + d * (reduce ? 1 : 0.2);
    film.draw(film.cur);
    const ti = film.cur - (FILM.intro - 1);
    updateFilmUI(p, clamp(ti / (film.n - FILM.intro)), ti < 0);
    if (Math.abs(d) > 0.05) guard(ts); else lastTs = 0;
  }
  requestAnimationFrame(tick);
}

/* ---------------- loader ---------------- */
const loaderEl = $('#loader'), loaderNum = $('#loaderNum');
let shown = 0;
function setLoad(v) { shown = Math.max(shown, v); loaderEl.style.setProperty('--lp', shown); loaderNum.textContent = Math.round(shown * 100); }
const minWait = new Promise(r => setTimeout(r, 1100));
const cap = new Promise(r => setTimeout(r, 8000));
const firstPass = new Promise(res => {
  if (!film.n) return res();
  film.load(0).then(() => film.preload(v => { setLoad(v); if (v >= 1) res(); }));
});
Promise.race([Promise.all([firstPass, document.fonts ? document.fonts.ready : 0, minWait]), cap]).then(() => {
  setLoad(1);
  setTimeout(() => { loaderEl.classList.add('out'); setTimeout(() => loaderEl.remove(), 1100); }, 250);
});
requestAnimationFrame(tick);

/* ---------------- header + mobile book bar ---------------- */
const hdr = $('#hdr'), mbook = $('.mbook'), bookSec = $('#book');
let lastY = 0;
function onScroll() {
  const y = scrollY, fr = filmSec.getBoundingClientRect(), br = bookSec.getBoundingClientRect();
  const overFilm = fr.bottom > 70;
  hdr.classList.toggle('over-film', overFilm);
  hdr.classList.toggle('solid', !overFilm && y > 10);
  hdr.classList.toggle('hide', !overFilm && y > lastY + 4 && y > innerHeight);
  if (y < lastY - 4) hdr.classList.remove('hide');
  lastY = y;
  const inBook = br.top < innerHeight && br.bottom > 0;
  mbook.classList.toggle('on', y > innerHeight * 0.6 && !inBook && !modalOpen);
  // book section parallax
  const bp = clamp(1 - (br.top + br.height * 0.5) / (innerHeight + br.height * 0.5), 0, 1) - 0.5;
  bookSec.style.setProperty('--bp', bp.toFixed(3));
  // doctor parallax
  const df = $('.doc-fig'); if (df) { const r = df.getBoundingClientRect(); df.style.setProperty('--py', `${((r.top + r.height / 2 - innerHeight / 2) * -0.06).toFixed(1)}px`); }
  // after timeline fill
  const tl = $('#tl'), tlr = tl.getBoundingClientRect();
  const tf = clamp((innerHeight * 0.75 - tlr.top) / (tlr.height + innerHeight * 0.2));
  const line = $('.tl-line'); line.style.setProperty('--tf', tf.toFixed(3));
  $$('li', tl).forEach((li, i, a) => li.classList.toggle('on', tf >= i / (a.length - 1) - 0.02));
  // footer wordmark fill
  const fw = $('.ftr-word'), fwr = fw.getBoundingClientRect();
  fw.style.setProperty('--fw', `${(clamp((innerHeight - fwr.top) / (fwr.height + innerHeight * 0.4)) * 100).toFixed(1)}%`);
}
function placeTlLine() {
  const tl = $('#tl'), sec = $('#after'), first = $('li', tl);
  const top = first.getBoundingClientRect().top - sec.getBoundingClientRect().top;
  const line = $('.tl-line');
  if (isMob()) { line.style.setProperty('--tly', `${top + 13}px`); line.style.setProperty('--tlh', `${tl.offsetHeight - 30}px`); }
  else line.style.setProperty('--tly', `${top + 7}px`);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { placeTlLine(); onScroll(); });
addEventListener('load', () => { placeTlLine(); onScroll(); });

/* ---------------- book section: cursor + open ---------------- */
const bkCur = $('.bk-cursor');
bookSec.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const r = bookSec.getBoundingClientRect();
  bkCur.style.setProperty('--cx', `${e.clientX - r.left}px`); bkCur.style.setProperty('--cy', `${e.clientY - r.top}px`); bkCur.style.setProperty('--cs', 1);
});
bookSec.addEventListener('pointerleave', () => bkCur.style.setProperty('--cs', 0));
bookSec.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBook(); } });

/* ---------------- booking modal + form ---------------- */
const modal = $('#modal'), card = $('#modalCard'), form = $('#bf'), done = $('#bfDone');
let modalOpen = false, lastFocus = null, booking = null;

/* Doctor availability. Demo schedule: derived from the date so it is stable.
   Replace slotTaken()/dayOff() with a real calendar/API lookup. */
const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 100; };
const isoOf = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
const dayOff = iso => hash('off' + iso) < 14;
const slotPast = (iso, t) => { const n = new Date(); if (iso !== isoOf(n)) return false; const [h, m] = t.split(':').map(Number); return h * 60 + m < n.getHours() * 60 + n.getMinutes() + 60; };
const slotTaken = (iso, t) => dayOff(iso) || slotPast(iso, t) || hash(iso + t) < 38;
const freeCount = iso => TIME_SLOTS.filter(t => !slotTaken(iso, t)).length;
const fmtDay = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); };

function buildDays() {
  const wrap = $('#dayChips'); wrap.innerHTML = '';
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let added = 0, k = 0;
  while (added < 8) {
    const x = new Date(d); x.setDate(d.getDate() + k++);
    if (x.getDay() === 0) continue;
    const iso = isoOf(x), n = freeCount(iso), off = dayOff(iso);
    const lab = k === 1 ? 'Today' : k === 2 ? 'Tomorrow' : wd[x.getDay()];
    const note = off ? 'On leave' : n ? `${n} free` : 'Full';
    wrap.insertAdjacentHTML('beforeend', `<label class="${n ? 'av-yes' : 'av-no'}"><input type="radio" name="day" value="${iso}" data-label="${wd[x.getDay()]} ${x.getDate()} ${mo[x.getMonth()]}" ${n ? '' : 'disabled'}><span><small>${lab}</small><strong>${x.getDate()}</strong><small>${mo[x.getMonth()]}</small><em>${note}</em></span></label>`);
    added++;
  }
  wrap.onchange = () => { buildTimes(); docStatus(); };
}
function buildTimes() {
  const wrap = $('#timeChips'); const sel = (form.querySelector('[name=time]:checked') || {}).value;
  const day = (form.querySelector('[name=day]:checked') || {}).value;
  wrap.innerHTML = TIME_SLOTS.map(t => {
    const taken = day ? slotTaken(day, t) : false;
    return `<label class="${day ? (taken ? 'av-no' : 'av-yes') : ''}"><input type="radio" name="time" value="${t}" ${taken || !day ? 'disabled' : ''} ${sel === t && !taken ? 'checked' : ''}><span>${t}${day ? `<em>${taken ? 'Booked' : 'Available'}</em>` : ''}</span></label>`;
  }).join('');
  wrap.onchange = docStatus;
}
function docStatus() {
  const box = $('#docStatus'), day = (form.querySelector('[name=day]:checked') || {}).value, time = (form.querySelector('[name=time]:checked') || {}).value;
  let st = 'idle', msg = 'Pick a day and time to check availability.';
  if (day && time) { st = 'yes'; msg = `Dr. Carter is available on ${fmtDay(day)} at ${time}.`; }
  else if (day) { const n = freeCount(day); st = n ? 'yes' : 'no'; msg = n ? `Dr. Carter has ${n} free slot${n > 1 ? 's' : ''} on ${fmtDay(day)}. Choose a time.` : `Dr. Carter is not available on ${fmtDay(day)}.`; }
  box.dataset.state = st; $('#docMsg').textContent = msg;
}
function nextFree() {
  const radios = [...form.querySelectorAll('[name=day]:not(:disabled)')]; if (!radios.length) { const box = $('#docStatus'); box.dataset.state = 'no'; $('#docMsg').textContent = 'Dr. Carter has no free slots in the next 8 days. Please call us.'; return; }
  const r = radios[0]; r.checked = true; buildTimes();
  const t = TIME_SLOTS.find(t => !slotTaken(r.value, t)); const tr = form.querySelector(`[name=time][value="${t}"]`); if (tr) tr.checked = true;
  setErr('day', false); setErr('time', false); docStatus();
}
function openBook(e) {
  if (modalOpen) return;
  lastFocus = document.activeElement;
  const x = e && e.clientX ? e.clientX : innerWidth / 2, y = e && e.clientY ? e.clientY : innerHeight / 2;
  modal.hidden = false;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${clamp(x - r.left, 0, r.width)}px`); card.style.setProperty('--my', `${clamp(y - r.top, 0, r.height)}px`);
  if (!form.querySelector('[name=day]')) { buildDays(); buildTimes(); docStatus(); }
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('open')));
  modalOpen = true; document.body.classList.add('locked'); lenis && lenis.stop();
  mbook.classList.remove('on');
  setTimeout(() => (form.hidden ? $('#bfIcs') : $('#symChips input')).focus({ preventScroll: true }), 350);
}
function closeBook() {
  if (!modalOpen) return;
  modal.classList.remove('open'); modalOpen = false;
  document.body.classList.remove('locked'); lenis && lenis.start();
  setTimeout(() => { if (!modalOpen) modal.hidden = true; }, 650);
  if (booking) setTimeout(() => { form.reset(); form.hidden = false; done.hidden = true; buildDays(); buildTimes(); docStatus(); booking = null; }, 700);
  lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-book]'); if (b) { e.preventDefault(); const sv = b.dataset.service && form.querySelector(`[name=service][value="${b.dataset.service}"]`); if (sv) sv.checked = true; openBook(e); return; }
  if (e.target.closest('[data-close]')) closeBook();
});
document.addEventListener('keydown', e => {
  if (!modalOpen) return;
  if (e.key === 'Escape') closeBook();
  if (e.key === 'Tab') { // keep focus inside the dialog
    const f = $$('button, input:not([disabled]), textarea, a[href]', card).filter(el => el.offsetParent !== null);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

function setErr(key, on) {
  const el = form.querySelector(`[data-err="${key}"]`); if (!el) return;
  el.classList.toggle('show', on); const f = el.closest('.fld'); if (f) f.classList.toggle('bad', on);
}
form.addEventListener('input', e => { if (e.target.name) setErr(e.target.name, false); if (e.target.name === 'day' || e.target.name === 'time') setErr(e.target.name, false); });
form.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(form);
  const v = { day: fd.get('day'), time: fd.get('time'), name: (fd.get('name') || '').trim(), phone: (fd.get('phone') || '').replace(/\D/g, ''), email: (fd.get('email') || '').trim(), notes: (fd.get('notes') || '').trim(), sym: fd.getAll('sym'), visit: fd.get('visit'), service: fd.get('service'), who: fd.get('who'), contact: fd.get('contact') };
  if (v.phone.length === 12 && v.phone.startsWith('91')) v.phone = v.phone.slice(2);
  const bad = {
    day: !v.day, time: !v.time || (v.day && slotTaken(v.day, v.time)), name: v.name.length < 2,
    phone: !/^[6-9]\d{9}$/.test(v.phone), email: !!v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)
  };
  Object.entries(bad).forEach(([k, b]) => setErr(k, b));
  const firstBad = Object.keys(bad).find(k => bad[k]);
  if (firstBad) {
    const el = form.querySelector(`[name="${firstBad}"]`); el && el.focus({ preventScroll: true });
    (form.querySelector(`[data-err="${firstBad}"]`) || el).scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }
  const dayLabel = form.querySelector(`[name=day][value="${v.day}"]`).dataset.label;
  booking = { ...v, dayLabel, ref: 'RX-' + Math.random().toString(36).slice(2, 6).toUpperCase() };
  // Demo: no server. For WordPress, POST `booking` to CF7 / WPForms / a REST endpoint here.
  $('#bfSummary').textContent = `${v.name.split(' ')[0]}, we’ve held ${dayLabel} at ${v.time} for you. Dr. Carter is available for your ${v.service.toLowerCase()} ${v.visit.toLowerCase()} visit. We’ll ${v.contact === 'WhatsApp' ? 'WhatsApp' : 'call'} ${v.phone.replace(/(\d{5})(\d{5})/, '$1 $2')} to confirm within 2 working hours.`;
  $('#bfRef').textContent = booking.ref;
  form.hidden = true; done.hidden = false; card.scrollTop = 0;
  setTimeout(() => $('#bfIcs').focus({ preventScroll: true }), 200);
});
$('#nextFree').addEventListener('click', nextFree);
$('#bfIcs').addEventListener('click', () => {
  if (!booking) return;
  const [y, m, d] = booking.day.split('-'); const [hh, mm] = booking.time.split(':');
  const pad = n => String(n).padStart(2, '0');
  const st = `${y}${m}${d}T${hh}${mm}00`; const endMin = (+hh * 60 + +mm + 90); const en = `${y}${m}${d}T${pad(Math.floor(endMin / 60))}${pad(endMin % 60)}00`;
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Radix//Booking//EN', 'BEGIN:VEVENT', `UID:${booking.ref}@radix.studio`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;TZID=Asia/Kolkata:${st}`, `DTEND;TZID=Asia/Kolkata:${en}`, 'SUMMARY:Root canal appointment · Radix Endodontic Studio', 'LOCATION:4th floor, Sindhu Bhavan Road, Bodakdev, Ahmedabad', `DESCRIPTION:Reference ${booking.ref}. Call +91 79 4000 2626 to reschedule.`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = `radix-${booking.ref}.ics`;
  document.body.appendChild(a); a.click(); a.remove(); toast('Calendar file downloaded');
});
// after a completed booking, closing resets to a fresh form

/* ---------------- before / after ---------------- */
const cmp = $('#cmp'), cmpR = $('.cmp-range', cmp);
cmpR.addEventListener('input', () => cmp.style.setProperty('--x', cmpR.value + '%'));

/* ---------------- studio tour ---------------- */
const tv = $('#tv'), tvStage = $('#tvStage'), tvCap = $('#tvCap'), tvLine = $('#tvLine');
const DUR = 7000; let ti = -1, tAuto = !reduce, tStart = 0, tPausedAt = 0, hoverPause = false;
const tourSrc = n => ({ src: `assets/img/${n}.webp`, srcset: `assets/img/${n}-m.webp 960w, assets/img/${n}.webp 1920w` });
tvLine.innerHTML = TOUR_STOPS.map((s, i) => `<li><button data-i="${i}"><i></i><b>${s.t}</b><span>${s.title}</span></button></li>`).join('');
const tlBtns = $$('button', tvLine);

function placeHotspots(slide) {
  const img = $('img', slide); const W = slide.clientWidth, H = slide.clientHeight;
  const iw = 16, ih = 9.05; const s = Math.max(W / iw, H / ih); const dw = iw * s, dh = ih * s; const ox = (W - dw) / 2, oy = (H - dh) / 2;
  $$('.hs, .hs-tip', slide).forEach(el => {
    const x = ox + (+el.dataset.x) * dw, y = oy + (+el.dataset.y) * dh;
    el.style.setProperty('--hx', `${clamp(x, 24, W - 24)}px`); el.style.setProperty('--hy', `${clamp(y, 24, H - 24)}px`);
    if (el.classList.contains('hs-tip')) el.classList.toggle('below', y < H * 0.35);
  });
}
function goTour(i, ev) {
  i = (i + TOUR_STOPS.length) % TOUR_STOPS.length; if (i === ti) return;
  const s = TOUR_STOPS[i], src = tourSrc(s.img);
  const sl = document.createElement('div'); sl.className = 'tv-slide' + (ti < 0 ? ' base in' : '');
  if (ev && ev.clientX) { const r = tv.getBoundingClientRect(); sl.style.setProperty('--ox', `${ev.clientX - r.left}px`); sl.style.setProperty('--oy', `${ev.clientY - r.top}px`); }
  sl.innerHTML = `<img src="${src.src}" srcset="${src.srcset}" sizes="(max-width: 820px) 100vw, 1400px" alt="${s.title}: ${s.text}" decoding="async">` +
    s.hs.map((h, k) => `<button class="hs" data-x="${h.x}" data-y="${h.y}" data-k="${k}" aria-label="${h.h}"></button><div class="hs-tip" data-x="${h.x}" data-y="${h.y}" data-k="${k}" role="tooltip"><b>${h.h}</b>${h.p}</div>`).join('');
  tvStage.appendChild(sl); placeHotspots(sl);
  const img = $('img', sl);
  const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => { sl.classList.add('in', 'kb'); }));
  img.complete ? reveal() : (img.onload = reveal, img.onerror = reveal);
  setTimeout(() => { $$('.tv-slide', tvStage).forEach(o => { if (o !== sl) o.remove(); }); }, 1250);
  tvCap.innerHTML = `<span class="t">${s.t} · stop ${i + 1} of ${TOUR_STOPS.length}</span><h3>${s.title}</h3><p>${s.text}</p>`;
  $$('li', tvLine).forEach((li, k) => { li.classList.toggle('on', k === i); tlBtns[k].style.setProperty('--tp', k < i ? 1 : 0); });
  ti = i; tStart = performance.now(); tPausedAt = 0;
  // preload next
  const nx = TOUR_STOPS[(i + 1) % TOUR_STOPS.length]; const pre = new Image(); pre.srcset = tourSrc(nx.img).srcset; pre.sizes = isMob() ? '100vw' : '1400px';
}
tv.addEventListener('click', e => {
  const hs = e.target.closest('.hs');
  if (hs) { e.stopPropagation(); const sl = hs.closest('.tv-slide'); const tip = $(`.hs-tip[data-k="${hs.dataset.k}"]`, sl);
    const was = tip.classList.contains('on'); $$('.hs-tip', sl).forEach(t => t.classList.remove('on')); if (!was) tip.classList.add('on'); pauseTour(true); }
});
tv.addEventListener('pointerover', e => { const hs = e.target.closest('.hs'); if (hs && e.pointerType === 'mouse') { const sl = hs.closest('.tv-slide'); $(`.hs-tip[data-k="${hs.dataset.k}"]`, sl).classList.add('on'); } });
tv.addEventListener('pointerout', e => { const hs = e.target.closest('.hs'); if (hs && e.pointerType === 'mouse') { const sl = hs.closest('.tv-slide'); $(`.hs-tip[data-k="${hs.dataset.k}"]`, sl).classList.remove('on'); } });
tv.addEventListener('mouseenter', () => { hoverPause = true; });
tv.addEventListener('mouseleave', () => { hoverPause = false; });
function pauseTour(on) { tAuto = !on; tv.classList.toggle('paused', on); $('#tvPlay').setAttribute('aria-label', on ? 'Play tour' : 'Pause tour'); if (!on) tStart = performance.now() - (tPausedAt || 0); }
$('#tvPlay').addEventListener('click', e => { e.stopPropagation(); pauseTour(tAuto); });
$('#tvPrev').addEventListener('click', e => { e.stopPropagation(); goTour(ti - 1); });
$('#tvNext').addEventListener('click', e => { e.stopPropagation(); goTour(ti + 1); });
tlBtns.forEach(b => b.addEventListener('click', e => goTour(+b.dataset.i)));
tv.addEventListener('keydown', e => { if (e.key === 'ArrowRight') goTour(ti + 1); if (e.key === 'ArrowLeft') goTour(ti - 1); if (e.key === ' ') { e.preventDefault(); pauseTour(tAuto); } });
let sx = null; tv.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
tv.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) goTour(ti + (dx < 0 ? 1 : -1)); sx = null; });
addEventListener('resize', () => $$('.tv-slide', tvStage).forEach(placeHotspots));
let tvVisible = false;
new IntersectionObserver(es => es.forEach(en => { tvVisible = en.isIntersecting; if (tvVisible && ti < 0) goTour(0); }), { rootMargin: '200px' }).observe(tv);
(function tvLoop(now) {
  if (ti >= 0) {
    const running = tAuto && !hoverPause && tvVisible && !document.hidden && !modalOpen;
    if (running) { const el = now - tStart; tlBtns[ti].style.setProperty('--tp', clamp(el / DUR).toFixed(3)); if (el >= DUR) goTour(ti + 1); }
    else { tPausedAt = now - tStart; tStart = now - tPausedAt; }
  }
  requestAnimationFrame(tvLoop);
})(performance.now());

/* ---------------- counters ---------------- */
const fmt = n => n.toLocaleString('en-IN');
const cio = new IntersectionObserver((es) => es.forEach(e => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || ''; const t0 = performance.now(), D = reduce ? 1 : 1600;
  (function run(t) { const k = clamp((t - t0) / D); const v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = fmt(v) + suf; if (k < 1) requestAnimationFrame(run); })(t0);
}), { threshold: 0.6 });
$$('[data-count]').forEach(el => { if (el.tagName !== 'CANVAS') cio.observe(el); });

onScroll();
})();
