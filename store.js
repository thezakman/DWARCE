'use strict';

// Lógica de estado + persistência (isolada do Electron para ser testável).

const fs = require('fs');

const DAY_MS = 86400000;

let storePath = null;

function init(p) { storePath = p; }

function defaultState() {
  return {
    incidentDate: new Date().toISOString(),
    recordDays: 0,
    history: [],
  };
}

function readState() {
  try {
    const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (typeof data.incidentDate !== 'string' || isNaN(Date.parse(data.incidentDate))) {
      data.incidentDate = new Date().toISOString();
    }
    if (typeof data.recordDays !== 'number' || data.recordDays < 0) data.recordDays = 0;
    if (!Array.isArray(data.history)) data.history = [];
    return data;
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

function withDays(s) { return { ...s, days: daysBetween(s.incidentDate) }; }

function get() { return withDays(readState()); }

function registerIncident(note) {
  const s = readState();
  const streak = daysBetween(s.incidentDate);
  if (streak > s.recordDays) s.recordDays = streak;
  s.history.unshift({
    date: new Date().toISOString(),
    streakDays: streak,
    note: (typeof note === 'string' ? note : '').slice(0, 200),
  });
  if (s.history.length > 500) s.history.length = 500;
  s.incidentDate = new Date().toISOString();
  writeState(s);
  return withDays(s);
}

function edit(payload) {
  const s = readState();
  if (payload && Number.isFinite(payload.days) && payload.days >= 0) {
    const d = Math.floor(payload.days);
    s.incidentDate = new Date(Date.now() - d * DAY_MS).toISOString();
  }
  if (payload && Number.isFinite(payload.recordDays) && payload.recordDays >= 0) {
    s.recordDays = Math.floor(payload.recordDays);
  }
  writeState(s);
  return withDays(s);
}

function clearHistory() {
  const s = readState();
  s.history = [];
  writeState(s);
  return withDays(s);
}

module.exports = {
  DAY_MS, init, readState, writeState, daysBetween,
  get, registerIncident, edit, clearHistory,
};
