'use strict';

/* ================================================================ *
 *  Achievements — troféus zoeiros/comemorativos.                    *
 *  check(stats) → bool. stats vem do store (agrega TODOS os focos). *
 *  Uma vez conquistado fica salvo (localStorage), mesmo que a       *
 *  condição de janela (ex.: "na semana") deixe de valer depois.     *
 * ================================================================ */

const ACHIEVEMENTS = [
  { id: 'first-blood', emoji: '🩸', check: (s) => s.total >= 1,
    en: { t: 'First Blood', d: 'Register your very first hit.' },
    pt: { t: 'Primeiro Sangue', d: 'Registre seu primeiro hit.' } },

  { id: 'hat-trick', emoji: '🎩', check: (s) => s.last24h >= 3,
    en: { t: 'Hat Trick', d: '3 hits in 24 hours.' },
    pt: { t: 'Hat Trick', d: '3 hits em 24 horas.' } },

  { id: 'on-fire', emoji: '🔥', check: (s) => s.last7d >= 5,
    en: { t: 'On Fire', d: '5 hits in a single week.' },
    pt: { t: 'Pegando Fogo', d: '5 hits numa única semana.' } },

  { id: 'spree', emoji: '💥', check: (s) => s.total >= 10,
    en: { t: 'Killing Spree', d: '10 hits total.' },
    pt: { t: 'Sequência Insana', d: '10 hits no total.' } },

  { id: 'centurion', emoji: '💯', check: (s) => s.total >= 100,
    en: { t: 'Centurion', d: '100 hits total. Absolute unit.' },
    pt: { t: 'Centurião', d: '100 hits no total. Lenda viva.' } },

  { id: 'polyglot', emoji: '🌐', check: (s) => s.distinct >= 5,
    en: { t: 'Polyglot', d: 'Score in 5 different focuses.' },
    pt: { t: 'Poliglota', d: 'Pontue em 5 focos diferentes.' } },

  { id: 'bug-swarm', emoji: '🐛', check: (s) => (s.byTopic.vuln || 0) >= 5,
    en: { t: 'Bug Swarm', d: 'Find 5 bugs.' },
    pt: { t: 'Enxame de Bugs', d: 'Ache 5 bugs.' } },

  { id: 'shell-collector', emoji: '🐚', check: (s) => (s.byTopic.shell || 0) >= 5,
    en: { t: 'Shell Collector', d: 'Pop 5 shells.' },
    pt: { t: 'Colecionador de Shells', d: 'Pegue 5 shells.' } },

  { id: 'dragon-slayer', emoji: '🐉', check: (s) => (s.byTopic.zeroday || 0) >= 1,
    en: { t: 'Dragon Slayer', d: 'Drop your first 0day.' },
    pt: { t: 'Caçador de Dragão', d: 'Ache seu primeiro 0day.' } },

  { id: 'comeback', emoji: '🧟', check: (s) => s.maxStreakBroken >= 100,
    en: { t: 'Comeback Kid', d: 'Break a 100+ day dry spell. Welcome back.' },
    pt: { t: 'Ressuscitou', d: 'Quebre uma seca de 100+ dias. Bem-vindo de volta.' } },

  // zoeira/perrengue — "a gente se fode mas ri"
  { id: 'star-magnet', emoji: '🌠', check: (s) => (s.last7dByTopic['shooting-star'] || 0) >= 5,
    en: { t: 'Star Magnet', d: 'Catch 5 shooting stars in one week. Rest in peace. 💀' },
    pt: { t: 'Ímã de Estrela', d: 'Leve 5 estrelas cadentes numa semana. Descanse em paz. 💀' } },

  { id: 'human-shield', emoji: '🛡️', check: (s) => (s.byTopic['shooting-star'] || 0) >= 10,
    en: { t: 'Human Shield', d: 'Absorb 10 shooting stars total. A true hero.' },
    pt: { t: 'Escudo Humano', d: 'Absorva 10 estrelas cadentes no total. Um verdadeiro herói.' } },

  // secreto — destravado por easter egg (Konami)
  { id: 'konami', emoji: '🕹️', secret: true, check: () => false,
    en: { t: 'Old School', d: 'You know the code. ↑↑↓↓←→←→ B A' },
    pt: { t: 'Old School', d: 'Você sabe o código. ↑↑↓↓←→←→ B A' } },
];

// ids cujo check(stats) passa agora
function evaluate(stats) {
  if (!stats) return [];
  return ACHIEVEMENTS.filter((a) => { try { return a.check(stats); } catch (_) { return false; } }).map((a) => a.id);
}

function byId(id) { return ACHIEVEMENTS.find((a) => a.id === id); }

window.ACHV = { ACHIEVEMENTS, evaluate, byId };
