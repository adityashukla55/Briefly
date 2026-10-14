import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COUNTRIES, inLanguage, languageOf, languagesOf } from '../web/src/countries/index.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { templateLetters } from '../web/src/replies.js';
import { datePlaceholder } from '../web/src/dates.js';

export const SITE = 'https://brieflyapp.pages.dev';

const DEADLINE_WORDS = {
  de: ['Frist', 'bis zum', 'innerhalb'],
  fr: ['délai', 'avant le', 'au plus tard'],
  es: ['plazo', 'hasta el', 'días hábiles'],
  it: ['termine', 'entro il', 'scadenza'],
  nl: ['termijn', 'uiterlijk', 'binnen'],
  pl: ['termin', 'do dnia', 'w terminie'],
  pt: ['prazo', 'até', 'data limite'],
  en: ['deadline', 'by', 'within'],
};

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function namesOf(country, joiner = 'and') {
  const names = languagesOf(country).map((id) => LANGUAGES[id].name);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} ${joiner} ${names.at(-1)}` : names[0];
}

function flag(country, extra = '') {
  return `<img class="flag${extra}" src="/icons/flags/${country.id}.svg" alt="" width="21" height="14">`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function breadcrumbs(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], index) => ({ '@type': 'ListItem', position: index + 1, name, item: `${SITE}${path}` })),
  };
}

function faq(entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
  };
}

function cta(country, text = 'Check your letter now') {
  const query = country ? `?country=${country.id}` : '';
  return `<aside class="page-cta">
  <p class="page-cta-title">${esc(text)}</p>
  <p>Take a photo or open a PDF. Briefly finds the deadline, the amount and what to do — in plain English. No account, no upload, works offline.</p>
  <a class="button primary" href="/${query}">Open Briefly — it’s free</a>
</aside>`;
}

function layout({ path, title, description, crumbs, body, schema = [], noIndex = false }) {
  const nav = crumbs.length > 1
    ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map(([name, href], index) => (index === crumbs.length - 1 ? `<span>${esc(name)}</span>` : `<a href="${href}">${esc(name)}</a>`)).join(' › ')}</nav>`
    : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noIndex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE}${path}">`}
  <meta name="theme-color" content="#1f2a44">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${SITE}${path}">
  <meta property="og:image" content="${SITE}/icons/icon-512.png">
  <link rel="stylesheet" href="/styles.css">
  <script type="module" src="/src/feedback.js"></script>
  ${[breadcrumbs(crumbs), ...schema].map(jsonLd).join('\n  ')}
</head>
<body class="page">
  <header class="topbar">
    <a class="brand" href="/" aria-label="Briefly home">
      <img src="/icons/icon.svg" alt="" width="32" height="32">
      <span>Briefly</span>
    </a>
    <a class="button primary small" href="/">Open Briefly</a>
  </header>
  <main class="prose">
    ${nav}
    ${body}
  </main>
  ${footer()}
</body>
</html>
`;
}

function footer() {
  const countries = COUNTRIES.map((country) => `<a href="/${country.slug}/">${flag(country)}${esc(country.name)}</a>`).join(' · ');
  const tools = TOOLS.map((tool) => `<a href="/${tool.slug}/">${esc(tool.short)}</a>`).join(' · ');
  return `<footer class="footer">
    <nav class="footer-links" aria-label="About Briefly">
      <a class="footer-link" href="/privacy/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>Privacy</a>
      <a class="footer-link" href="https://github.com/adityashukla55/Briefly"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/></svg>Open source</a>
      <button class="footer-link" type="button" data-feedback><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H10l-6 4V5z"/><path d="M12 8v3.5M12 14h.01"/></svg>Report a problem</button>
    </nav>
    <p><strong>Letters from:</strong> ${countries}</p>
    <p><strong>Tools:</strong> ${tools}</p>
    <p><strong>Not legal advice.</strong> Briefly helps you understand a letter. Always check the original, and ask the sender or a free advice centre if you are unsure.</p>
    <div class="support">
      <p>Briefly is free and has no ads. If it helped you, you can buy me a coffee.</p>
      <a class="coffee" href="https://buymeacoffee.com/adi.shukla41" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="steam" d="M8 2.5c-.6 1 .6 1.6 0 2.6M12 2.5c-.6 1 .6 1.6 0 2.6M16 2.5c-.6 1 .6 1.6 0 2.6"/><path class="cup" d="M4 8h13v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8z"/><path class="handle" d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/></svg>
        Buy me a coffee
      </a>
    </div>
  </footer>`;
}

function relatedTerms(country, text, limit = 8) {
  return country.glossary.filter((entry) => entry.pattern.test(text)).slice(0, limit);
}

function wordLink(country, entry) {
  return `<a href="/${country.slug}/words/${entry.slug}/">${esc(entry.term)}</a>`;
}

function objectionWords(country) {
  return country.objection.map((entry) => `“${entry.word}”`).join(', ');
}

function deadlineAnswer(country) {
  const language = languageOf(country);
  return `It depends on the letter. Look for words like ${(country.deadlineWords ?? DEADLINE_WORDS[language.id]).map((word) => `“${word}”`).join(', ')} — they mark the deadline. ${country.deliveryNote} To object, the letter usually names the way to do it (${objectionWords(country)}).`;
}

function countryPage(country) {
  const language = languageOf(country);
  const path = `/${country.slug}/`;
  const offices = country.senders.map((sender) => `<li><a href="/${country.slug}/${sender.slug}/">${esc(sender.local)}</a> — ${esc(sender.name)}. ${esc(sender.about)}</li>`).join('\n');
  const kinds = country.kinds.filter((kind) => !kind.weight || kind.weight >= 1).map((kind) => `<li><strong>${esc(kind.local)}</strong> — ${esc(kind.name)}. ${esc(kind.about)}</li>`).join('\n');
  const words = country.glossary.slice(0, 18).map((entry) => wordLink(country, entry)).join(', ');
  const templates = templatePages(country).map((page) => `<li><a href="${page.path}">${esc(page.title.split(' – ')[0])}</a></li>`).join('\n');
  const questions = [
    [`How long do I have to answer an official letter in ${country.inName ?? country.name}?`, deadlineAnswer(country)],
    language.model
      ? [`Can I understand a ${namesOf(country, 'or')} letter without speaking ${namesOf(country, 'or')}?`, `Yes. Take a photo of the letter with Briefly. It reads the ${namesOf(country, 'or')} text on your device, explains it in plain English, finds deadlines and amounts, and can translate the whole letter.`]
      : [`How does Briefly help with official letters in ${country.inName ?? country.name}?`, 'Take a photo of the letter with Briefly. It explains the letter in plain words, finds the deadline and the amount, tells you what to do and gives you a ready-made reply.'],
    ['Is my letter uploaded anywhere?', 'No. Briefly runs completely in your browser. The letter never leaves your device, there is no account, and it works offline after the first visit.'],
  ];
  return {
    path,
    title: `Official letters from ${country.inName ?? country.name} explained in English – Briefly`,
    description: `Understand official letters from ${country.inName ?? country.name} in plain English: ${country.senders.slice(0, 4).map((sender) => sender.local).join(', ')} and more. Deadlines, amounts, office words and reply templates. Free and private.`,
    crumbs: [['Briefly', '/'], [country.name, path]],
    schema: [faq(questions)],
    body: `<h1>${flag(country, ' flag-large')} Official letters from ${esc(country.inName ?? country.name)}, explained in English</h1>
<p class="lead">${esc(country.intro)}</p>
${cta(country, `Check your letter from ${country.inName ?? country.name}`)}
<h2>Offices that write to you</h2>
<ul class="link-list">${offices}</ul>
<h2>Common kinds of letters</h2>
<ul>${kinds}</ul>
<h2>${esc(namesOf(country))} office words</h2>
<p>${words} — <a href="/${country.slug}/words/">see all ${country.glossary.length} words</a>.</p>
<h2>Reply templates in ${esc(namesOf(country))}</h2>
<ul class="link-list">${templates}</ul>
<h2>Questions</h2>
${questions.map(([question, answer]) => `<h3>${esc(question)}</h3>\n<p>${esc(answer)}</p>`).join('\n')}`,
  };
}

function senderPage(country, sender) {
  const language = languageOf(country);
  const path = `/${country.slug}/${sender.slug}/`;
  const text = [sender.about, ...(sender.letters ?? []), ...(sender.tips ?? [])].join(' ');
  const terms = relatedTerms(country, text);
  const otherSenders = country.senders.filter((other) => other.id !== sender.id).slice(0, 8);
  const questions = [
    [`What is the ${sender.local}?`, `${sender.name}. ${sender.about}`],
    [`How long do I have to answer a letter from the ${sender.local}?`, deadlineAnswer(country)],
    [`Can I read a ${sender.local} letter in English?`, `Yes. Take a photo of the letter with Briefly. It explains the letter in plain English, finds the deadline and the amount, and gives you ready-made replies in ${namesOf(country, 'or')}. Your letter never leaves your device.`],
  ];
  return {
    path,
    title: `${sender.local} letter explained in English (${country.name}) – Briefly`,
    description: `Got a letter from the ${sender.local}? ${sender.about} Learn what it means, the deadlines and what to do — in plain English.`,
    crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], [sender.local, path]],
    schema: [faq(questions)],
    body: `<h1>${esc(sender.local)} letter explained in English</h1>
<p class="lead"><strong>${esc(sender.name)}.</strong> ${esc(sender.about)}</p>
${cta(country, `Check your ${sender.local} letter now`)}
<h2>Letters you may get</h2>
<ul>${(sender.letters ?? []).map((letter) => `<li>${esc(letter)}</li>`).join('\n')}</ul>
<h2>What to do</h2>
<ul>
${(sender.tips ?? []).map((tip) => `<li>${esc(tip)}</li>`).join('\n')}
<li>Find the deadline. Look for ${(country.deadlineWords ?? DEADLINE_WORDS[language.id]).map((word) => `“${esc(word)}”`).join(', ')}.</li>
<li>Write the reference number from the letter on everything you send back, and keep copies.</li>
<li>If you disagree with a decision, object in writing before the deadline (${esc(objectionWords(country))}). <a href="/${country.slug}/templates/objection/">See the template</a>.</li>
</ul>
${terms.length ? `<h2>Words you may see</h2>\n<dl class="terms">${terms.map((entry) => `<div><dt>${wordLink(country, entry)}</dt><dd>${esc(entry.meaning)}</dd></div>`).join('\n')}</dl>` : ''}
<h2>Questions</h2>
${questions.map(([question, answer]) => `<h3>${esc(question)}</h3>\n<p>${esc(answer)}</p>`).join('\n')}
<h2>Other offices in ${esc(country.inName ?? country.name)}</h2>
<p>${otherSenders.map((other) => `<a href="/${country.slug}/${other.slug}/">${esc(other.local)}</a>`).join(' · ')}</p>`,
  };
}

function wordsIndex(country) {
  const language = languageOf(country);
  const path = `/${country.slug}/words/`;
  const sorted = [...country.glossary].sort((a, b) => a.term.localeCompare(b.term, language.id));
  return {
    path,
    title: `${namesOf(country)} office words explained (${country.name}) – Briefly`,
    description: `${country.glossary.length} words from official letters in ${country.inName ?? country.name}, explained in plain English: ${sorted.slice(0, 6).map((entry) => entry.term).join(', ')} and more.`,
    crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], ['Office words', path]],
    body: `<h1>${esc(namesOf(country))} office words from ${esc(country.inName ?? country.name)}, explained</h1>
<p class="lead">The words you see in official letters in ${esc(country.inName ?? country.name)}, in plain English.</p>
<dl class="terms">${sorted.map((entry) => `<div id="${entry.slug}"><dt>${wordLink(country, entry)}</dt><dd>${esc(entry.meaning)}</dd></div>`).join('\n')}</dl>
${cta(country)}`,
  };
}

function wordPage(country, entry) {
  const language = LANGUAGES[entry.language ?? country.language];
  const path = `/${country.slug}/words/${entry.slug}/`;
  const senders = country.senders.filter((sender) => entry.pattern.test([sender.local, sender.about, ...(sender.letters ?? []), ...(sender.tips ?? [])].join(' '))).slice(0, 6);
  const index = country.glossary.indexOf(entry);
  const neighbours = [...country.glossary.slice(index + 1), ...country.glossary.slice(0, index)].slice(0, 8);
  return {
    path,
    title: `What does “${entry.term}” mean? ${language.name} office word (${country.name}) – Briefly`,
    description: `“${entry.term}” in an official letter from ${country.inName ?? country.name}: ${entry.meaning}${entry.tip ? ` ${entry.tip}` : ''}`.slice(0, 300),
    crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], ['Office words', `/${country.slug}/words/`], [entry.term, path]],
    schema: [faq([[`What does “${entry.term}” mean?`, `${entry.meaning}${entry.tip ? ` ${entry.tip}` : ''}`]])],
    body: `<h1>What does “${esc(entry.term)}” mean?</h1>
<p class="lead">${esc(entry.meaning)}</p>
${entry.tip ? `<h2>What to do</h2>\n<p>${esc(entry.tip)}</p>` : ''}
${senders.length ? `<h2>You may see it in letters from</h2>\n<ul>${senders.map((sender) => `<li><a href="/${country.slug}/${sender.slug}/">${esc(sender.local)}</a> — ${esc(sender.name)}</li>`).join('\n')}</ul>` : ''}
<p>“${esc(entry.term)}” is a ${esc(language.name)} word used in official letters in ${esc(country.inName ?? country.name)}. Briefly explains words like this automatically when you check a letter.</p>
${cta(country, 'Got a letter with this word?')}
<h2>More office words</h2>
<p>${neighbours.map((other) => wordLink(country, other)).join(' · ')} · <a href="/${country.slug}/words/">all words</a></p>`,
  };
}

export function templatePages(country) {
  return languagesOf(country).flatMap((id, index) => templatePagesIn(inLanguage(country, id), index ? `-${id}` : ''));
}

function templatePagesIn(country, suffix) {
  const language = languageOf(country);
  const letters = templateLetters(country);
  for (const extra of country.extraReplies ?? []) {
    const result = { country, today: null, sender: null, kind: null, letterDate: null, dates: [], money: { toPay: null }, references: [], objection: country.objectionDefault ?? country.objection[0].word };
    const templates = { ...language.replies, ...(country.replies ?? {}) };
    const header = [templates.you.name, templates.you.street, templates.you.city, '', `[${templates.officeFallback}]`, templates.officeAddress, '', `${templates.you.place}, ${datePlaceholder(country.dateSeparator ?? '.', country.dateOrder ?? 'dmy')}`, '', extra.subject, '', templates.greeting, ''];
    letters.push({ id: extra.id, title: extra.title, when: extra.advice, english: extra.english, local: [...header, ...extra.body(result), '', ...templates.closing].join('\n') });
  }
  return letters.map((letter) => {
    const name = letter.title.match(/\(([^)]+)\)/)?.[1] ?? letter.title;
    const path = `/${country.slug}/templates/${letter.id}${suffix}/`;
    return {
      path,
      letter,
      language,
      title: `${name} letter template (${language.name}, ${country.name}) – free – Briefly`,
      description: `Free ${language.name} letter template: ${letter.title.toLowerCase()}. ${letter.when} With an English explanation.`,
      crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], ['Templates', `/${country.slug}/templates/`], [name, path]],
      body: `<h1>${esc(letter.title)} — ${esc(language.name)} letter template</h1>
<p class="lead">${esc(letter.when)}</p>
<h2>What the letter says</h2>
<p>${esc(letter.english)}</p>
<h2>The letter in ${esc(language.name)}</h2>
<p>Fill in the parts in [brackets], print, sign and send it by post. Keep a copy.</p>
<pre class="letter" lang="${language.id}">${esc(letter.local)}</pre>
${cta(country, 'Let Briefly fill it in from your letter')}
<p>When you check your own letter with Briefly, it fills in the date, reference numbers and amounts for you.</p>`,
    };
  });
}

function templatesIndex(country) {
  const language = languageOf(country);
  const path = `/${country.slug}/templates/`;
  const pages = templatePages(country);
  return {
    path,
    title: `${namesOf(country)} reply letter templates for ${country.inName ?? country.name} – free – Briefly`,
    description: `Free ${namesOf(country)} templates for replying to official letters in ${country.inName ?? country.name}: objection, more time, payment plan and new appointment.`,
    crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], ['Templates', path]],
    body: `<h1>Reply letter templates for ${esc(country.inName ?? country.name)}</h1>
<p class="lead">Ready-made letters in ${esc(namesOf(country))}, with an English explanation.</p>
<ul class="link-list">${pages.map((page) => `<li><a href="${page.path}">${esc(page.letter.title)}${languagesOf(country).length > 1 ? ` (${esc(page.language.name)})` : ''}</a> — ${esc(page.letter.when)}</li>`).join('\n')}</ul>
${cta(country)}`,
  };
}

const TOOLS = [
  {
    slug: 'scan-document-to-text-offline',
    short: 'Scan to text offline',
    title: 'Scan a document to text offline — free, private OCR – Briefly',
    description: 'Turn a photo or scanned PDF of a letter into text, right on your device. No upload, no account, works offline. Supports English, German, French, Spanish, Portuguese, Italian, Dutch and Polish.',
    h1: 'Scan a document to text — offline and private',
    lead: 'Take a photo or open a scanned PDF. Briefly reads the text on your device with built-in text recognition (OCR). You can copy the text or save it as a file.',
    points: ['Works in your browser on phones and computers — nothing to install.', 'Your document is never uploaded. No server ever sees it.', 'Works offline after your first visit.', 'Reads English, German, French, Spanish, Portuguese, Italian, Dutch and Polish.', 'Copy the text or save it as a .txt file.'],
  },
  ...Object.values(LANGUAGES).filter((language) => language.model).map((language) => ({
    slug: `translate-${language.name.toLowerCase()}-letter-to-english`,
    short: `Translate ${language.name} letters`,
    title: `Translate a ${language.name} letter to English — private, offline – Briefly`,
    description: `Translate an official ${language.name} letter to English on your device. Briefly also explains deadlines, amounts and what to do. No upload, free, works offline.`,
    h1: `Translate a ${language.name} letter to English`,
    lead: `Take a photo of a ${language.name} letter. Briefly reads it, explains it in plain English and translates the whole letter — all on your device.`,
    points: [`The translator runs in your browser. It downloads once and then works offline.`, 'Dates and amounts are protected, so they don’t get mixed up in translation.', 'Briefly also shows the deadline, the amount and the steps to take.', `Ready-made replies in ${language.name}.`, 'No account and no upload.'],
  })),
  {
    slug: 'official-letter-deadline-calculator',
    short: 'Deadline calculator',
    title: 'Official letter deadline calculator — when is my deadline? – Briefly',
    description: 'Letters often say “within one month after delivery” or “within 30 days of the date of this notice”. Briefly finds that phrase and estimates the exact date, using each country’s delivery rules.',
    h1: 'When is my deadline? Official letter deadline calculator',
    lead: 'Many letters don’t give a date — they say “within one month after delivery” or “within 10 working days”. Briefly finds these phrases and estimates the last day for you.',
    points: COUNTRIES.map((country) => `${country.name}: ${country.deliveryNote}`),
  },
];

function toolPage(tool) {
  const path = `/${tool.slug}/`;
  return {
    path,
    title: tool.title,
    description: tool.description,
    crumbs: [['Briefly', '/'], [tool.short, path]],
    schema: [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Briefly', url: `${SITE}/`, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, description: tool.description }],
    body: `<h1>${esc(tool.h1)}</h1>
<p class="lead">${esc(tool.lead)}</p>
${cta(null, 'Try it now')}
<h2>How it works</h2>
<ul>${tool.points.map((point) => `<li>${esc(point)}</li>`).join('\n')}</ul>`,
  };
}

function privacyPage() {
  const path = '/privacy/';
  return {
    path,
    title: 'Privacy — your letter never leaves your device – Briefly',
    description: 'Briefly has no account, no cookies and no tracking, and your letter never reaches a server. What the hosting and the feedback form process, why, and your rights under the GDPR.',
    crumbs: [['Briefly', '/'], ['Privacy', path]],
    body: `<h1>Privacy</h1>
<p class="lead">Your letter never leaves your device.</p>
<p class="muted small">Last updated: 14 October 2026</p>

<h2>The short version</h2>
<ul>
<li>Your letter is read, explained and translated <strong>inside your browser</strong>. It is never uploaded, never sent anywhere and never saved.</li>
<li>No account, no cookies, no tracking, no ads, no analytics.</li>
<li>Like every website, Briefly is delivered by a hosting company (Cloudflare), which sees your IP address for a short time.</li>
<li>Only if you use <strong>Report a problem</strong>, the text you type is sent to me by email.</li>
</ul>

<h2>Who is responsible</h2>
<p>Briefly is a free, non-commercial project by Aditya Shukla. To contact me about your data, use <button class="link inline" type="button" data-feedback>Report a problem</button> and add your email address so I can answer, or open an issue on <a href="https://github.com/adityashukla55/Briefly/issues">GitHub</a>.</p>

<h2>Your letter</h2>
<p>Text recognition (OCR), the explanation and the translation all run on your device. No server ever receives your letter, and nothing is saved. Close the page and the letter is gone.</p>
<p>How you can be sure: the page is locked by a security rule (Content Security Policy) that only allows connections to Briefly’s own website. It cannot send your letter anywhere else. The code is <a href="https://github.com/adityashukla55/Briefly">open source</a>, so anyone can check it.</p>

<h2>Visiting the website (hosting)</h2>
<p>Briefly is hosted on Cloudflare Pages by Cloudflare, Inc. (101 Townsend St, San Francisco, CA 94107, USA). When your browser loads a page, Cloudflare necessarily processes technical data: your IP address, the date and time, the page requested, and your browser and operating system. This is needed to deliver the website and protect it from attacks.</p>
<ul>
<li><strong>Legal basis:</strong> Art. 6(1)(f) GDPR — my legitimate interest in a working and secure website.</li>
<li><strong>How long:</strong> Cloudflare keeps these logs only for a short time. I don’t receive them and don’t use them.</li>
<li>More in <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare’s privacy policy</a>.</li>
</ul>
<p>Briefly loads nothing from other websites: no external fonts, scripts, maps or videos.</p>

<h2>What is stored on your device</h2>
<p>Briefly uses no cookies. Your browser stores only:</p>
<ul>
<li>the country you picked last, and a note that you have used Briefly before (so the start page can be shorter);</li>
<li>the app itself, the text reader (about 6 MB) and, only if you use it, the translator for your language (20–26 MB), so Briefly works offline.</li>
</ul>
<p>This is needed for the features you use and is never sent to me or anyone else (in Germany: § 25(2) no. 2 TDDDG). You can delete it at any time in your browser settings (“site data”) or by removing the installed app.</p>

<h2 id="reporting-a-problem">Reporting a problem</h2>
<p>If you use <strong>Report a problem</strong>, Briefly sends:</p>
<ul>
<li>what you type into the form;</li>
<li>your email address, only if you enter one;</li>
<li>the address of the page you are on and your browser name (for example “Chrome on Windows”);</li>
<li>under a result: what Briefly found — the kind of letter, the office and the country. <strong>Never the letter itself.</strong></li>
</ul>
<p>The form is handled by a small function on Cloudflare and delivered to my inbox as an email by Resend (Resend, Inc., USA). I use it only to fix problems and, if you gave your email, to answer you.</p>
<ul>
<li><strong>Legal basis:</strong> Art. 6(1)(f) GDPR — my legitimate interest in fixing mistakes and answering questions.</li>
<li><strong>How long:</strong> I delete the email once the problem is solved, at the latest after 12 months. Resend keeps a copy for a short time to deliver it.</li>
<li>More in <a href="https://resend.com/legal/privacy-policy">Resend’s privacy policy</a>.</li>
</ul>
<p>Please don’t paste your letter or personal details into the form.</p>

<h2>Data in the USA</h2>
<p>Cloudflare and Resend are US companies, so data may be processed in the USA. These transfers are protected by the EU–US Data Privacy Framework and/or the EU Standard Contractual Clauses in their data processing agreements.</p>

<h2>Links to other websites</h2>
<p>Links such as “Buy me a coffee” and GitHub open other websites. Nothing is sent to them until you click, and then their own privacy policies apply.</p>

<h2>Your rights</h2>
<p>You have the right to access your data, to have it corrected or deleted, to restrict its use, to receive it in a common format, and to object to its use (Art. 15–18, 20 and 21 GDPR). Contact me as described above. You can also complain to a data protection authority, for example the one where you live (Art. 77 GDPR).</p>
<p>Because Briefly keeps no accounts and never receives your letter, the only data I can have about you is a feedback message you sent.</p>
${cta(null, 'Try Briefly')}`,
  };
}

function notFoundPage() {
  return {
    path: '/404.html',
    canonicalPath: '/',
    title: 'Page not found – Briefly',
    description: 'This page doesn’t exist. Check a letter with Briefly or browse letters by country.',
    crumbs: [['Briefly', '/'], ['Not found', '/404.html']],
    body: `<h1>Page not found</h1>
<p class="lead">This page doesn’t exist. Try one of these:</p>
<ul class="link-list"><li><a href="/">Check a letter</a></li>${COUNTRIES.map((country) => `<li><a href="/${country.slug}/">Letters from ${esc(country.inName ?? country.name)}</a></li>`).join('')}</ul>`,
  };
}

export function buildPages() {
  const pages = [];
  for (const country of COUNTRIES) {
    pages.push(countryPage(country));
    for (const sender of country.senders) pages.push(senderPage(country, sender));
    pages.push(wordsIndex(country));
    for (const entry of country.glossary) pages.push(wordPage(country, entry));
    pages.push(templatesIndex(country));
    pages.push(...templatePages(country));
  }
  for (const tool of TOOLS) pages.push(toolPage(tool));
  pages.push(privacyPage());
  const missing = { ...notFoundPage(), noIndex: true };
  return pages.map((page) => ({ ...page, html: layout(page) })).concat([{ ...missing, html: layout(missing) }]);
}

export function sitemap(pages) {
  const urls = ['/', ...pages.filter((page) => !page.noIndex).map((page) => page.path)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${SITE}${path}</loc></url>`).join('\n')}
</urlset>
`;
}

export const GENERATED_ROOTS = [...COUNTRIES.map((country) => country.slug), ...TOOLS.map((tool) => tool.slug), 'privacy'];

function write() {
  const web = join(dirname(fileURLToPath(import.meta.url)), '..', 'web');
  for (const root of GENERATED_ROOTS) rmSync(join(web, root), { recursive: true, force: true });
  const pages = buildPages();
  for (const page of pages) {
    const file = page.path.endsWith('/') ? join(web, page.path, 'index.html') : join(web, page.path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page.html);
  }
  writeFileSync(join(web, 'sitemap.xml'), sitemap(pages));
  writeFileSync(join(web, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log(`Wrote ${pages.length} pages and sitemap.xml`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) write();
