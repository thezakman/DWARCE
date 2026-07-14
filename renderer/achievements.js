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

  // --- volume: escala de total ---
  { id: 'double-digits', emoji: '🔢', check: (s) => s.total >= 50,
    en: { t: 'Double Digits', d: '50 hits total.' },
    pt: { t: 'Dois Dígitos', d: '50 hits no total.' } },

  { id: 'unstoppable', emoji: '🚀', check: (s) => s.last7d >= 10,
    en: { t: 'Unstoppable', d: '10 hits in a single week.' },
    pt: { t: 'Imparável', d: '10 hits numa única semana.' } },

  { id: 'marathon', emoji: '🏃', check: (s) => s.last24h >= 10,
    en: { t: 'Marathon', d: '10 hits in 24 hours. Sleep is optional.' },
    pt: { t: 'Maratona', d: '10 hits em 24 horas. Dormir é opcional.' } },

  { id: 'big-day', emoji: '📅', check: (s) => s.maxInDay >= 10,
    en: { t: 'Big Day', d: '10 hits in one calendar day.' },
    pt: { t: 'Dia Cheio', d: '10 hits num único dia.' } },

  // --- hábitos / horários ---
  { id: 'note-taker', emoji: '📝', check: (s) => s.withNote >= 10,
    en: { t: 'Note Taker', d: 'Log 10 hits with a note. Document everything.' },
    pt: { t: 'Anotador', d: 'Registre 10 hits com nota. Documente tudo.' } },

  { id: 'night-owl', emoji: '🦉', check: (s) => s.night >= 1,
    en: { t: 'Night Owl', d: 'Score between midnight and 5am.' },
    pt: { t: 'Coruja', d: 'Pontue entre meia-noite e 5h.' } },

  { id: 'weekend-warrior', emoji: '🍺', check: (s) => s.weekend >= 1,
    en: { t: 'Weekend Warrior', d: 'Score on a weekend. No days off.' },
    pt: { t: 'Guerreiro de FDS', d: 'Pontue num fim de semana. Sem folga.' } },

  { id: 'omnivore', emoji: '🍽️', check: (s) => s.distinct >= 10,
    en: { t: 'Omnivore', d: 'Score in 10 different focuses.' },
    pt: { t: 'Onívoro', d: 'Pontue em 10 focos diferentes.' } },

  { id: 'creator', emoji: '🎨', check: (s) => s.customCount >= 1,
    en: { t: 'Creator', d: 'Craft your own custom focus.' },
    pt: { t: 'Criador', d: 'Crie seu próprio foco custom.' } },

  // --- maestria por foco ---
  { id: 'rce-master', emoji: '💥', check: (s) => (s.byTopic.rce || 0) >= 10,
    en: { t: 'RCE Master', d: 'Pop 10 RCEs.' },
    pt: { t: 'Mestre do RCE', d: 'Pegue 10 RCEs.' } },

  { id: 'exterminator', emoji: '🪳', check: (s) => (s.byTopic.vuln || 0) >= 25,
    en: { t: 'Exterminator', d: 'Squash 25 bugs.' },
    pt: { t: 'Exterminador', d: 'Esmague 25 bugs.' } },

  { id: 'the-king', emoji: '👑', check: (s) => (s.byTopic.root || 0) >= 5,
    en: { t: 'The King', d: 'Get root 5 times.' },
    pt: { t: 'O Rei', d: 'Vire root 5 vezes.' } },

  { id: 'bounty-hunter', emoji: '💰', check: (s) => (s.byTopic.bounty || 0) >= 5,
    en: { t: 'Bounty Hunter', d: 'Cash 5 bounties.' },
    pt: { t: 'Caça-Recompensas', d: 'Fature 5 bounties.' } },

  { id: 'flag-collector', emoji: '🚩', check: (s) => (s.byTopic.flag || 0) >= 10,
    en: { t: 'Flag Collector', d: 'Capture 10 flags.' },
    pt: { t: 'Colecionador de Flags', d: 'Capture 10 flags.' } },

  { id: 'domain-admin', emoji: '🏰', check: (s) => (s.byTopic.domain || 0) >= 5,
    en: { t: 'Domain Admin', d: 'Own 5 domains.' },
    pt: { t: 'Domain Admin', d: 'Owne 5 domínios.' } },

  { id: 'xss-artist', emoji: '🎯', check: (s) => (s.byTopic.xss || 0) >= 5,
    en: { t: 'XSS Artist', d: 'Pop 5 XSS.' },
    pt: { t: 'Artista do XSS', d: 'Pegue 5 XSS.' } },

  { id: 'well-rested', emoji: '🏖️', check: (s) => (s.byTopic.ferias || 0) >= 3,
    en: { t: 'Well Rested', d: 'Actually take 3 vacations. Self-care!' },
    pt: { t: 'Descansado', d: 'Tire 3 férias de verdade. Se cuida!' } },

  // --- mais volume / consistência / lendas ---
  { id: 'getting-started', emoji: '🌱', check: (s) => s.total >= 5,
    en: { t: 'Getting Started', d: '5 hits total. Warmed up.' },
    pt: { t: 'Esquentando', d: '5 hits no total. Aquecido.' } },

  { id: 'legend', emoji: '🐐', check: (s) => s.total >= 500,
    en: { t: 'Legend', d: '500 hits total. G.O.A.T.' },
    pt: { t: 'Lenda', d: '500 hits no total. O MELHOR.' } },

  { id: 'high-roller', emoji: '🎰', check: (s) => s.maxStreakBroken >= 1337,
    en: { t: 'High Roller', d: 'Break a 1337-day dry spell. Leet.' },
    pt: { t: 'Figurão', d: 'Quebre uma seca de 1337 dias. Leet.' } },

  { id: 'insomniac', emoji: '🌙', check: (s) => s.night >= 5,
    en: { t: 'Insomniac', d: '5 hits after midnight. Sleep? Never heard of it.' },
    pt: { t: 'Insone', d: '5 hits depois da meia-noite. Dormir? Nunca ouvi falar.' } },

  { id: 'consistent', emoji: '📆', check: (s) => s.distinctDays >= 7,
    en: { t: 'Consistent', d: 'Score on 7 different days.' },
    pt: { t: 'Consistente', d: 'Pontue em 7 dias diferentes.' } },

  { id: 'star-survivor', emoji: '☄️', check: (s) => (s.byTopic['shooting-star'] || 0) >= 25,
    en: { t: 'Star Survivor', d: 'Endure 25 shooting stars. Still standing.' },
    pt: { t: 'Sobrevivente', d: 'Aguente 25 estrelas cadentes. Ainda de pé.' } },

  { id: 'full-house', emoji: '🃏', check: (s) => s.distinct >= 15,
    en: { t: 'Full House', d: 'Score in all 15 built-in focuses.' },
    pt: { t: 'Casa Cheia', d: 'Pontue nos 15 focos nativos.' } },

  { id: 'hoarder', emoji: '🗄️', check: (s) => s.customCount >= 3,
    en: { t: 'Hoarder', d: 'Create 3 custom focuses.' },
    pt: { t: 'Acumulador', d: 'Crie 3 focos customizados.' } },

  // --- secretos (easter eggs) ---
  { id: 'white-rabbit', emoji: '🐇', secret: true, check: () => false,
    en: { t: 'Follow the White Rabbit', d: 'You saw the code behind it all.' },
    pt: { t: 'Siga o Coelho Branco', d: 'Você viu o código por trás de tudo.' } },

  { id: 'konami', emoji: '🕹️', secret: true, check: () => false,
    en: { t: 'Old School', d: 'You know the code. ↑↑↓↓←→←→ B A' },
    pt: { t: 'Old School', d: 'Você sabe o código. ↑↑↓↓←→←→ B A' } },

  { id: 'pong-master', emoji: '🏓', secret: true, check: () => false,
    en: { t: 'Pong Master', d: 'Beat the machine at its own game.' },
    pt: { t: 'Mestre do Pong', d: 'Vença a máquina no próprio jogo dela.' } },
];

// ids cujo check(stats) passa agora
function evaluate(stats) {
  if (!stats) return [];
  return ACHIEVEMENTS.filter((a) => { try { return a.check(stats); } catch (_) { return false; } }).map((a) => a.id);
}

function byId(id) { return ACHIEVEMENTS.find((a) => a.id === id); }

window.ACHV = { ACHIEVEMENTS, evaluate, byId };
