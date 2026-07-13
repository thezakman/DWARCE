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
    l1: 'DAYS WITHOUT AN',
    recLabel: 'OUR RECORD',
    recDays: 'DAYS',
    tagline: (n) => `It has been <b>${n}</b> day${n === 1 ? '' : 's'} without remote code execution`,
    btnIncident: 'REGISTER RCE',
    btnHistory: 'HISTORY',
    btnEdit: 'ADJUST',
    imTitle: '💥 New RCE',
    imDesc: 'This resets the counter. Note what happened (optional):',
    imPlaceholder: 'CVE-2026-XXXX / service / component...',
    imCancel: 'Cancel',
    imConfirm: 'Confirm RCE',
    emTitle: '⚙️ Adjust',
    emLang: 'Language / Idioma',
    emDays: 'Days without an RCE (current)',
    emRecord: 'Record (days)',
    emData: 'Data',
    emCancel: 'Cancel',
    emSave: 'Save',
    hmTitle: '📜 Incident history',
    hmClear: 'Clear history',
    hmClose: 'Close',
    hmEmpty: 'No incidents logged. Nice! 🎉',
    hStreak: (d) => `⏱ Streak of ${d} day${d === 1 ? '' : 's'}`,
  },
  pt: {
    locale: 'pt-BR',
    l1: 'DIAS SEM UM',
    recLabel: 'NOSSO RECORDE',
    recDays: 'DIAS',
    tagline: (n) => `Estamos há <b>${n}</b> dia${n === 1 ? '' : 's'} sem execução remota de código`,
    btnIncident: 'REGISTRAR RCE',
    btnHistory: 'HISTÓRICO',
    btnEdit: 'AJUSTAR',
    imTitle: '💥 Novo RCE',
    imDesc: 'Isso zera o contador. Anota o que aconteceu (opcional):',
    imPlaceholder: 'CVE-2026-XXXX / serviço / componente...',
    imCancel: 'Cancelar',
    imConfirm: 'Confirmar RCE',
    emTitle: '⚙️ Ajustar',
    emLang: 'Idioma / Language',
    emDays: 'Dias sem um RCE (contagem atual)',
    emRecord: 'Recorde (dias)',
    emData: 'Dados',
    emCancel: 'Cancelar',
    emSave: 'Salvar',
    hmTitle: '📜 Histórico de incidentes',
    hmClear: 'Limpar histórico',
    hmClose: 'Fechar',
    hmEmpty: 'Nenhum incidente registrado. Boa! 🎉',
    hStreak: (d) => `⏱ Streak de ${d} dia${d === 1 ? '' : 's'}`,
  },
};

function t() { return I18N[lang] || I18N.en; }

const setText = (id, txt) => { const n = $(id); if (n) n.textContent = txt; };

function applyLang() {
  const d = t();
  document.documentElement.lang = d.locale;
  setText('hlL1', d.l1);
  setText('recLabel', d.recLabel);
  setText('recDays', d.recDays);
  setText('btnIncidentTxt', d.btnIncident);
  setText('btnHistoryTxt', d.btnHistory);
  setText('btnEditTxt', d.btnEdit);
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
  // Se bateu o recorde ao vivo, reflete no painel (sem gravar; grava só no incidente)
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

function sirenSound() {
  // duas notas alternadas tipo alarme
  for (let i = 0; i < 3; i++) {
    beep(880, i * 0.28, 0.16, 'sawtooth', 0.12);
    beep(620, i * 0.28 + 0.14, 0.16, 'sawtooth', 0.12);
  }
}

function updateMuteBtn() {
  el.btnMute.textContent = muted ? '🔇' : '🔊';
}

/* ---------------- animação de incidente ---------------- */

function playIncidentFX() {
  el.sign.classList.remove('shake');
  el.panel.classList.remove('alarm');
  el.flash.classList.remove('boom');
  // força reflow para reiniciar animações
  void el.sign.offsetWidth;
  el.sign.classList.add('shake');
  el.panel.classList.add('alarm');
  el.flash.classList.add('boom');
  sirenSound();
  setTimeout(() => {
    el.sign.classList.remove('shake');
    el.panel.classList.remove('alarm');
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
    playIncidentFX();
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

  const s = await window.rce.get();
  applyState(s);
  tick();
  setInterval(tick, 1000);
}

window.addEventListener('DOMContentLoaded', boot);
