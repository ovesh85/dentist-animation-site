/* Ivory Dental Clinic — one-page site with a scroll-driven treatment film.
   Edit CONFIG, STEPS, TREATMENTS and FAQ below. */
(() => {
'use strict';

/* ---------- CONFIG (replace placeholders before going live) ---------- */
const CONFIG = {
  name: 'Ivory Dental Clinic',
  whatsapp: '919876543210',   // PLACEHOLDER: country code + number, digits only
  phone: '+91 98765 43210',   // PLACEHOLDER
  address: ['Ivory Dental Clinic', 'Navrangpura', 'Ahmedabad, Gujarat'],
  mapsQuery: 'Ivory Dental Clinic Ahmedabad',
  hours: { 0: [], 1: [[600,840],[1020,1260]], 2: [[600,840],[1020,1260]], 3: [[600,840],[1020,1260]], 4: [[600,840],[1020,1260]], 5: [[600,840],[1020,1260]], 6: [[600,840],[1020,1260]] }
};

/* ---------- Film captions (step 0 is the hero) ---------- */
const STEPS = [
  null,
  { label: 'Comfort', h: "You're in safe hands", p: 'An ergonomic chair, shadow-free LED light and a numbing gel before every injection. We explain each step before it starts.', tags: ['Numbing gel', 'Single-use kit', 'LED operatory light'] },
  { label: 'Root canal', h: 'Root canal treatment', p: 'Rotary files gently clean and shape the infected canal while a rubber dam keeps the tooth isolated and dry. Most root canals finish in one or two visits.', tags: ['Rubber dam isolation', 'Rotary endodontics', 'Apex locator'] },
  { label: 'Cleaning', h: 'Scaling and polishing', p: 'An ultrasonic scaler breaks up tartar with gentle vibration and a cooling water mist, then a polish leaves enamel smooth and bright.', tags: ['Ultrasonic scaler', 'Polishing', 'About 40 minutes'] },
  { label: 'Result', h: 'Leave with a confident smile', p: 'Clean, comfortable and pain-free. Book your visit on WhatsApp in a few taps.', tags: [], cta: true }
];

/* ---------- Treatments ---------- */
const T = 'M12 4c-1.6-1.2-4.2-1.5-5.6.2C5 6 5.6 9 6.3 11c.6 1.8.7 4 1 6 .3 1.8.8 3 1.6 3 .9 0 1.1-1.4 1.4-3 .3-1.5.6-3 1.7-3s1.4 1.5 1.7 3c.3 1.6.5 3 1.4 3 .8 0 1.3-1.2 1.6-3 .3-2 .4-4.2 1-6 .7-2 1.3-5-.1-6.8C16.2 2.5 13.6 2.8 12 4z';
const TREATMENTS = [
  { name: 'Root canal treatment', p: 'Save an infected tooth instead of removing it, with rotary instruments under local anaesthesia.', meta: '1–2 visits', icon: `<path d="${T}"/><path d="M10.6 9v5.5M13.4 9v5.5"/>` },
  { name: 'Teeth cleaning', p: 'Ultrasonic scaling and polishing to remove tartar and stains. Recommended every six months.', meta: '40 minutes', icon: `<path d="${T}"/><path d="M19.5 2.5v3M18 4h3"/>` },
  { name: 'Tooth-coloured fillings', p: 'Composite fillings matched to your natural shade for cavities and chipped edges.', meta: '1 visit', icon: `<path d="${T}"/><path d="M10 8.5h4v3h-4z"/>` },
  { name: 'Crowns and bridges', p: 'Ceramic and zirconia caps to protect weak teeth or replace a missing one.', meta: '2 visits', icon: '<path d="M4 9l4 3 4-6 4 6 4-3-1.6 9H5.6z"/><path d="M6 21h12"/>' },
  { name: 'Dental implants', p: 'A titanium root and crown that replace a missing tooth for the long term.', meta: '3–4 months', icon: '<path d="M8 3h8l-1 4.5H9z"/><path d="M10 7.5V19l2 2 2-2V7.5M10 11h4M10 14h4M10 17h4"/>' },
  { name: 'Braces and aligners', p: 'Metal, ceramic or clear removable aligners for crowded or gapped teeth.', meta: '12–24 months', icon: '<rect x="3" y="8" width="18" height="8" rx="3"/><path d="M3 12h18M7.5 10v4M12 10v4M16.5 10v4"/>' },
  { name: 'Teeth whitening', p: 'In-clinic whitening that lifts tea, coffee and age stains in a single sitting.', meta: '60 minutes', icon: '<path d="M12 3l1.8 4.6L19 9l-4 3.3 1.2 5.2L12 15l-4.2 2.5L9 12.3 5 9l5.2-1.4z"/>' },
  { name: "Children's dentistry", p: 'Gentle first visits, fluoride, sealants and small fillings at a child-friendly pace.', meta: 'Ages 3+', icon: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>' }
];

const FAQ = [
  ['Does root canal treatment hurt?', 'With local anaesthesia most patients feel pressure rather than pain, much like a filling. Mild soreness for a day or two is normal and settles with a simple painkiller.'],
  ['How often should I get my teeth cleaned?', 'Every six months for most people. If you have gum problems or smoke, we may suggest every three to four months.'],
  ['Will cleaning damage my enamel?', 'No. Ultrasonic scaling removes tartar and stains, not enamel. Teeth can feel slightly sensitive for a day afterwards.'],
  ['How and when do I pay?', 'At the cash counter after your consultation, by cash, card or UPI. You receive a written estimate before any treatment begins.'],
  ['Do you see dental emergencies?', 'Yes. Message us on WhatsApp with a short description and we will offer the earliest slot, including Sundays for severe pain or swelling.'],
  ['Do I need an appointment?', 'Appointments keep waiting times short, but walk-in patients are seen whenever a chair is free.']
];

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth <= 760;
const waLink = text => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;

/* =====================================================================
   SeqFilm: WebP frames on canvas, keyframes first then coarse-to-fine.
   ===================================================================== */
const canvas = $('#canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const COUNT = +canvas.dataset.count;
const KEYS = canvas.dataset.keys.split(',').map(Number);
const conn = navigator.connection || {};
const STEP = (conn.saveData || /2g/.test(conn.effectiveType || '')) ? 2 : 1;
const V = mobile ? 'm' : 'd';
const base = `assets/seq/film/${V}/`;
const frames = new Array(COUNT);
const smile = new Image(); smile.decoding = 'async'; smile.src = base + 'smile.webp';

const order = [], seen = new Set();
const add = i => { if (i >= 0 && i < COUNT && !seen.has(i) && (i % STEP === 0 || KEYS.includes(i))) { seen.add(i); order.push(i); } };
KEYS.forEach(add);
for (const s of [16, 8, 4, 2, 1]) for (let i = 0; i < COUNT; i += s) add(i);
const firstPass = order.filter(i => KEYS.includes(i) || i % 16 === 0).length;
let loaded = 0, cursor = 0, active = 0, onFirstPass = null;
function pump() {
  while (active < 6 && cursor < order.length) {
    const i = order[cursor++]; active++;
    const img = new Image(); img.decoding = 'async';
    img.onload = () => { frames[i] = img; loaded++; active--; progress(); pump(); };
    img.onerror = () => { active--; pump(); };
    img.src = `${base}f_${String(i + 1).padStart(4, '0')}.webp`;
  }
}
function progress() {
  const p = Math.min(1, loaded / firstPass);
  $('#ldBar').style.transform = `scaleX(${p})`;
  if (p >= 1 && onFirstPass) { onFirstPass(); onFirstPass = null; }
  dirty = true;
}
function nearest(i) {
  if (frames[i]) return frames[i];
  for (let d = 1; d < 40; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; }
  return null;
}
let lastDecode = -99;
function decodeAround(i) {
  if (Math.abs(i - lastDecode) < 3) return; lastDecode = i;
  for (let d = 1; d <= 6; d++) { const f = frames[i + d]; if (f && f.decode) f.decode().catch(() => {}); }
}

/* ---------- scroll timeline ----------
   expand (card grows to full screen) -> step holds and moves -> crossfade to smile */
const SEGS = []; let total = 0;
const seg = (len, o) => { SEGS.push({ a: total, b: total + len, ...o }); total += len; };
seg(1.1, { kind: 'expand', f0: 0, f1: 0, step: 0 });
seg(.7, { kind: 'hold', f0: 0, f1: 0, step: 1 });
seg(1.2, { kind: 'move', f0: 0, f1: KEYS[1], step: 1 });
seg(.7, { kind: 'hold', f0: KEYS[1], f1: KEYS[1], step: 2 });
seg(1.2, { kind: 'move', f0: KEYS[1], f1: KEYS[2], step: 2 });
seg(.7, { kind: 'hold', f0: KEYS[2], f1: KEYS[2], step: 3 });
seg(.6, { kind: 'fade', f0: KEYS[2], f1: KEYS[2], step: 3 });
seg(.9, { kind: 'hold-smile', f0: KEYS[2], f1: KEYS[2], step: 4 });
const stepStart = [], stepEnd = [];
SEGS.forEach(s => { if (stepStart[s.step] == null) stepStart[s.step] = s.a; stepEnd[s.step] = s.b; });
function map(p) {
  const w = p * total;
  for (const s of SEGS) if (w <= s.b) {
    const t = clamp((w - s.a) / (s.b - s.a));
    let step = s.step;
    if (s.kind === 'move' && t > .55) step = s.step + 1;
    if (s.kind === 'fade' && t > .5) step = 4;
    return {
      w, step,
      frame: s.kind === 'move' ? lerp(s.f0, s.f1, ease(t)) : s.f0,
      expand: s.kind === 'expand' ? ease(t) : 1,
      smile: s.kind === 'fade' ? ease(t) : s.kind === 'hold-smile' ? 1 : 0
    };
  }
  return { w, step: 4, frame: KEYS[2], expand: 1, smile: 1 };
}

/* ---------- layout cache ---------- */
const film = $('#film'); film.style.height = film.dataset.vh + 'vh';
const hero = $('#hero');
let fTop = 0, fLen = 1, W = 0, H = 0, dpr = 1, card = { x: 0, y: 0, w: 0, h: 0 }, bookTop = 0, bookBot = 0;
function measure() {
  const y = scrollY;
  const r = film.getBoundingClientRect(); fTop = r.top + y; fLen = Math.max(1, r.height - innerHeight);
  const b = $('#book').getBoundingClientRect(); bookTop = b.top + y; bookBot = bookTop + b.height;
  dpr = Math.min(devicePixelRatio || 1, 1.5);
  W = innerWidth; H = canvas.clientHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const gut = Math.max(16, Math.min(48, W * .04));
  const wrapL = Math.max(gut, (W - 1240) / 2), wrapR = W - wrapL;
  if (mobile) {
    const hb = hero.offsetTop + hero.offsetHeight;
    card = { x: gut, y: Math.min(hb + 22, H * .62), w: W - 2 * gut, h: 0 }; card.h = H - card.y - gut;
  } else {
    const x = wrapL + (wrapR - wrapL) * .47;
    card = { x, y: 92, w: wrapR - x, h: H - 92 - 40 };
  }
  dirty = true;
}

/* ---------- drawing ---------- */
const BG = '#fbfbf9';
let dirty = true, lastKey = '';
function cover(img, x, y, w, h, alpha = 1) {
  const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(w / iw, h / ih), dw = iw * s, dh = ih * s;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) * .08, dw, dh);
  ctx.globalAlpha = 1;
}
function render(fi, m) {
  const key = `${fi}|${m.expand.toFixed(4)}|${m.smile.toFixed(3)}`;
  if (!dirty && key === lastKey) return;
  const img = nearest(fi); if (!img) return;
  lastKey = key; dirty = false;
  const e = m.expand;
  const x = lerp(card.x, 0, e), y = lerp(card.y, 0, e), w = lerp(card.w, W, e), h = lerp(card.h, H, e), r = lerp(26, 0, e);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (e < 1) { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); }
  ctx.save();
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.clip();
  cover(img, x, y, w, h);
  if (m.smile > 0 && smile.complete && smile.naturalWidth) cover(smile, x, y, w, h, m.smile);
  if (e > 0) { // bottom shade for step labels
    const g = ctx.createLinearGradient(0, H * .62, 0, H);
    g.addColorStop(0, 'rgba(13,26,23,0)'); g.addColorStop(1, `rgba(13,26,23,${.55 * e})`);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/* ---------- captions + step nav ---------- */
const cap = $('#cap'), capK = $('#capK'), capH = $('#capH'), capP = $('#capP'), capT = $('#capT'), capCta = $('#capCta');
const stepsNav = $('#steps');
STEPS.forEach((s, i) => { if (!s) return;
  const b = document.createElement('button'); b.type = 'button'; b.dataset.i = i;
  b.innerHTML = `<span>${String(i).padStart(2, '0')}  ${s.label}</span><i><b></b></i>`;
  b.addEventListener('click', () => { const mid = SEGS.find(g => g.step === i && g.kind.startsWith('hold')); go(fTop + ((mid.a + mid.b) / 2 / total) * fLen); });
  stepsNav.appendChild(b);
});
const stepBtns = [...stepsNav.children];
let cur = -1;
function setStep(i) {
  if (i === cur) return; cur = i;
  stepBtns.forEach(b => { const on = +b.dataset.i === i; b.classList.toggle('now', on); b.setAttribute('aria-current', on ? 'step' : 'false'); });
  if (!i) { cap.classList.remove('on'); return; }
  const s = STEPS[i];
  capK.textContent = `Step ${i} of ${STEPS.length - 1}`; capH.textContent = s.h; capP.textContent = s.p;
  capT.innerHTML = s.tags.map(t => `<li>${t}</li>`).join(''); capT.hidden = !s.tags.length; capCta.hidden = !s.cta;
  cap.classList.add('on'); cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
}

/* ---------- chrome ---------- */
const hdr = $('#hdr'), fab = $('#fab'), hint = $('#hint');
let lastY = 0;
function chrome(y, m) {
  if (Math.abs(y - lastY) > 6) { hdr.classList.toggle('hide', y > lastY && y > 200 && m.expand >= 1); lastY = y; }
  hdr.classList.toggle('line', y > fTop + fLen + innerHeight - 90);
  fab.classList.toggle('on', y > fTop + fLen + innerHeight * .3 && !(y + innerHeight * .6 > bookTop && y < bookBot - innerHeight * .3));
}

/* ---------- loop ---------- */
let fcur = 0, lenis = null;
function loop(t) {
  if (lenis) lenis.raf(t);
  const y = scrollY, p = clamp((y - fTop) / fLen), m = map(p);
  fcur = Math.abs(m.frame - fcur) < .3 ? m.frame : lerp(fcur, m.frame, .22);
  const fi = Math.round(fcur);
  if (y < fTop + fLen + innerHeight) { render(fi, m); decodeAround(fi); }
  const ho = clamp(m.expand * 1.7);
  hero.style.opacity = (1 - ho).toFixed(3);
  hero.style.translate = `${(-ho * 40).toFixed(1)}px 0`;
  hero.style.visibility = ho >= 1 ? 'hidden' : 'visible';
  hint.style.opacity = (1 - clamp(m.expand * 4)).toFixed(2);
  stepsNav.classList.toggle('on', m.expand >= .98);
  stepBtns.forEach(b => { const i = +b.dataset.i; b.querySelector('b').style.transform = `scaleX(${clamp((m.w - stepStart[i]) / (stepEnd[i] - stepStart[i])).toFixed(3)})`; });
  setStep(m.step);
  chrome(y, m);
  requestAnimationFrame(loop);
}
function go(y) { lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); }

/* ---------- treatments ---------- */
$('#grid').innerHTML = TREATMENTS.map(t => `
  <article class="tc">
    <div class="tc__ic"><svg viewBox="0 0 24 24" aria-hidden="true">${t.icon}</svg></div>
    <h3>${t.name}</h3><p>${t.p}</p>
    <div class="tc__meta"><span>${t.meta}</span><a href="${waLink(`Hello ${CONFIG.name}, I'd like to know more about ${t.name.toLowerCase()}.`)}" target="_blank" rel="noopener" aria-label="Ask about ${t.name} on WhatsApp">Enquire<svg aria-hidden="true"><use href="#arrow"/></svg></a></div>
  </article>`).join('');

/* ---------- before / after ---------- */
const ba = $('#ba'), baR = $('#baRange');
baR.addEventListener('input', () => ba.style.setProperty('--x', baR.value + '%'));

/* ---------- FAQ ---------- */
const faqList = $('#faqList');
faqList.innerHTML = FAQ.map(([q, a], i) => `<div class="qa"><button type="button" aria-expanded="false" aria-controls="qa${i}">${q}<span class="qa__ic" aria-hidden="true"></span></button><div class="qa__a" id="qa${i}" role="region"><div><p>${a}</p></div></div></div>`).join('');
faqList.querySelectorAll('.qa').forEach(qa => qa.querySelector('button').addEventListener('click', e => {
  const open = !qa.classList.contains('open'); qa.classList.toggle('open', open); e.currentTarget.setAttribute('aria-expanded', String(open)); setTimeout(measure, 450);
}));

/* ---------- booking form (inline section + "Book a consultation" dialog) ---------- */
const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const now = new Date(), tm = new Date(now); tm.setDate(tm.getDate() + 1);
function bindForm(form, onSent) {
  const q = n => form.elements[n], fD = q('date');
  ['General check-up', ...TREATMENTS.map(t => t.name), 'Wisdom tooth problem', 'Not sure yet, need advice'].forEach(n => q('treatment').add(new Option(n, n)));
  fD.min = iso(now); fD.value = iso(tm);
  const message = () => {
    const f = new FormData(form);
    const d = new Date(f.get('date') + 'T00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    const lines = [`Hello ${CONFIG.name}, I would like to book a consultation.`, '', `Name: ${f.get('name').trim()}`, `Mobile: ${f.get('phone').trim()}`, `Treatment: ${f.get('treatment')}`, `Preferred: ${d}, ${f.get('slot')}`];
    const note = f.get('note').trim(); if (note) lines.push(`Message: ${note}`);
    return lines.join('\n');
  };
  form.addEventListener('input', e => e.target.closest('.f')?.classList.remove('bad'));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const digits = q('phone').value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
    const ok = { name: !!q('name').value.trim(), phone: /^[6-9]\d{9}$/.test(digits), date: !!fD.value && fD.value >= fD.min };
    Object.entries(ok).forEach(([n, v]) => q(n).closest('.f').classList.toggle('bad', !v));
    if (!Object.values(ok).every(Boolean)) { form.querySelector('.bad input')?.focus(); return; }
    window.open(waLink(message()), '_blank', 'noopener');
    toast('Opening WhatsApp. Tap send to confirm your request.');
    onSent?.(q('name').value.trim().split(/\s+/)[0]);
  });
}
bindForm($('#form'));

const dlg = $('#bookDlg'), dlgForm = $('#form').cloneNode(true);
dlgForm.id = 'formM';
dlgForm.querySelectorAll('[id]').forEach(el => el.id += 'M');
dlgForm.querySelectorAll('label[for]').forEach(l => l.htmlFor += 'M');
dlgForm.querySelectorAll('select').forEach(sel => sel.innerHTML = '');
dlgForm.querySelectorAll('input[type=radio]').forEach(r => r.checked = r.defaultChecked);
dlgForm.querySelector('.form__hint').textContent = 'Opens WhatsApp. Nothing is sent until you tap send.';
$('#dlgBody').prepend(dlgForm);
bindForm(dlgForm, first => { $('#dlgThanks b').textContent = first; dlg.classList.add('sent'); $('#dlgDone').focus(); });
function openBook() {
  dlg.classList.remove('sent');
  if (typeof dlg.showModal === 'function') { dlg.showModal(); lenis?.stop(); } else go($('#book').getBoundingClientRect().top + scrollY - 70);
}
function closeBook() { dlg.close(); }
dlg.addEventListener('close', () => lenis?.start());
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) closeBook(); });
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3400); }

/* ---------- contact ---------- */
$('#addr').innerHTML = CONFIG.address.join('<br>');
$('#mapLink').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.mapsQuery)}`;
const tel = 'tel:' + CONFIG.phone.replace(/\s/g, '');
$('#hdrPhone').textContent = CONFIG.phone; $('#hdrCall').href = tel;
$('#ctPhone').textContent = CONFIG.phone; $('#ctPhone').href = tel;
$('#yr').textContent = new Date().getFullYear();
(function status() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const g = t => parts.find(p => p.type === t).value;
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')), mins = +g('hour') * 60 + +g('minute');
  const fmt = m => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h >= 12 ? 'pm' : 'am'}`; };
  const el = $('#status'), today = CONFIG.hours[day] || [];
  const open = today.find(([a, b]) => mins >= a && mins < b);
  if (open) { el.textContent = `Open now · closes at ${fmt(open[1])}`; el.classList.add('open'); return; }
  const later = today.find(([a]) => a > mins);
  if (later) { el.textContent = `Closed now · opens at ${fmt(later[0])}`; return; }
  for (let k = 1; k <= 7; k++) { const d = (day + k) % 7, h = CONFIG.hours[d]; if (h && h.length) { el.textContent = `Closed now · opens ${k === 1 ? 'tomorrow' : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d]} at ${fmt(h[0][0])}`; return; } }
})();

/* ---------- anchors via Lenis ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute('href');
  if (id === '#book' && !a.closest('#book')) { e.preventDefault(); openBook(); return; }
  if (id === '#top') { e.preventDefault(); go(0); return; }
  const el = $(id); if (!el) return; e.preventDefault();
  go(el.getBoundingClientRect().top + scrollY - (id === '#book' || id === '#contact' ? 70 : 0));
});

/* ---------- boot ---------- */
new ResizeObserver(measure).observe(document.body);
addEventListener('resize', measure);
let started = false;
function start() {
  if (started) return; started = true;
  $('#loader').classList.add('out'); document.body.classList.remove('is-loading'); document.body.classList.add('ready');
  setTimeout(() => $('#loader')?.remove(), 700);
  if (window.Lenis && !reduced) lenis = new Lenis({ lerp: .1 });
  measure(); requestAnimationFrame(loop);
}
onFirstPass = () => Promise.race([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 1500))]).then(() => setTimeout(start, 200));
setTimeout(start, 8000);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0); measure(); pump();
})();
