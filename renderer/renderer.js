'use strict';

const DAY_MS = 86400000;

const $ = (id) => document.getElementById(id);

const el = {
  sign: $('sign'),
  panel: $('panel'),
  matrix: $('matrix'),
  liveClock: $('liveClock'),
  recordVal: $('recordVal'),
  tagline: $('tagline'),
  verdict: $('verdict'),
  confetti: $('confetti'),
  flash: $('flash'),
  btnIncident: $('btnIncident'),
  btnHistory: $('btnHistory'),
  btnEdit: $('btnEdit'),
  btnTopics: $('btnTopics'),
  btnMute: $('btnMute'),
  topicChip: $('topicChip'),
  tcEmoji: $('tcEmoji'),
  tcName: $('tcName'),
};

let state = { incidentDate: new Date().toISOString(), recordDays: 0, history: [], days: 0 };
let muted = localStorage.getItem('rce.muted') === '1';
let lang = localStorage.getItem('rce.lang') || 'en';

// tópicos
let activeTopicId = 'rce';
let customTopics = [];
let topicStats = {};
let allTopics = window.TOPICS.BUILTIN_TOPICS.slice();

/* ---------------- i18n (chrome da UI; texto do tópico vem de topics.js) ---------------- */

const I18N = {
  en: {
    locale: 'en-US',
    btnHistory: 'History', btnEdit: 'Adjust', btnTopics: 'Topics', sound: 'Sound',
    imCancel: 'Cancel',
    emTitle: 'Adjust', emLang: 'Language / Idioma',
    emDays: 'Current days (dry spell)', emRecord: 'Record (days)',
    emData: 'Data', emCancel: 'Cancel', emSave: 'Save',
    hmTitle: 'Log', hmClear: 'Clear log', hmClose: 'Close',
    hmEmpty: 'Nothing logged yet. Go get one! 🎯',
    tmTitle: 'Choose your focus',
    tmDesc: 'Each focus tracks its own dry spell, record and log.',
    tmAdd: 'New focus', topicsClose: 'Close',
    tfEmoji: 'Emoji', tfType: 'Type', tfGood: '🏆 Achievement', tfBad: '😩 Grind',
    tfNameEn: 'Name (EN)', tfArtEn: 'Article (EN)', tfNamePt: 'Name (PT)', tfArtPt: 'Article (PT)',
    tfSave: 'Save focus', tfCancel: 'Cancel', tfDelete: 'Delete',
    cardRec: 'rec', cardDays: 'd',
  },
  pt: {
    locale: 'pt-BR',
    btnHistory: 'Histórico', btnEdit: 'Ajustar', btnTopics: 'Focos', sound: 'Som',
    imCancel: 'Cancelar',
    emTitle: 'Ajustar', emLang: 'Idioma / Language',
    emDays: 'Dias atuais (seca)', emRecord: 'Recorde (dias)',
    emData: 'Dados', emCancel: 'Cancelar', emSave: 'Salvar',
    hmTitle: 'Registro', hmClear: 'Limpar', hmClose: 'Fechar',
    hmEmpty: 'Nada registrado ainda. Vai lá pegar um! 🎯',
    tmTitle: 'Escolha seu foco',
    tmDesc: 'Cada foco tem sua própria seca, recorde e registro.',
    tmAdd: 'Novo foco', topicsClose: 'Fechar',
    tfEmoji: 'Emoji', tfType: 'Tipo', tfGood: '🏆 Conquista', tfBad: '😩 Perrengue',
    tfNameEn: 'Nome (EN)', tfArtEn: 'Artigo (EN)', tfNamePt: 'Nome (PT)', tfArtPt: 'Artigo (PT)',
    tfSave: 'Salvar foco', tfCancel: 'Cancelar', tfDelete: 'Excluir',
    cardRec: 'rec', cardDays: 'd',
  },
};

function t() { return I18N[lang] || I18N.en; }
function curTopic() { return allTopics.find((x) => x.id === activeTopicId) || allTopics[0]; }
function tc() { return window.TOPICS.topicCopy(curTopic(), lang); }

const setText = (id, txt) => { const n = $(id); if (n) n.textContent = txt; };
const setTitle = (id, txt) => {
  const n = $(id); if (!n) return;
  n.title = txt; n.setAttribute('aria-label', txt);
};

// Aplica o texto/estética do tópico ativo (headline, chip, botão, modal incidente).
function applyTopic() {
  const c = tc();
  // chip
  el.tcEmoji.textContent = c.emoji;
  el.tcName.textContent = c.subject;
  // headline
  setText('hlL1', c.l1);
  setText('hlSubject', c.subject);
  const anStacked = $('hlAnStacked');
  if (c.article) {                          // com artigo ("AN"/"UM"/...)
    setText('hlAnInline', ' ' + c.article); // modo wide: " AN"
    anStacked.textContent = c.article;      // modo narrow: ao lado do subject
    anStacked.style.display = '';           // volta ao controle da container query
  } else {                                  // sem artigo (ex.: FÉRIAS)
    setText('hlAnInline', '');
    anStacked.textContent = '';
    anStacked.style.display = 'none';       // evita gap fantasma no modo narrow
  }
  // recorde
  setText('recLabel', c.recLabel);
  setText('recDays', c.recDays);
  // botão principal
  setText('btnIncidentTxt', c.button);
  // modal incidente (título/desc/confirm/placeholder)
  setText('imTitle', c.imTitle);
  setText('imDesc', c.imDesc);
  setText('incidentConfirm', c.imConfirm);
  const note = $('incidentNote'); if (note) note.placeholder = c.placeholder;
}

function applyLang() {
  const d = t();
  document.documentElement.lang = d.locale;
  // ícones/tooltips
  setTitle('btnTopics', d.btnTopics);
  setTitle('btnHistory', d.btnHistory);
  setTitle('btnEdit', d.btnEdit);
  setTitle('btnMute', d.sound);
  // modal incidente (cancel genérico)
  setText('incidentCancel', d.imCancel);
  // modal ajustar
  setText('emTitle', d.emTitle);
  $('emLangLabel').childNodes[0].nodeValue = d.emLang + ' ';
  $('emDaysLabel').childNodes[0].nodeValue = d.emDays + ' ';
  $('emRecordLabel').childNodes[0].nodeValue = d.emRecord + ' ';
  setTitle('editReveal', d.emData); // botão só-ícone: texto vira tooltip
  setText('editCancel', d.emCancel);
  setText('editSave', d.emSave);
  // modal histórico
  setText('hmTitle', d.hmTitle);
  setText('historyClear', d.hmClear);
  setText('historyClose', d.hmClose);
  // modal tópicos
  setText('tmTitle', d.tmTitle);
  setText('tmDesc', d.tmDesc);
  setText('tmAdd', d.tmAdd);
  setText('topicsClose', d.topicsClose);
  $('tfEmojiLabel').childNodes[0].nodeValue = d.tfEmoji + ' ';
  $('tfPolLabel').childNodes[0].nodeValue = d.tfType + ' ';
  setText('tfPolGood', d.tfGood);
  setText('tfPolBad', d.tfBad);
  $('tfEnLabel').childNodes[0].nodeValue = d.tfNameEn + ' ';
  $('tfEnArtLabel').childNodes[0].nodeValue = d.tfArtEn + ' ';
  $('tfPtLabel').childNodes[0].nodeValue = d.tfNamePt + ' ';
  $('tfPtArtLabel').childNodes[0].nodeValue = d.tfArtPt + ' ';
  setText('tfSave', d.tfSave);
  setText('tfCancel', d.tfCancel);
  setText('tfDelete', d.tfDelete);
  // toggle ativo de idioma
  document.querySelectorAll('.lang-opt').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  applyTopic();
}

/* ---------------- helpers ---------------- */

function daysFrom(iso) {
  const e = Date.now() - Date.parse(iso);
  return e > 0 ? Math.floor(e / DAY_MS) : 0;
}

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
  activeTopicId = s.activeTopic || 'rce';
  customTopics = s.customTopics || [];
  topicStats = s.topicStats || {};
  allTopics = window.TOPICS.BUILTIN_TOPICS.concat(customTopics);
  el.recordVal.textContent = s.recordDays;
}

let lastDays = -1, lastMatrixW = -1;
function renderMatrix() {
  const w = el.matrix.clientWidth;
  if (state.days === lastDays && w === lastMatrixW) return;
  lastDays = state.days;
  lastMatrixW = w;
  window.LED.renderDisplay(el.matrix, state.days);
}

function tick() {
  const days = daysFrom(state.incidentDate);
  state.days = days;
  renderMatrix();
  el.liveClock.textContent = liveClockText(state.incidentDate);
  const c = tc();
  el.tagline.innerHTML = c.tagline(days);
  const v = c.verdict(days);
  el.verdict.textContent = v.text;
  el.verdict.className = 'verdict ' + v.cls;
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
  // fanfarra ascendente triunfante (conquista)
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => beep(f, i * 0.11, 0.22, 'triangle', 0.13));
  beep(1318.5, 0.44, 0.3, 'triangle', 0.11);
}

function loseSound() {
  // "sad trombone" descendente (perrengue — caiu uma estrela)
  const notes = [392.0, 349.23, 311.13, 261.63]; // G4 F4 Eb4 C4
  notes.forEach((f, i) => beep(f, i * 0.16, 0.3, 'sawtooth', 0.1));
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
  setTimeout(() => { el.confetti.innerHTML = ''; }, 3400);
}

/* ---------------- fogo subindo (perrengue) ---------------- */

function burstFire(n = 26) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'flame';
    p.textContent = Math.random() < 0.82 ? '🔥' : '💨';
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.fontSize = (16 + Math.random() * 24) + 'px';
    p.style.animationDuration = (1.3 + Math.random() * 1.3) + 's';
    p.style.animationDelay = (Math.random() * 0.5) + 's';
    p.style.setProperty('--drift', (Math.random() * 60 - 30).toFixed(0) + 'px');
    frag.appendChild(p);
  }
  el.confetti.appendChild(frag);
  setTimeout(() => { el.confetti.innerHTML = ''; }, 3200);
}

/* ---------------- FX ao registrar (varia com a polaridade) ---------------- */

function playWinFX(polarity) {
  const bad = polarity === 'bad';
  el.sign.classList.remove('shake');
  el.panel.classList.remove('win', 'doom');
  el.flash.classList.remove('boom', 'boom-bad');
  void el.sign.offsetWidth;
  el.sign.classList.add('shake');
  el.panel.classList.add(bad ? 'doom' : 'win');
  el.flash.classList.add(bad ? 'boom-bad' : 'boom');
  if (bad) { loseSound(); burstFire(); } else { winSound(); burstConfetti(); }
  setTimeout(() => {
    el.sign.classList.remove('shake');
    el.panel.classList.remove('win', 'doom');
    el.flash.classList.remove('boom', 'boom-bad');
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
    const pol = curTopic().polarity;
    closeModal('incidentModal');
    const s = await window.rce.registerIncident(note);
    applyState(s);
    tick();
    playWinFX(pol);
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
  document.querySelectorAll('.lang-opt').forEach((b) => {
    b.addEventListener('click', () => {
      lang = b.dataset.lang;
      localStorage.setItem('rce.lang', lang);
      applyLang();
      tick();
      fitToWindow(); // subjects mudam de idioma → re-ajusta o título
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
  const c = tc();
  for (const h of state.history) {
    const li = document.createElement('li');
    const d = new Date(h.date);
    const dateStr = isNaN(d) ? '—' : d.toLocaleString(t().locale);
    const top = document.createElement('div');
    top.className = 'h-top';
    const streak = document.createElement('span');
    streak.className = 'h-streak';
    streak.textContent = c.logVerb(h.streakDays);
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

/* ---------------- picker de tópicos + CRUD custom ---------------- */

let editingCustomId = null; // null = modo criar

function isCustom(id) { return customTopics.some((t2) => t2.id === id); }

function renderTopicGrid() {
  const grid = $('topicGrid');
  grid.innerHTML = '';
  const d = t();
  for (const topic of allTopics) {
    const name = window.TOPICS.topicName(topic, lang);
    const st = topicStats[topic.id] || { days: 0, recordDays: 0 };
    const card = document.createElement('div');
    card.className = 'topic-card' + (topic.id === activeTopicId ? ' active' : '')
      + (topic.polarity === 'bad' ? ' grind' : '');
    card.dataset.id = topic.id;
    card.innerHTML =
      `<span class="card-emoji">${topic.emoji}</span>`
      + `<span class="card-name"></span>`
      + `<span class="card-stats"><b>${st.days}</b>${d.cardDays} · ${d.cardRec} ${st.recordDays}</span>`;
    card.querySelector('.card-name').textContent = name;
    if (isCustom(topic.id)) {
      const edit = document.createElement('button');
      edit.className = 'card-edit';
      edit.title = d.btnEdit;
      edit.textContent = '✎';
      edit.addEventListener('click', (e) => { e.stopPropagation(); openTopicForm(topic); });
      card.appendChild(edit);
    }
    card.addEventListener('click', () => selectTopic(topic.id));
    grid.appendChild(card);
  }
}

async function selectTopic(id) {
  if (id === activeTopicId) { closeModal('topicsModal'); return; }
  const s = await window.rce.setTopic(id);
  applyState(s);
  applyTopic();
  lastDays = -1; // força re-render da matriz
  tick();
  fitToWindow(); // re-ajusta o título ao novo subject
  closeModal('topicsModal');
}

function showTopicForm(show) {
  $('topicForm').hidden = !show;
  $('topicGrid').hidden = show;
  $('topicsActions').hidden = show;
  $('tmDesc').hidden = show;
}

function setPolarity(pol) {
  document.querySelectorAll('.pol-opt').forEach((b) => {
    b.classList.toggle('active', b.dataset.pol === pol);
  });
}

function currentFormPolarity() {
  const active = document.querySelector('.pol-opt.active');
  return active ? active.dataset.pol : 'good';
}

// abre form: topic=null → criar; topic=def → editar
function openTopicForm(topic) {
  openModal('topicsModal'); // garante o modal aberto (o form vive dentro dele)
  editingCustomId = topic ? topic.id : null;
  $('tfEmoji').value = topic ? topic.emoji : '';
  $('tfEn').value = topic ? (topic.en.subject || '') : '';
  $('tfEnArt').value = topic ? (topic.en.article || '') : '';
  $('tfPt').value = topic ? (topic.pt.subject || '') : '';
  $('tfPtArt').value = topic ? (topic.pt.article || '') : '';
  setPolarity(topic ? topic.polarity : 'good');
  $('tfDelete').hidden = !topic;
  showTopicForm(true);
  setTimeout(() => $('tfEmoji').focus(), 50);
}

function buildDefFromForm() {
  const en = { subject: $('tfEn').value.trim(), article: $('tfEnArt').value.trim() };
  const pt = { subject: $('tfPt').value.trim(), article: $('tfPtArt').value.trim() };
  en.long = en.subject; pt.long = pt.subject;
  return {
    polarity: currentFormPolarity(),
    emoji: $('tfEmoji').value.trim() || '⭐',
    en, pt,
  };
}

function wireTopicsModal() {
  const open = () => {
    renderTopicGrid();
    showTopicForm(false);
    openModal('topicsModal');
  };
  el.btnTopics.addEventListener('click', open);
  el.topicChip.addEventListener('click', open);
  $('topicsClose').addEventListener('click', () => closeModal('topicsModal'));
  $('topicAdd').addEventListener('click', () => openTopicForm(null));
  $('tfCancel').addEventListener('click', () => showTopicForm(false));
  document.querySelectorAll('.pol-opt').forEach((b) => {
    b.addEventListener('click', () => setPolarity(b.dataset.pol));
  });
  $('tfSave').addEventListener('click', async () => {
    const def = buildDefFromForm();
    if (!def.en.subject && !def.pt.subject) return; // precisa de ao menos um nome
    if (!def.en.subject) def.en = { ...def.pt };
    if (!def.pt.subject) def.pt = { ...def.en };
    const s = editingCustomId
      ? await window.rce.updateTopic(editingCustomId, def)
      : await window.rce.addTopic(def);
    applyState(s);
    applyTopic();
    fitToWindow();
    renderTopicGrid();
    showTopicForm(false);
  });
  $('tfDelete').addEventListener('click', async () => {
    if (!editingCustomId) return;
    const wasActive = editingCustomId === activeTopicId;
    const s = await window.rce.deleteTopic(editingCustomId);
    applyState(s);
    applyTopic();
    if (wasActive) { lastDays = -1; tick(); fitToWindow(); }
    renderTopicGrid();
    showTopicForm(false);
  });
}

// fecha modal ao clicar fora
document.querySelectorAll('.modal-backdrop').forEach((bd) => {
  bd.addEventListener('click', (e) => { if (e.target === bd) bd.hidden = true; });
});

/* ---------------- responsivo: escala pra caber ---------------- */

// Mede a largura real de um texto no font atual do elemento (independe de
// centralização/overflow — scrollWidth não serve pra flex-item centralizado).
let _mctx = null;
function textWidth(text, elem) {
  if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
  const s = getComputedStyle(elem);
  _mctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
  try { if ('letterSpacing' in _mctx) _mctx.letterSpacing = s.letterSpacing; } catch (_) {}
  return _mctx.measureText(text).width;
}

// Ajusta o tamanho do título à largura da placa: subjects longos (ESTRELA,
// CREDENCIAIS, FIRST BLOOD...) encolhem pra não estourar a moldura.
function fitHeadline() {
  const inner = document.querySelector('.sign-inner');
  const subj = $('hlSubject');
  const an = $('hlAnStacked');
  const l1 = document.querySelector('.headline .l1');
  if (!inner || !subj || !l1) return;
  const cs = getComputedStyle(inner);
  const avail = inner.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 12;
  if (avail <= 0) return;
  // reseta pro tamanho base do CSS antes de medir
  subj.style.fontSize = '';
  l1.style.fontSize = '';
  // --- linha do subject (palavra vermelha grande, + "UMA/AN" no modo estreito) ---
  const anVisible = getComputedStyle(an).display !== 'none';
  const gap = 14; // .headline .l2 { gap: 14px }
  const anW = anVisible ? textWidth(an.textContent, an) + gap : 0;
  const availSubj = avail - anW;
  const sw = textWidth(subj.textContent, subj);
  if (sw > availSubj && availSubj > 0) {
    const base = parseFloat(getComputedStyle(subj).fontSize);
    subj.style.fontSize = Math.max(30, base * availSubj / sw * 0.97).toFixed(1) + 'px';
  }
  // --- linha 1 ("DAYS WITHOUT AN") — raramente estoura, mas garante ---
  const l1w = textWidth(l1.textContent, l1);
  if (l1w > avail) {
    const base1 = parseFloat(getComputedStyle(l1).fontSize);
    l1.style.fontSize = Math.max(24, base1 * avail / l1w * 0.98).toFixed(1) + 'px';
  }
}

function fitToWindow() {
  const scaler = $('signScaler');
  const sign = el.sign;
  if (!scaler || !sign) return;
  scaler.style.transform = 'translate(-50%, -50%) scale(1)';
  fitHeadline(); // ajusta o título à largura antes de medir a placa
  const w = sign.offsetWidth, h = sign.offsetHeight;
  const pad = 24;
  const availW = window.innerWidth - pad;
  const availH = window.innerHeight - pad;
  const scale = Math.min(1.35, availW / w, availH / h);
  scaler.style.transform = 'translate(-50%, -50%) scale(' + scale.toFixed(4) + ')';
  renderMatrix();
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
  wireTopicsModal();

  const s = await window.rce.get();
  applyState(s);
  applyLang();

  fitToWindow();
  window.addEventListener('resize', fitToWindow);

  tick();
  setInterval(tick, 1000);
  fitToWindow();
}

window.addEventListener('DOMContentLoaded', boot);
