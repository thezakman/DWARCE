'use strict';

/* ================================================================ *
 *  Tópicos / focos                                                  *
 *  Cada def é enxuta: id, polaridade, emoji e {subject, article,    *
 *  long} por idioma. O resto (headline, botão, tagline, verdict,    *
 *  placeholder, log) é DERIVADO por helpers — com overrides         *
 *  opcionais por tópico quando faz graça.                           *
 *                                                                    *
 *  polarity:                                                         *
 *   'good' = conquista  → 0 dias = sinistro/comemora; +dias = ferrugem
 *   'bad'  = perrengue  → +dias sem = paz/bom; pegar = sofrimento    *
 * ================================================================ */

const BUILTIN_TOPICS = [
  { id: 'rce', polarity: 'good', emoji: '💥',
    en: { subject: 'RCE', article: 'AN', long: 'RCE' },
    pt: { subject: 'RCE', article: 'UM', long: 'RCE' } },

  { id: 'domain', polarity: 'good', emoji: '🏰',
    en: { subject: 'DOMAIN', article: 'A', long: 'domain' },
    pt: { subject: 'DOMÍNIO', article: 'UM', long: 'domínio ownado' } },

  { id: 'admin-pass', polarity: 'good', emoji: '🔑',
    en: { subject: 'ADMIN', article: 'AN', long: 'admin' },
    pt: { subject: 'ADMIN', article: 'UM', long: 'admin' } },

  { id: 'ferias', polarity: 'good', emoji: '🏖️',
    en: { subject: 'VACATION', article: 'A', long: 'vacation' },
    pt: { subject: 'FÉRIAS', article: '', long: 'férias' },
    overrides: {
      en: {
        button: 'TOOK A VACATION! 🏖️',
        tagline: (n) => `<b>${n}</b> day${n === 1 ? '' : 's'} without a real break`,
        placeholder: 'where to? / how many days...',
        logVerb: (d) => `🏖️ Finally rested after ${d} day${d === 1 ? '' : 's'} of grind`,
        verdict: (n) => n === 0 ? { text: 'JUST BACK — recharged', cls: 'fresh' }
          : n <= 13 ? { text: 'still fresh', cls: 'sharp' }
          : n <= 45 ? { text: 'could use a break', cls: 'rusty' }
          : n <= 99 ? { text: 'running on fumes', cls: 'rusty' }
          : { text: 'BURNOUT — take a vacation!', cls: 'washed' },
        imTitle: '🏖️ Time off!',
        imDesc: 'Nice, you actually rested. The grind counter resets. Where did you go? (optional)',
        imConfirm: 'Log it 🏖️',
      },
      pt: {
        button: 'PEGUEI FÉRIAS! 🏖️',
        tagline: (n) => `Faz <b>${n}</b> dia${n === 1 ? '' : 's'} sem tirar férias`,
        placeholder: 'pra onde? / quantos dias...',
        logVerb: (d) => `🏖️ Descansou depois de ${d} dia${d === 1 ? '' : 's'} de correria`,
        verdict: (n) => n === 0 ? { text: 'RECÉM-CHEGADO — renovado', cls: 'fresh' }
          : n <= 13 ? { text: 'ainda de boa', cls: 'sharp' }
          : n <= 45 ? { text: 'precisando dar um tempo', cls: 'rusty' }
          : n <= 99 ? { text: 'no limite', cls: 'rusty' }
          : { text: 'BURNOUT — tira férias já!', cls: 'washed' },
        imTitle: '🏖️ Descanso!',
        imDesc: 'Boa, você descansou de verdade. O contador de correria zera. Pra onde foi? (opcional)',
        imConfirm: 'Registrar 🏖️',
      },
    } },

  { id: 'vuln', polarity: 'good', emoji: '🐛',
    en: { subject: 'BUG', article: 'A', long: 'bug' },
    pt: { subject: 'BUG', article: 'UM', long: 'bug' },
    overrides: {
      en: { button: 'FOUND A BUG! 🐛' },
      pt: { button: 'ACHEI UM BUG! 🐛' },
    } },

  { id: 'shooting-star', polarity: 'bad', emoji: '🌠',
    en: { subject: 'STAR', article: 'A', long: 'shooting star' },
    pt: { subject: 'ESTRELA', article: 'UMA', long: 'estrela cadente' },
    overrides: {
      en: {
        button: 'GOT DUMPED ON! 🌠',
        tagline: (n) => `<b>${n}</b> day${n === 1 ? '' : 's'} of peace — no last-minute fire drills`,
        placeholder: 'what got dumped on you? / who sent it...',
        logVerb: (d) => `🌠 Star landed after ${d} calm day${d === 1 ? '' : 's'}`,
        imTitle: '🌠 A star has fallen',
        imDesc: 'Someone dropped a last-minute fire drill on you. The peace counter resets. What was it? (optional)',
        imConfirm: 'Log the pain 😩',
      },
      pt: {
        button: 'CAIU UMA ESTRELA! 🌠',
        tagline: (n) => `<b>${n}</b> dia${n === 1 ? '' : 's'} de paz — nenhum trampo de última hora`,
        placeholder: 'o que caiu? / quem mandou...',
        logVerb: (d) => `🌠 Estrela caiu depois de ${d} dia${d === 1 ? '' : 's'} de paz`,
        imTitle: '🌠 Caiu uma estrela cadente',
        imDesc: 'Alguém te mandou um trampo de última hora. O contador de paz zera. O que foi? (opcional)',
        imConfirm: 'Registrar o perrengue 😩',
      },
    } },

  { id: 'zeroday', polarity: 'good', emoji: '🐉',
    en: { subject: '0DAY', article: 'A', long: '0day' },
    pt: { subject: '0DAY', article: 'UM', long: '0day' } },

  { id: 'shell', polarity: 'good', emoji: '🐚',
    en: { subject: 'SHELL', article: 'A', long: 'shell' },
    pt: { subject: 'SHELL', article: 'UMA', long: 'shell' } },

  { id: 'bounty', polarity: 'good', emoji: '💰',
    en: { subject: 'BOUNTY', article: 'A', long: 'bounty' },
    pt: { subject: 'BOUNTY', article: 'UMA', long: 'bounty' } },

  { id: 'root', polarity: 'good', emoji: '👑',
    en: { subject: 'ROOT', article: 'A', long: 'root shell' },
    pt: { subject: 'ROOT', article: 'UM', long: 'root' } },

  { id: 'xss', polarity: 'good', emoji: '🎯',
    en: { subject: 'XSS', article: 'AN', long: 'stored XSS' },
    pt: { subject: 'XSS', article: 'UM', long: 'XSS' } },

  { id: 'cve', polarity: 'good', emoji: '🏷️',
    en: { subject: 'CVE', article: 'A', long: 'CVE' },
    pt: { subject: 'CVE', article: 'UM', long: 'CVE' } },

  { id: 'firstblood', polarity: 'good', emoji: '🩸',
    en: { subject: '1ST BLOOD', article: 'A', long: 'first blood' },
    pt: { subject: 'FIRST BLOOD', article: 'UM', long: 'first blood' } },

  { id: 'flag', polarity: 'good', emoji: '🚩',
    en: { subject: 'FLAG', article: 'A', long: 'flag' },
    pt: { subject: 'FLAG', article: 'UMA', long: 'flag' } },

  { id: 'creds', polarity: 'good', emoji: '📇',
    en: { subject: 'CREDS', article: 'SOME', long: 'creds' },
    pt: { subject: 'CREDENCIAIS', article: 'UMAS', long: 'credenciais' } },
];

/* ---------------- escadas de verdict por polaridade ---------------- */

const VERDICT_LADDER = {
  good: {
    en: (n) => n === 0 ? { text: "SINISTER — you're on fire", cls: 'fresh' }
      : n <= 6 ? { text: 'still sharp', cls: 'sharp' }
      : n <= 29 ? { text: 'getting rusty', cls: 'rusty' }
      : n <= 99 ? { text: 'seriously rusty', cls: 'rusty' }
      : { text: 'not a hacker anymore?', cls: 'washed' },
    pt: (n) => n === 0 ? { text: 'SINISTRO — tá voando', cls: 'fresh' }
      : n <= 6 ? { text: 'ainda afiado', cls: 'sharp' }
      : n <= 29 ? { text: 'começando a enferrujar', cls: 'rusty' }
      : n <= 99 ? { text: 'enferrujando feio', cls: 'rusty' }
      : { text: 'não é mais hacker?', cls: 'washed' },
  },
  // 'bad' = perrengue: muitos dias SEM = ótimo; 0 = acabou de levar
  bad: {
    en: (n) => n === 0 ? { text: 'ugh — just got hit', cls: 'washed' }
      : n <= 6 ? { text: 'catching your breath', cls: 'rusty' }
      : n <= 29 ? { text: 'enjoying the calm', cls: 'sharp' }
      : n <= 99 ? { text: 'blissful silence', cls: 'fresh' }
      : { text: 'is this... peace?', cls: 'fresh' },
    pt: (n) => n === 0 ? { text: 'eita — acabou de cair', cls: 'washed' }
      : n <= 6 ? { text: 'recuperando o fôlego', cls: 'rusty' }
      : n <= 29 ? { text: 'curtindo a paz', cls: 'sharp' }
      : n <= 99 ? { text: 'silêncio abençoado', cls: 'fresh' }
      : { text: 'isso é... paz?', cls: 'fresh' },
  },
};

/* ---------------- derivação (com overrides opcionais) ---------------- */

// Copies base por idioma que NÃO dependem do tópico específico.
const BASE = {
  en: {
    l1: 'DAYS WITHOUT',
    recLabel: (bad) => bad ? 'LONGEST PEACE STREAK' : 'LONGEST DRY SPELL',
    recDays: 'DAYS',
    imTitle: (bad) => bad ? '😩 Incoming!' : '🎉 Nice pop!',
    imDesc: (bad) => bad
      ? 'The peace counter resets to zero. What landed on you? (optional)'
      : 'Respect. The rust counter resets to zero. What did you pop? (optional)',
    imConfirm: (bad) => bad ? 'Log it 😩' : 'Log it 🔥',
  },
  pt: {
    l1: 'DIAS SEM',
    recLabel: (bad) => bad ? 'MAIOR SEQUÊNCIA DE PAZ' : 'MAIOR SECA',
    recDays: 'DIAS',
    imTitle: (bad) => bad ? '😩 Chegando!' : '🎉 Mandou bem!',
    imDesc: (bad) => bad
      ? 'O contador de paz zera. O que caiu no seu colo? (opcional)'
      : 'Respeito. O contador de ferrugem zera. O que você mandou? (opcional)',
    imConfirm: (bad) => bad ? 'Registrar 😩' : 'Registrar 🔥',
  },
};

function ov(topic, lang, key) {
  return topic.overrides && topic.overrides[lang] && topic.overrides[lang][key];
}

// Retorna o "pacote" de textos do tópico p/ um idioma — tudo já resolvido.
function topicCopy(topic, lang) {
  const L = topic[lang] || topic.en;
  const base = BASE[lang] || BASE.en;
  const bad = topic.polarity === 'bad';
  const subj = L.subject;
  const art = L.article;
  const long = L.long || subj;

  const defButton = lang === 'pt' ? `PEGUEI ${art} ${subj}!` : `POPPED ${art} ${subj}!`;
  const defTagline = bad
    ? (lang === 'pt'
      ? (n) => `<b>${n}</b> dia${n === 1 ? '' : 's'} sem ${long}`
      : (n) => `<b>${n}</b> day${n === 1 ? '' : 's'} without ${long}`)
    : (lang === 'pt'
      ? (n) => `Faz <b>${n}</b> dia${n === 1 ? '' : 's'} que você não pega ${long}`
      : (n) => `It has been <b>${n}</b> day${n === 1 ? '' : 's'} since your last ${long}`);
  const defPlaceholder = lang === 'pt'
    ? 'CVE-2026-XXXX / alvo / serviço...'
    : 'CVE-2026-XXXX / target / service...';
  const defLogVerb = bad
    ? (lang === 'pt' ? (d) => `😩 Caiu depois de ${d} dia${d === 1 ? '' : 's'} de paz`
                     : (d) => `😩 Landed after ${d} calm day${d === 1 ? '' : 's'}`)
    : (lang === 'pt' ? (d) => `🎯 Pegou depois de ${d} dia${d === 1 ? '' : 's'} de seca`
                     : (d) => `🎯 Popped after a ${d}-day dry spell`);

  return {
    emoji: topic.emoji,
    polarity: topic.polarity,
    l1: base.l1,
    article: art,
    subject: subj,
    long,
    recLabel: base.recLabel(bad),
    recDays: base.recDays,
    button: ov(topic, lang, 'button') || defButton,
    tagline: ov(topic, lang, 'tagline') || defTagline,
    placeholder: ov(topic, lang, 'placeholder') || defPlaceholder,
    logVerb: ov(topic, lang, 'logVerb') || defLogVerb,
    verdict: ov(topic, lang, 'verdict') || VERDICT_LADDER[bad ? 'bad' : 'good'][lang] || VERDICT_LADDER.good.en,
    imTitle: ov(topic, lang, 'imTitle') || base.imTitle(bad),
    imDesc: ov(topic, lang, 'imDesc') || base.imDesc(bad),
    imConfirm: ov(topic, lang, 'imConfirm') || base.imConfirm(bad),
  };
}

// Nome curto amigável do tópico (pro chip/picker) — usa o subject do idioma.
function topicName(topic, lang) {
  const L = topic[lang] || topic.en;
  return L.subject;
}

window.TOPICS = { BUILTIN_TOPICS, topicCopy, topicName };
