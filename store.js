'use strict';

// Lógica de estado + persistência (isolada do Electron para ser testável).
// Modelo multi-tópico: cada "foco" (RCE, domínio, SQLi, estrela cadente...) tem
// seu próprio contador/recorde/histórico. Tópicos customizados moram em customTopics.

const fs = require('fs');

const DAY_MS = 86400000;

let storePath = null;

function init(p) { storePath = p; }

// Board zerado de um tópico (estado, não definição).
function freshBoard() {
  return {
    incidentDate: new Date().toISOString(),
    recordDays: 0,
    history: [],
  };
}

// Saneia um board isolado (parse de data, recordDays>=0, history array).
function sanitizeBoard(b) {
  const board = (b && typeof b === 'object') ? b : {};
  if (typeof board.incidentDate !== 'string' || isNaN(Date.parse(board.incidentDate))) {
    board.incidentDate = new Date().toISOString();
  }
  if (typeof board.recordDays !== 'number' || board.recordDays < 0) board.recordDays = 0;
  if (!Array.isArray(board.history)) board.history = [];
  return board;
}

function defaultState() {
  return {
    activeTopic: 'rce',
    topics: { rce: freshBoard() },
    customTopics: [],
  };
}

// Migra shape antigo (single board { incidentDate, recordDays, history })
// para o novo (multi-tópico), preservando os dados de RCE do usuário.
function migrate(data) {
  if (data && typeof data === 'object' && !data.topics && data.incidentDate) {
    return {
      activeTopic: 'rce',
      topics: { rce: sanitizeBoard(data) },
      customTopics: [],
    };
  }
  return data;
}

function sanitizeState(data) {
  const s = (data && typeof data === 'object') ? migrate(data) : defaultState();
  if (!s.topics || typeof s.topics !== 'object') s.topics = { rce: freshBoard() };
  for (const id of Object.keys(s.topics)) s.topics[id] = sanitizeBoard(s.topics[id]);
  if (!Array.isArray(s.customTopics)) s.customTopics = [];
  if (typeof s.activeTopic !== 'string' || !s.activeTopic) s.activeTopic = 'rce';
  // garante board pro tópico ativo (lazy-init)
  if (!s.topics[s.activeTopic]) s.topics[s.activeTopic] = freshBoard();
  return s;
}

function readState() {
  try {
    const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    const legacy = data && typeof data === 'object' && !data.topics;
    const s = sanitizeState(data);
    if (legacy) writeState(s); // persiste a migração de vez
    return s;
  } catch (_) {
    const s = defaultState();
    writeState(s);
    return s;
  }
}

// Escrita atômica: grava em .tmp e renomeia.
function writeState(state) {
  const tmp = storePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmp, storePath);
  return state;
}

function daysBetween(fromISO, now = Date.now()) {
  const elapsed = now - Date.parse(fromISO);
  if (isNaN(elapsed) || elapsed < 0) return 0;
  return Math.floor(elapsed / DAY_MS);
}

// Garante que o tópico ativo tenha board (lazy-init) e o retorna.
function activeBoard(s) {
  if (!s.topics[s.activeTopic]) s.topics[s.activeTopic] = freshBoard();
  return s.topics[s.activeTopic];
}

// Resumo por tópico (dias atuais + recorde) pro picker mostrar sem N chamadas.
function topicStats(s) {
  const out = {};
  for (const id of Object.keys(s.topics)) {
    const b = s.topics[id];
    out[id] = { days: daysBetween(b.incidentDate), recordDays: b.recordDays };
  }
  return out;
}

// Projeção enviada ao renderer: board ativo + metadados de tópicos.
function project(s) {
  const b = activeBoard(s);
  return {
    activeTopic: s.activeTopic,
    incidentDate: b.incidentDate,
    recordDays: b.recordDays,
    history: b.history,
    days: daysBetween(b.incidentDate),
    customTopics: s.customTopics,
    topicStats: topicStats(s),
  };
}

function get() { return project(readState()); }

function setTopic(id) {
  const s = readState();
  if (typeof id === 'string' && id) {
    s.activeTopic = id;
    if (!s.topics[id]) s.topics[id] = freshBoard(); // lazy-init
    writeState(s);
  }
  return project(s);
}

function registerIncident(note) {
  const s = readState();
  const b = activeBoard(s);
  const streak = daysBetween(b.incidentDate);
  if (streak > b.recordDays) b.recordDays = streak;
  b.history.unshift({
    date: new Date().toISOString(),
    streakDays: streak,
    note: (typeof note === 'string' ? note : '').slice(0, 200),
  });
  if (b.history.length > 500) b.history.length = 500;
  b.incidentDate = new Date().toISOString();
  writeState(s);
  return project(s);
}

function edit(payload) {
  const s = readState();
  const b = activeBoard(s);
  if (payload && Number.isFinite(payload.days) && payload.days >= 0) {
    const d = Math.floor(payload.days);
    b.incidentDate = new Date(Date.now() - d * DAY_MS).toISOString();
  }
  if (payload && Number.isFinite(payload.recordDays) && payload.recordDays >= 0) {
    b.recordDays = Math.floor(payload.recordDays);
  }
  writeState(s);
  return project(s);
}

function clearHistory() {
  const s = readState();
  activeBoard(s).history = [];
  writeState(s);
  return project(s);
}

/* ---------------- CRUD de tópicos customizados ---------------- */

// Normaliza uma definição de tópico vinda do renderer (só campos conhecidos).
function sanitizeDef(def, id) {
  const clampLang = (l) => ({
    subject: String((l && l.subject) || '').slice(0, 24),
    article: String((l && l.article) || '').slice(0, 8),
    long: String((l && l.long) || (l && l.subject) || '').slice(0, 60),
  });
  return {
    id,
    polarity: def && def.polarity === 'bad' ? 'bad' : 'good',
    emoji: String((def && def.emoji) || '⭐').slice(0, 8),
    en: clampLang(def && def.en),
    pt: clampLang(def && def.pt),
  };
}

function addTopic(def) {
  const s = readState();
  const n = s.customTopics.length + 1;
  // id determinístico e único (evita Date.now/random pra ser testável)
  let base = 'custom-' + n, id = base, i = 1;
  const taken = new Set([...Object.keys(s.topics), ...s.customTopics.map((t) => t.id)]);
  while (taken.has(id)) { id = base + '-' + (++i); }
  const clean = sanitizeDef(def, id);
  s.customTopics.push(clean);
  s.topics[id] = freshBoard(); // já cria o board pra aparecer nas stats
  writeState(s);
  return project(s);
}

function updateTopic(id, def) {
  const s = readState();
  const idx = s.customTopics.findIndex((t) => t.id === id);
  if (idx >= 0) {
    s.customTopics[idx] = sanitizeDef(def, id);
    writeState(s);
  }
  return project(s);
}

function deleteTopic(id) {
  const s = readState();
  const idx = s.customTopics.findIndex((t) => t.id === id);
  if (idx >= 0) {
    s.customTopics.splice(idx, 1);
    delete s.topics[id];
    if (s.activeTopic === id) s.activeTopic = 'rce';
    if (!s.topics[s.activeTopic]) s.topics[s.activeTopic] = freshBoard();
    writeState(s);
  }
  return project(s);
}

module.exports = {
  DAY_MS, init, readState, writeState, daysBetween,
  get, setTopic, registerIncident, edit, clearHistory,
  addTopic, updateTopic, deleteTopic,
  // exportados p/ teste
  migrate, sanitizeState, defaultState,
};
