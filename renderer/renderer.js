'use strict';

const DAY_MS = 86400000;

const $ = (id) => document.getElementById(id);

const el = {
  sign: $('sign'),
  panel: $('panel'),
  digits: $('digits'),
  liveClock: $('liveClock'),
  recordVal: $('recordVal'),
  tagline: $('tagline'),
  verdict: $('verdict'),
  confetti: $('confetti'),
  flash: $('flash'),
  btnIncident: $('btnIncident'),
  btnHistory: $('btnHistory'),
  btnEdit: $('btnEdit'),
  btnMute: $('btnMute'),
};

let state = { incidentDate: new Date().toISOString(), recordDays: 0, history: [], days: 0 };
let muted = localStorage.getItem('rce.muted') === '1';
let lang = localStorage.getItem('rce.lang') || 'en';

/* ---------------- i18n ---------------- */

const I18N = {
  en: {
    locale: 'en-US',
    l1: 'DAYS WITHOUT',
    an: 'AN',
    recLabel: 'LONGEST DRY SPELL',
    recDays: 'DAYS',
    tagline: (n) => `It has been <b>${n}</b> day${n === 1 ? '' : 's'} since your last RCE`,
    // veredito: quanto mais dias, mais enferrujado (é ruim ficar sem pegar RCE)
    verdict: (n) => n === 0 ? { text: "🔥 SINISTER — you're on fire", cls: 'fresh' }
      : n <= 6 ? { text: 'still sharp', cls: 'sharp' }
      : n <= 29 ? { text: 'getting rusty…', cls: 'rusty' }
      : n <= 99 ? { text: 'seriously rusty', cls: 'rusty' }
      : { text: 'not a hacker anymore? 💀', cls: 'washed' },
    btnIncident: 'POPPED AN RCE!',
    btnHistory: 'History',
    btnEdit: 'Adjust',
    sound: 'Sound',
    imTitle: '🎉 Nice pop!',
    imDesc: 'Respect. The rust counter resets to zero. What did you pop? (optional)',
    imPlaceholder: 'CVE-2026-XXXX / target / service...',
    imCancel: 'Cancel',
    imConfirm: 'Log it 🔥',
    emTitle: '⚙️ Adjust',
    emLang: 'Language / Idioma',
    emDays: 'Days since your last RCE (current)',
    emRecord: 'Longest dry spell (days)',
    emData: 'Data',
    emCancel: 'Cancel',
    emSave: 'Save',
    hmTitle: '🏆 Your RCE log',
    hmClear: 'Clear log',
    hmClose: 'Close',
    hmEmpty: 'No RCEs logged yet. Go pop something! 🎯',
    hStreak: (d) => `🎯 Popped after a ${d}-day dry spell`,
  },
  pt: {
    locale: 'pt-BR',
    l1: 'DIAS SEM',
    an: 'UM',
    recLabel: 'MAIOR SECA',
    recDays: 'DIAS',
    tagline: (n) => `Faz <b>${n}</b> dia${n === 1 ? '' : 's'} que você não pega um RCE`,
    verdict: (n) => n === 0 ? { text: '🔥 SINISTRO — tá voando', cls: 'fresh' }
      : n <= 6 ? { text: 'ainda afiado', cls: 'sharp' }
      : n <= 29 ? { text: 'começando a enferrujar…', cls: 'rusty' }
      : n <= 99 ? { text: 'enferrujando feio', cls: 'rusty' }
      : { text: 'não é mais hacker? 💀', cls: 'washed' },
    btnIncident: 'PEGUEI UM RCE!',
    btnHistory: 'Histórico',
    btnEdit: 'Ajustar',
    sound: 'Som',
    imTitle: '🎉 Mandou bem!',
    imDesc: 'Respeito. O contador de ferrugem zera. O que você mandou? (opcional)',
    imPlaceholder: 'CVE-2026-XXXX / alvo / serviço...',
    imCancel: 'Cancelar',
    imConfirm: 'Registrar 🔥',
    emTitle: '⚙️ Ajustar',
    emLang: 'Idioma / Language',
    emDays: 'Dias desde o último RCE (atual)',
    emRecord: 'Maior seca (dias)',
    emData: 'Dados',
    emCancel: 'Cancelar',
    emSave: 'Salvar',
    hmTitle: '🏆 Seu log de RCEs',
    hmClear: 'Limpar log',
    hmClose: 'Fechar',
    hmEmpty: 'Nenhum RCE ainda. Vai lá pegar um! 🎯',
    hStreak: (d) => `🎯 Pegou depois de ${d} dia${d === 1 ? '' : 's'} de seca`,
  },
};

function t() { return I18N[lang] || I18N.en; }

const setText = (id, txt) => { const n = $(id); if (n) n.textContent = txt; };

function applyLang() {
  const d = t();
  document.documentElement.lang = d.locale;
  setText('hlL1', d.l1);
  setText('hlAnInline', ' ' + d.an);   // inline (modo wide): " AN"
  setText('hlAnStacked', d.an);         // ao lado do RCE (modo narrow)
  setText('recLabel', d.recLabel);
  setText('recDays', d.recDays);
  setText('btnIncidentTxt', d.btnIncident);
  // tooltips localizados dos ícones flat
  const setTitle = (id, txt) => {
    const n = $(id); if (!n) return;
    n.title = txt; n.setAttribute('aria-label', txt);
  };
  setTitle('btnHistory', d.btnHistory);
  setTitle('btnEdit', d.btnEdit);
  setTitle('btnMute', d.sound);
  // modal incidente
  setText('imTitle', d.imTitle);
  setText('imDesc', d.imDesc);
  $('incidentNote').placeholder = d.imPlaceholder;
  setText('incidentCancel', d.imCancel);
  setText('incidentConfirm', d.imConfirm);
  // modal ajustar
  setText('emTitle', d.emTitle);
  $('emLangLabel').childNodes[0].nodeValue = d.emLang + ' ';
  $('emDaysLabel').childNodes[0].nodeValue = d.emDays + ' ';
  $('emRecordLabel').childNodes[0].nodeValue = d.emRecord + ' ';
  setText('emData', d.emData);
  setText('editCancel', d.emCancel);
  setText('editSave', d.emSave);
  // modal histórico
  setText('hmTitle', d.hmTitle);
  setText('historyClear', d.hmClear);
  setText('historyClose', d.hmClose);
  // toggle ativo
  document.querySelectorAll('.lang-opt').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}

/* ---------------- helpers ---------------- */

function daysFrom(iso) {
  const e = Date.now() - Date.parse(iso);
  return e > 0 ? Math.floor(e / DAY_MS) : 0;
}

// Retorna "Dd HH:MM:SS" desde o incidente (parte de tempo do dia atual)
function liveClockText(iso) {
  let e = Date.now() - Date.parse(iso);
  if (e < 0) e = 0;
  const totalSec = Math.floor(e / 1000);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function applyState(s) {
  state = s;
  el.recordVal.textContent = s.recordDays;
}

// Atualiza os números na tela (chamado a cada segundo)
function tick() {
  const days = daysFrom(state.incidentDate);
  state.days = days;
  window.LED.renderNumber(el.digits, days);
  el.liveClock.textContent = liveClockText(state.incidentDate);
  el.tagline.innerHTML = t().tagline(days);
  // veredito de ferrugem
  const v = t().verdict(days);
  el.verdict.textContent = v.text;
  el.verdict.className = 'verdict ' + v.cls;
  // "maior seca" continua sendo o maior nº de dias já ficado sem pegar RCE
  if (days > state.recordDays) el.recordVal.textContent = days;
}

/* ---------------- som (WebAudio, sem arquivos) ---------------- */

let audioCtx = null;
function beep(freq, when, dur, type = 'square', gain = 0.14) {
  if (muted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime + when;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch (_) { /* silencioso */ }
}

function winSound() {
  // fanfarra ascendente triunfante (pegar um RCE é BOM)
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => beep(f, i * 0.11, 0.22, 'triangle', 0.13));
  beep(1318.5, 0.44, 0.3, 'triangle', 0.11); // E6 pra fechar
}

const ICON_SOUND = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
  + '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/></svg>';
const ICON_MUTED = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
  + '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4z"/><line x1="16" y1="9.5" x2="21" y2="14.5"/><line x1="21" y1="9.5" x2="16" y2="14.5"/></svg>';

function updateMuteBtn() {
  el.btnMute.innerHTML = muted ? ICON_MUTED : ICON_SOUND;
  el.btnMute.classList.toggle('muted', muted);
}

/* ---------------- confete ---------------- */

const CONFETTI_COLORS = ['#f4b400', '#ff3b30', '#3ecf5a', '#ffffff', '#ff8a1e', '#4ea3ff'];

function burstConfetti(n = 60) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'piece';
    const left = Math.random() * 100;
    const delay = Math.random() * 0.35;
    const dur = 1.6 + Math.random() * 1.4;
    const size = 6 + Math.random() * 7;
    p.style.left = left + 'vw';
    p.style.width = size + 'px';
    p.style.height = (size * 1.5) + 'px';
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.animationDuration = dur + 's';
    p.style.animationDelay = delay + 's';
    p.style.transform = `translateY(-20px) rotate(${Math.random() * 360}deg)`;
    if (Math.random() < 0.5) p.style.borderRadius = '50%';
    frag.appendChild(p);
  }
  el.confetti.appendChild(frag);
  // limpa depois que caiu tudo
  setTimeout(() => { el.confetti.innerHTML = ''; }, 3400);
}

/* ---------------- comemoração ao pegar um RCE ---------------- */

function playWinFX() {
  el.sign.classList.remove('shake');
  el.panel.classList.remove('win');
  el.flash.classList.remove('boom');
  // força reflow para reiniciar animações
  void el.sign.offsetWidth;
  el.sign.classList.add('shake');
  el.panel.classList.add('win');
  el.flash.classList.add('boom');
  winSound();
  burstConfetti();
  setTimeout(() => {
    el.sign.classList.remove('shake');
    el.panel.classList.remove('win');
    el.flash.classList.remove('boom');
  }, 1200);
}

/* ---------------- modais ---------------- */

function openModal(id) { $(id).hidden = false; }
function closeModal(id) { $(id).hidden = true; }

function wireIncidentModal() {
  const input = $('incidentNote');
  el.btnIncident.addEventListener('click', () => {
    input.value = '';
    openModal('incidentModal');
    setTimeout(() => input.focus(), 50);
  });
  $('incidentCancel').addEventListener('click', () => closeModal('incidentModal'));
  $('incidentConfirm').addEventListener('click', async () => {
    const note = input.value.trim();
    closeModal('incidentModal');
    const s = await window.rce.registerIncident(note);
    applyState(s);
    tick();
    playWinFX();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('incidentConfirm').click();
    if (e.key === 'Escape') closeModal('incidentModal');
  });
}

function wireEditModal() {
  el.btnEdit.addEventListener('click', () => {
    $('editDays').value = state.days;
    $('editRecord').value = state.recordDays;
    openModal('editModal');
  });
  $('editCancel').addEventListener('click', () => closeModal('editModal'));
  $('editReveal').addEventListener('click', () => window.rce.reveal());
  // toggle de idioma
  document.querySelectorAll('.lang-opt').forEach((b) => {
    b.addEventListener('click', () => {
      lang = b.dataset.lang;
      localStorage.setItem('rce.lang', lang);
      applyLang();
      tick();
      renderHistory();
    });
  });
  $('editSave').addEventListener('click', async () => {
    const days = parseInt($('editDays').value, 10);
    const recordDays = parseInt($('editRecord').value, 10);
    const s = await window.rce.edit({
      days: Number.isFinite(days) ? days : undefined,
      recordDays: Number.isFinite(recordDays) ? recordDays : undefined,
    });
    applyState(s);
    tick();
    closeModal('editModal');
  });
}

function renderHistory() {
  const ul = $('historyList');
  ul.innerHTML = '';
  if (!state.history.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = t().hmEmpty;
    ul.appendChild(li);
    return;
  }
  for (const h of state.history) {
    const li = document.createElement('li');
    const d = new Date(h.date);
    const dateStr = isNaN(d) ? '—' : d.toLocaleString(t().locale);
    const top = document.createElement('div');
    top.className = 'h-top';
    const streak = document.createElement('span');
    streak.className = 'h-streak';
    streak.textContent = t().hStreak(h.streakDays);
    const date = document.createElement('span');
    date.className = 'h-date';
    date.textContent = dateStr;
    top.append(streak, date);
    li.appendChild(top);
    if (h.note) {
      const note = document.createElement('div');
      note.className = 'h-note';
      note.textContent = h.note;
      li.appendChild(note);
    }
    ul.appendChild(li);
  }
}

function wireHistoryModal() {
  el.btnHistory.addEventListener('click', () => {
    renderHistory();
    openModal('historyModal');
  });
  $('historyClose').addEventListener('click', () => closeModal('historyModal'));
  $('historyClear').addEventListener('click', async () => {
    const s = await window.rce.clearHistory();
    applyState(s);
    renderHistory();
  });
}

// fecha modal ao clicar fora
document.querySelectorAll('.modal-backdrop').forEach((bd) => {
  bd.addEventListener('click', (e) => { if (e.target === bd) bd.hidden = true; });
});

/* ---------------- responsivo: escala pra caber ---------------- */

function fitToWindow() {
  const scaler = $('signScaler');
  const sign = el.sign;
  if (!scaler || !sign) return;
  scaler.style.transform = 'translate(-50%, -50%) scale(1)'; // reset pra medir natural
  const w = sign.offsetWidth, h = sign.offsetHeight;
  const pad = 24;
  const availW = window.innerWidth - pad;
  const availH = window.innerHeight - pad;
  const scale = Math.min(1.35, availW / w, availH / h);
  scaler.style.transform = 'translate(-50%, -50%) scale(' + scale.toFixed(4) + ')';
}

/* ---------------- boot ---------------- */

async function boot() {
  updateMuteBtn();
  el.btnMute.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem('rce.muted', muted ? '1' : '0');
    updateMuteBtn();
    if (!muted) beep(760, 0, 0.1, 'square', 0.1);
  });

  wireIncidentModal();
  wireEditModal();
  wireHistoryModal();
  applyLang();

  // responsivo: escala já no início (evita flash) e a cada resize
  fitToWindow();
  window.addEventListener('resize', fitToWindow);

  const s = await window.rce.get();
  applyState(s);
  tick();
  setInterval(tick, 1000);
  fitToWindow(); // reajusta após render final
}

window.addEventListener('DOMContentLoaded', boot);
