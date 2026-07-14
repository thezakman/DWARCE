'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const store = require('./store');

function tmpFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rce-test-'));
  return path.join(dir, 'rce-board.json');
}
function seed(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }
function read(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
const DAY = 86400000;

test('primeira execução cria estado multi-tópico default', () => {
  const p = tmpFile();
  store.init(p);
  const s = store.get();
  assert.strictEqual(s.activeTopic, 'rce');
  assert.strictEqual(s.days, 0);
  assert.strictEqual(s.recordDays, 0);
  assert.deepStrictEqual(s.history, []);
  assert.deepStrictEqual(s.customTopics, []);
  const disk = read(p);
  assert.ok(disk.topics.rce, 'board rce existe no disco');
});

test('migração: shape antigo (single board) vira topics.rce preservando dados', () => {
  const p = tmpFile();
  store.init(p);
  const old = {
    incidentDate: new Date(Date.now() - 42 * DAY).toISOString(),
    recordDays: 259,
    history: [{ date: new Date().toISOString(), streakDays: 42, note: 'CVE-x' }],
  };
  seed(p, old);
  const s = store.get();
  assert.strictEqual(s.activeTopic, 'rce');
  assert.strictEqual(s.days, 42, 'dias preservados');
  assert.strictEqual(s.recordDays, 259, 'recorde preservado');
  assert.strictEqual(s.history.length, 1, 'histórico preservado');
  assert.strictEqual(s.history[0].note, 'CVE-x');
  // disco migrado
  const disk = read(p);
  assert.ok(disk.topics && disk.topics.rce, 'migrou pra topics.rce');
  assert.strictEqual(disk.incidentDate, undefined, 'campo antigo não fica no topo');
});

test('setTopic troca o foco e faz lazy-init do board', () => {
  const p = tmpFile();
  store.init(p);
  const s = store.setTopic('domain');
  assert.strictEqual(s.activeTopic, 'domain');
  assert.strictEqual(s.days, 0);
  const disk = read(p);
  assert.ok(disk.topics.domain, 'board domain criado');
  assert.ok(disk.topics.rce, 'board rce continua existindo');
});

test('registerIncident opera só no tópico ativo', () => {
  const p = tmpFile();
  store.init(p);
  // rce fica com 10 dias de seca
  store.edit({ days: 10 });
  // troca pra domain, seca de 3 dias
  store.setTopic('domain');
  store.edit({ days: 3 });
  const after = store.registerIncident('dc01.corp.local');
  assert.strictEqual(after.activeTopic, 'domain');
  assert.strictEqual(after.days, 0, 'domain zerou');
  assert.strictEqual(after.recordDays, 3, 'recorde de domain = 3');
  assert.strictEqual(after.history[0].note, 'dc01.corp.local');
  // rce intacto
  const rce = store.setTopic('rce');
  assert.strictEqual(rce.days, 10, 'rce continua com 10 dias');
  assert.strictEqual(rce.history.length, 0, 'histórico de rce vazio');
});

test('edit ajusta dias/recorde do tópico ativo', () => {
  const p = tmpFile();
  store.init(p);
  const s = store.edit({ days: 100, recordDays: 300 });
  assert.strictEqual(s.days, 100);
  assert.strictEqual(s.recordDays, 300);
});

test('addTopic cria custom + board e aparece em topicStats', () => {
  const p = tmpFile();
  store.init(p);
  const s = store.addTopic({
    polarity: 'good', emoji: '🦄',
    en: { subject: 'UNICORN', article: 'A' },
    pt: { subject: 'UNICÓRNIO', article: 'UM' },
  });
  assert.strictEqual(s.customTopics.length, 1);
  const def = s.customTopics[0];
  assert.match(def.id, /^custom-/);
  assert.strictEqual(def.emoji, '🦄');
  assert.strictEqual(def.en.subject, 'UNICORN');
  assert.ok(s.topicStats[def.id], 'stats do custom presentes');
});

test('updateTopic edita e deleteTopic remove (+ reset se ativo)', () => {
  const p = tmpFile();
  store.init(p);
  let s = store.addTopic({ polarity: 'good', emoji: '🦄', en: { subject: 'UNI' }, pt: { subject: 'UNI' } });
  const id = s.customTopics[0].id;
  s = store.updateTopic(id, { polarity: 'bad', emoji: '👾', en: { subject: 'ALIEN' }, pt: { subject: 'ET' } });
  assert.strictEqual(s.customTopics[0].emoji, '👾');
  assert.strictEqual(s.customTopics[0].polarity, 'bad');
  // ativa e deleta → volta pra rce
  store.setTopic(id);
  s = store.deleteTopic(id);
  assert.strictEqual(s.customTopics.length, 0);
  assert.strictEqual(s.activeTopic, 'rce', 'voltou pro rce ao deletar o ativo');
  const disk = read(p);
  assert.strictEqual(disk.topics[id], undefined, 'board do custom removido');
});

test('sanitiza board corrompido (data inválida, recorde negativo)', () => {
  const p = tmpFile();
  store.init(p);
  seed(p, {
    activeTopic: 'rce',
    topics: { rce: { incidentDate: 'lixo', recordDays: -5, history: 'x' } },
    customTopics: [],
  });
  const s = store.get();
  assert.strictEqual(s.days, 0);
  assert.strictEqual(s.recordDays, 0);
  assert.deepStrictEqual(s.history, []);
});

test('clearHistory limpa só o histórico do ativo', () => {
  const p = tmpFile();
  store.init(p);
  store.registerIncident('a');
  store.registerIncident('b');
  let s = store.get();
  assert.strictEqual(s.history.length, 2);
  s = store.clearHistory();
  assert.strictEqual(s.history.length, 0);
});
