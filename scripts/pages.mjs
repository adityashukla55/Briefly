import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COUNTRIES, languageOf } from '../web/src/countries/index.js';
import { LANGUAGES } from '../web/src/languages/index.js';
import { templateLetters } from '../web/src/replies.js';

export const SITE = 'https://brieflyapp.pages.dev';

const DEADLINE_WORDS = {
  de: ['Frist', 'bis zum', 'innerhalb'],
  fr: ['délai', 'avant le', 'au plus tard'],
  es: ['plazo', 'hasta el', 'días hábiles'],
  it: ['termine', 'entro il', 'scadenza'],
};

export function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const countries = COUNTRIES.map((country) => `<a href="/${country.slug}/">${country.flag} ${esc(country.name)}</a>`).join(' · ');
  const tools = TOOLS.map((tool) => `<a href="/${tool.slug}/">${esc(tool.short)}</a>`).join(' · ');
  return `<footer class="footer">
    <p><strong>Letters from:</strong> ${countries}</p>
    <p><strong>Tools:</strong> ${tools} · <a href="/privacy/">Privacy</a></p>
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
    [`How long do I have to answer an official letter in ${country.name}?`, deadlineAnswer(country)],
    [`Can I understand a ${language.name} letter without speaking ${language.name}?`, `Yes. Take a photo of the letter with Briefly. It reads the ${language.name} text on your device, explains it in plain English, finds deadlines and amounts, and can translate the whole letter.`],
    ['Is my letter uploaded anywhere?', 'No. Briefly runs completely in your browser. The letter never leaves your device, there is no account, and it works offline after the first visit.'],
  ];
  return {
    path,
    title: `Official letters from ${country.name} explained in English – Briefly`,
    description: `Understand official letters from ${country.name} in plain English: ${country.senders.slice(0, 4).map((sender) => sender.local).join(', ')} and more. Deadlines, amounts, office words and reply templates. Free and private.`,
    crumbs: [['Briefly', '/'], [country.name, path]],
    schema: [faq(questions)],
    body: `<h1>${country.flag} Official letters from ${esc(country.name)}, explained in English</h1>
<p class="lead">${esc(country.intro)}</p>
${cta(country, `Check your letter from ${country.name}`)}
<h2>Offices that write to you</h2>
<ul class="link-list">${offices}</ul>
<h2>Common kinds of letters</h2>
<ul>${kinds}</ul>
<h2>${esc(language.name)} office words</h2>
<p>${words} — <a href="/${country.slug}/words/">see all ${country.glossary.length} words</a>.</p>
<h2>Reply templates in ${esc(language.name)}</h2>
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
    [`Can I read a ${sender.local} letter in English?`, `Yes. Take a photo of the letter with Briefly. It explains the letter in plain English, finds the deadline and the amount, and gives you ready-made replies in ${language.name}. Your letter never leaves your device.`],
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
<h2>Other offices in ${esc(country.name)}</h2>
<p>${otherSenders.map((other) => `<a href="/${country.slug}/${other.slug}/">${esc(other.local)}</a>`).join(' · ')}</p>`,
  };
}

function wordsIndex(country) {
  const language = languageOf(country);
  const path = `/${country.slug}/words/`;
  const sorted = [...country.glossary].sort((a, b) => a.term.localeCompare(b.term, language.id));
  return {
    path,
    title: `${language.name} office words explained (${country.name}) – Briefly`,
    description: `${country.glossary.length} words from official letters in ${country.name}, explained in plain English: ${sorted.slice(0, 6).map((entry) => entry.term).join(', ')} and more.`,
    crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], ['Office words', path]],
    body: `<h1>${esc(language.name)} office words from ${esc(country.name)}, explained</h1>
<p class="lead">The words you see in official letters in ${esc(country.name)}, in plain English.</p>
<dl class="terms">${sorted.map((entry) => `<div id="${entry.slug}"><dt>${wordLink(country, entry)}</dt><dd>${esc(entry.meaning)}</dd></div>`).join('\n')}</dl>
${cta(country)}`,
  };
}

function wordPage(country, entry) {
  const language = languageOf(country);
  const path = `/${country.slug}/words/${entry.slug}/`;
  const senders = country.senders.filter((sender) => entry.pattern.test([sender.local, sender.about, ...(sender.letters ?? []), ...(sender.tips ?? [])].join(' '))).slice(0, 6);
  const index = country.glossary.indexOf(entry);
  const neighbours = [...country.glossary.slice(index + 1), ...country.glossary.slice(0, index)].slice(0, 8);
  return {
    path,
    title: `What does “${entry.term}” mean? ${language.name} office word (${country.name}) – Briefly`,
    description: `“${entry.term}” in an official letter from ${country.name}: ${entry.meaning}${entry.tip ? ` ${entry.tip}` : ''}`.slice(0, 300),
    crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], ['Office words', `/${country.slug}/words/`], [entry.term, path]],
    schema: [faq([[`What does “${entry.term}” mean?`, `${entry.meaning}${entry.tip ? ` ${entry.tip}` : ''}`]])],
    body: `<h1>What does “${esc(entry.term)}” mean?</h1>
<p class="lead">${esc(entry.meaning)}</p>
${entry.tip ? `<h2>What to do</h2>\n<p>${esc(entry.tip)}</p>` : ''}
${senders.length ? `<h2>You may see it in letters from</h2>\n<ul>${senders.map((sender) => `<li><a href="/${country.slug}/${sender.slug}/">${esc(sender.local)}</a> — ${esc(sender.name)}</li>`).join('\n')}</ul>` : ''}
<p>“${esc(entry.term)}” is a ${esc(language.name)} word used in official letters in ${esc(country.name)}. Briefly explains words like this automatically when you check a letter.</p>
${cta(country, 'Got a letter with this word?')}
<h2>More office words</h2>
<p>${neighbours.map((other) => wordLink(country, other)).join(' · ')} · <a href="/${country.slug}/words/">all words</a></p>`,
  };
}

export function templatePages(country) {
  const language = languageOf(country);
  const letters = templateLetters(country);
  for (const extra of country.extraReplies ?? []) {
    const result = { country, today: null, sender: null, kind: null, letterDate: null, dates: [], money: { toPay: null }, references: [], objection: country.objection[0].word };
    const templates = { ...language.replies, ...(country.replies ?? {}) };
    const header = [templates.you.name, templates.you.street, templates.you.city, '', `[${templates.officeFallback}]`, templates.officeAddress, '', `${templates.you.place}, [${country.dateSeparator === '/' ? 'DD/MM/YYYY' : 'DD.MM.YYYY'}]`, '', extra.subject, '', templates.greeting, ''];
    letters.push({ id: extra.id, title: extra.title, when: extra.advice, english: extra.english, local: [...header, ...extra.body(result), '', ...templates.closing].join('\n') });
  }
  return letters.map((letter) => {
    const name = letter.title.match(/\(([^)]+)\)/)?.[1] ?? letter.title;
    const path = `/${country.slug}/templates/${letter.id}/`;
    return {
      path,
      letter,
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
    title: `${language.name} reply letter templates for ${country.name} – free – Briefly`,
    description: `Free ${language.name} templates for replying to official letters in ${country.name}: objection, more time, payment plan and new appointment.`,
    crumbs: [['Briefly', '/'], [country.name, `/${country.slug}/`], ['Templates', path]],
    body: `<h1>Reply letter templates for ${esc(country.name)}</h1>
<p class="lead">Ready-made letters in ${esc(language.name)}, with an English explanation.</p>
<ul class="link-list">${pages.map((page) => `<li><a href="${page.path}">${esc(page.letter.title)}</a> — ${esc(page.letter.when)}</li>`).join('\n')}</ul>
${cta(country)}`,
  };
}

const TOOLS = [
  {
    slug: 'scan-document-to-text-offline',
    short: 'Scan to text offline',
    title: 'Scan a document to text offline — free, private OCR – Briefly',
    description: 'Turn a photo or scanned PDF of a letter into text, right on your device. No upload, no account, works offline. Supports German, French, Spanish and Italian.',
    h1: 'Scan a document to text — offline and private',
    lead: 'Take a photo or open a scanned PDF. Briefly reads the text on your device with built-in text recognition (OCR). You can copy the text or save it as a file.',
    points: ['Works in your browser on phones and computers — nothing to install.', 'Your document is never uploaded. There is no server that could see it.', 'Works offline after your first visit.', 'Reads German, French, Spanish and Italian.', 'Copy the text or save it as a .txt file.'],
  },
  ...Object.values(LANGUAGES).map((language) => ({
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
    description: 'Letters often say “within one month after delivery”. Briefly finds that phrase and estimates the exact date, using the delivery rules of Germany, Austria, Switzerland, France, Spain and Italy.',
    h1: 'When is my deadline? Official letter deadline calculator',
    lead: 'Many letters don’t give a date — they say “within one month after delivery” or “within 10 working days”. Briefly finds these phrases and estimates the last day for you.',
    points: COUNTRIES.map((country) => `${country.flag} ${country.name}: ${country.deliveryNote}`),
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
<ul>${tool.points.map((point) => `<li>${esc(point)}</li>`).join('\n')}</ul>
<h2>Letters from these countries</h2>
<p>${COUNTRIES.map((country) => `<a href="/${country.slug}/">${country.flag} ${esc(country.name)}</a>`).join(' · ')}</p>`,
  };
}

function privacyPage() {
  const path = '/privacy/';
  return {
    path,
    title: 'Privacy — your letter never leaves your device – Briefly',
    description: 'Briefly has no server, no account and no tracking. Text recognition and translation run in your browser, and the page is locked so it cannot send your letter anywhere.',
    crumbs: [['Briefly', '/'], ['Privacy', path]],
    body: `<h1>Privacy</h1>
<p class="lead">Your letter never leaves your device.</p>
<h2>What happens to my letter?</h2>
<p>Briefly reads, explains and translates your letter inside your browser. There is no server that receives it, and nothing is saved. Close the page and the letter is gone.</p>
<h2>How can I be sure?</h2>
<p>The page is locked by a security rule (Content Security Policy) that only allows connections to Briefly’s own website, to download the app itself. It cannot send data anywhere else. The code is <a href="https://github.com/adityashukla55/Briefly">open source</a>, so anyone can check it.</p>
<h2>What is downloaded?</h2>
<p>The app, the text reader (about 6 MB) and, only if you use it, the translator for your language (20–26 MB). They are stored by your browser so Briefly works offline.</p>
<h2>Cookies and tracking</h2>
<p>None. Briefly only remembers which country you picked last, in your own browser.</p>
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
<ul class="link-list"><li><a href="/">Check a letter</a></li>${COUNTRIES.map((country) => `<li><a href="/${country.slug}/">Letters from ${esc(country.name)}</a></li>`).join('')}</ul>`,
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
