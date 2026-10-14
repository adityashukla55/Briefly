import { analyze } from './analyze.js';
import { ReadError, friendlyError, missingFeatures } from './errors.js';
import { makeIcs } from './calendar.js';
import { describeDaysLeft, formatMoney, formatWhen } from './format.js';
import { isSupported, missingReaderFiles, prepareReader, readFiles } from './read.js';
import { detectPlatform, installHelp } from './install.js';
import { buildReplies } from './replies.js';
import { COUNTRIES, countryById, detectLanguage, inLanguage, languageOf, languagesOf } from './countries/index.js';
import { LANGUAGES } from './languages/index.js';
import { buildSteps } from './steps.js';
import { h } from './dom.js';
import { openFeedback } from './feedback.js';
import { isTranslatorCached, needsTranslator, prepareTranslator, saveTranslator, translateText, translatorSize } from './translate.js';

const $ = (selector) => document.querySelector(selector);

const views = { start: $('#start'), working: $('#working'), result: $('#result') };
let current = null;

const COUNTRY_KEY = 'briefly-country';

function guessCountry() {
  const fromUrl = new URLSearchParams(location.search).get('country');
  if (fromUrl && COUNTRIES.some((country) => country.id === fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(COUNTRY_KEY);
    if (saved && COUNTRIES.some((country) => country.id === saved)) return saved;
  } catch {}
  const locale = (navigator.language || 'de').toLowerCase();
  if (locale.startsWith('de-at')) return 'at';
  if (locale.startsWith('de-ch') || locale.startsWith('gsw')) return 'ch';
  if (locale.endsWith('-ca')) return 'ca';
  if (locale.endsWith('-be')) return 'be';
  if (locale === 'en-us') return 'us';
  if (locale === 'en-gb' || locale === 'en-uk') return 'uk';
  if (locale === 'en-ie' || locale === 'ga') return 'ie';
  const language = locale.slice(0, 2);
  return ['fr', 'es', 'it', 'nl', 'pl', 'pt'].includes(language) ? language : 'de';
}

let selectedCountry = guessCountry();

function selectCountry(id) {
  selectedCountry = id;
  try {
    localStorage.setItem(COUNTRY_KEY, id);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set('country', id);
  history.replaceState(history.state, '', url);
  renderCountryPicker();
  renderSamples();
  renderScope();
  refreshOffline(true);
}

function renderCountryPicker() {
  $('#countries').replaceChildren(...COUNTRIES.map((country) => h('button', {
    class: `country${country.id === selectedCountry ? ' selected' : ''}`,
    type: 'button',
    'aria-pressed': String(country.id === selectedCountry),
    onclick: () => selectCountry(country.id),
    title: country.short ? country.name : null,
    'aria-label': country.short ? country.name : null,
  }, h('img', { class: 'flag', src: `/icons/flags/${country.id}.svg`, alt: '', width: 21, height: 14 }), country.short ?? country.name)));
  const selected = $('#countries .selected');
  const row = $('#countries');
  if (selected && row.scrollWidth > row.clientWidth) row.scrollLeft = selected.offsetLeft - row.offsetLeft - 16;
}

const SCOPE_PREVIEW = 8;

function notFor(className) {
  return h('p', { class: className }, h('strong', {}, 'Not for: '), 'personal letters, receipts, contracts, ID cards, handwritten notes or letters from other countries.');
}

function renderScope() {
  const country = countryById(selectedCountry);
  const senders = country.senders;
  const kinds = country.kinds.filter((kind) => !kind.weight || kind.weight >= 1);
  const tag = (sender) => h('li', { class: 'scope-tag' }, h('strong', {}, sender.local), sender.local === sender.name ? null : h('span', {}, ` · ${sender.name}`));
  $('#scope').replaceChildren(
    h('p', { class: 'scope-title' }, `Briefly understands letters from these offices in ${country.inName ?? country.name}:`),
    h('ul', { class: 'scope-tags' }, senders.slice(0, SCOPE_PREVIEW).map(tag)),
    h('p', { class: 'scope-short' }, `${senders.slice(0, 3).map((sender) => sender.name).join(', ')} and ${senders.length - 3} more.`),
    h('details', { class: 'scope-more' },
      h('summary', {}, `See all ${senders.length} offices and ${kinds.length} kinds of letters`),
      h('div', { class: 'scope-columns' },
        h('div', {},
          h('p', { class: 'scope-head' }, 'Offices'),
          h('ul', { class: 'scope-list' }, senders.map((sender) => h('li', {},
            h('a', { href: `/${country.slug}/${sender.slug}/` }, sender.local),
            sender.local === sender.name ? null : ` — ${sender.name}`)))),
        h('div', {},
          h('p', { class: 'scope-head' }, 'Kinds of letters'),
          h('ul', { class: 'scope-list' }, kinds.map((kind) => h('li', {}, h('strong', {}, kind.local), ` — ${kind.name}`))))),
      notFor('scope-not scope-not-inner')),
    notFor('scope-not'));
}

function renderSamples() {
  const country = countryById(selectedCountry);
  $('#samples').replaceChildren(...country.samples.map((sample) => h('button', {
    class: 'chip',
    type: 'button',
    onclick: () => showResult(sample.build(todayLocal()), 'sample', country.id),
  }, sample.title, h('span', {}, sample.subtitle))));
}

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function show(name) {
  for (const [key, view] of Object.entries(views)) view.hidden = key !== name;
  window.scrollTo({ top: 0 });
}

let toastTimer = null;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 2200);
}

async function copy(text, what = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(what);
  } catch {
    toast('Could not copy. Select the text and copy it by hand.');
  }
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = h('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setWorking(label, progress = null) {
  $('#working-label').textContent = label;
  const bar = $('#working-bar');
  if (progress === null || progress === undefined) {
    bar.classList.add('indeterminate');
    bar.style.width = '';
  } else {
    bar.classList.remove('indeterminate');
    bar.style.width = `${Math.round(progress * 100)}%`;
  }
}

async function processFiles(fileList) {
  const files = [...fileList].filter(isSupported);
  if (!files.length) {
    showStartError(friendlyError(new ReadError('This file type isn’t supported', 'Use a photo (JPG, PNG, WebP) or a PDF. You can also paste the text of the letter.')));
    return;
  }
  show('working');
  setWorking('Reading your letter');
  try {
    const country = countryById(selectedCountry);
    let { text, usedOcr } = await readFiles(files, { language: languageOf(country).ocr, onProgress: setWorking });
    const detected = detectLanguage(text);
    if (usedOcr && detected && !(detected.id === country.language || (languagesOf(country).includes(detected.id) && !detected.confident))) {
      setWorking(`This looks like ${LANGUAGES[detected.id].name}. Reading it again`);
      ({ text } = await readFiles(files, { language: LANGUAGES[detected.id].ocr, onProgress: setWorking }));
    }
    if (text.replace(/\s/g, '').length < 20) throw new ReadError('We couldn’t find any text', 'Try a sharper photo in good light, with the whole page flat and visible. Handwritten letters can’t be read.');
    showResult(text, 'file');
  } catch (error) {
    console.error(error);
    show('start');
    showStartError(friendlyError(error, 'read'));
  }
}

function errorBox(problem, props = {}) {
  return h('div', { class: 'notice error problem', role: 'alert', ...props },
    h('p', { class: 'problem-title' }, problem.title),
    h('p', {}, problem.message),
    problem.details ? h('details', { class: 'problem-details' },
      h('summary', {}, 'Technical details'),
      h('p', {}, problem.details),
      h('p', {}, h('a', { href: 'https://github.com/adityashukla55/Briefly/issues', target: '_blank', rel: 'noopener' }, 'Report this problem'), ' — please include the details above and your browser.')) : null);
}

function showStartError(problem) {
  $('#start-error')?.remove();
  $('#dropzone').before(errorBox(problem, { id: 'start-error' }));
  $('#start-error').scrollIntoView({ block: 'center' });
}

function urgencyText(urgency) {
  if (urgency === 'high') return 'Act soon';
  if (urgency === 'medium') return 'Has a deadline';
  return 'No rush';
}

function dateTone(date) {
  if (date.daysLeft === null) return '';
  if (date.daysLeft < 0) return 'high';
  if (date.daysLeft <= 7) return 'high';
  if (date.daysLeft <= 21) return 'medium';
  return '';
}

function calendarButton(result, date) {
  if (!date.iso) return null;
  const sender = result.sender?.local ?? 'Letter';
  const title = date.type === 'appointment' ? `Appointment: ${sender}` : `${date.label}: ${sender}`;
  const steps = buildSteps(result).slice(0, 3).map((step) => `• ${step.text}`).join('\n');
  return h('button', {
    class: 'button ghost small',
    type: 'button',
    onclick: () => {
      download(`briefly-${date.iso}.ics`, makeIcs({ title, iso: date.iso, time: date.time, description: `${result.kind?.name ?? 'Letter'} from ${sender}.\n${steps}` }), 'text/calendar');
      toast('Calendar file ready — open it to add the reminder');
    },
  }, 'Add to calendar');
}

function dateFact(result, date) {
  const tone = dateTone(date);
  const when = formatWhen(date, result.country);
  let note;
  if (!date.iso) note = `Within ${date.period} after you received the letter`;
  else if (date.daysLeft < 0) note = `This date has passed (${describeDaysLeft(date.daysLeft)})`;
  else note = describeDaysLeft(date.daysLeft);
  return h('div', { class: 'card fact' },
    h('span', { class: 'fact-label' }, date.label),
    h('span', { class: 'fact-value' }, when ?? '—'),
    h('span', { class: `fact-note ${tone}` }, note),
    date.estimated && date.iso ? h('span', { class: 'fact-note' }, `Estimated: ${date.period}, counted from ${result.country.deliveryDays ? `about ${result.country.deliveryDays} days after the letter date` : 'the date on the letter'}. ${result.country.deliveryNote}`) : null,
    calendarButton(result, date));
}

function moneyFacts(result) {
  const facts = [];
  const { toPay, toGet } = result.money;
  if (toPay) {
    facts.push(h('div', { class: 'card fact money-pay' },
      h('span', { class: 'fact-label' }, 'To pay'),
      h('span', { class: 'fact-value' }, `${formatMoney(toPay)}${toPay.monthly ? ' / month' : ''}`),
      h('span', { class: 'fact-note' }, `Written in the letter as ${toPay.source.replace(/ /g, '\u00a0')}`)));
  }
  if (toGet) {
    facts.push(h('div', { class: 'card fact money-get' },
      h('span', { class: 'fact-label' }, toGet.role === 'benefit' ? 'You get' : 'Money back for you'),
      h('span', { class: 'fact-value' }, `${formatMoney(toGet)}${toGet.monthly ? ' / month' : ''}`),
      h('span', { class: 'fact-note' }, `Written in the letter as ${toGet.source.replace(/ /g, '\u00a0')}`)));
  }
  return facts;
}

function row(label, value, { code = false, copyable = true } = {}) {
  return h('div', { class: 'row' },
    h('dt', {}, label),
    h('dd', { class: code ? 'code' : '' }, value),
    copyable ? h('button', { class: 'copy', type: 'button', onclick: () => copy(value.replace(/\s/g, code ? '' : ' '), `${label} copied`) }, 'Copy') : h('span'));
}

function summaryCard(result) {
  const { sender, kind } = result;
  return h('div', { class: `card summary urgency-${result.urgency}` },
    h('div', { class: 'summary-top' },
      h('p', { class: 'summary-from' }, sender ? `From: ${sender.name}${sender.local === sender.name ? '' : ` (${sender.local})`}` : 'Sender not recognised'),
      countrySwitcher(result)),
    h('h1', { class: 'summary-title', tabindex: '-1' },
      kind ? kind.name : 'Letter',
      kind && !kind.local.toLowerCase().startsWith(kind.name.toLowerCase()) ? h('span', { class: 'local' }, ` · ${kind.local}`) : null),
    kind ? h('p', {}, kind.about) : h('p', {}, 'We couldn’t tell exactly what kind of letter this is. The dates, amounts and translation below can still help.'),
    sender ? h('p', { class: 'muted small' }, sender.about) : null,
    h('span', { class: `badge ${result.urgency}` }, urgencyText(result.urgency)));
}

function stepsCard(result) {
  const steps = buildSteps(result);
  return h('div', { class: 'card' },
    h('h2', {}, 'What to do'),
    h('ul', { class: 'steps' }, steps.map((step, index) => h('li', { class: step.tone },
      h('input', { type: 'checkbox', id: `step-${index}` }),
      h('label', { for: `step-${index}` }, step.text)))));
}

function paymentCard(result) {
  const { payment } = result;
  if (!payment) return null;
  return h('div', { class: 'card' },
    h('h2', {}, 'Bank transfer details'),
    h('dl', { class: 'rows' },
      payment.recipient ? row('Recipient', payment.recipient) : null,
      payment.iban ? row('IBAN', payment.iban, { code: true }) : null,
      ...(payment.account?.rows ?? []).map(([label, value]) => row(label, value, { code: true })),
      payment.bic ? row('BIC', payment.bic, { code: true }) : null,
      payment.reference ? row('Reference', payment.reference) : null,
      result.money.toPay ? row('Amount', result.money.toPay.amount.toFixed(2).replace('.', result.country.decimal)) : null));
}

function referencesCard(result) {
  const shown = new Set([result.payment?.reference, ...(result.payment?.account?.rows ?? []).map(([, value]) => value)]);
  const list = result.references.filter((reference) => !shown.has(reference.value));
  if (!list.length) return null;
  return h('div', { class: 'card' },
    h('h2', {}, 'Your reference numbers'),
    h('p', { class: 'muted small' }, 'Write these on every reply and use them when you call.'),
    h('dl', { class: 'rows' }, list.map((reference) => row(reference.name.toLowerCase().includes(reference.local.toLowerCase()) ? reference.name : `${reference.name} (${reference.local})`, reference.value, { code: true }))));
}

function termsCard(result) {
  if (!result.terms.length) return null;
  return h('div', { class: 'card' },
    h('h2', {}, 'Words in this letter'),
    h('dl', { class: 'terms' }, result.terms.map((term) => h('div', {}, h('dt', {}, term.term), h('dd', {}, term.meaning)))));
}

function translationCard(result) {
  if (!needsTranslator(result.country)) return null;
  const language = languageOf(result.country);
  const body = h('div', { class: 'translation' });
  const status = h('p', { class: 'muted small' });
  const card = h('div', { class: 'card' }, h('h2', {}, 'The whole letter in English'), body);

  const run = async () => {
    body.replaceChildren(status);
    try {
      status.textContent = 'Preparing the translator…';
      await prepareTranslator(result.country, (progress) => { status.textContent = `Downloading the translator… ${Math.round(progress * 100)}%`; });
      status.textContent = 'Translating…';
      const paragraphs = await translateText(result.text, result.country, (done, total) => { status.textContent = `Translating… ${done} of ${total}`; });
      const showOriginal = h('input', { type: 'checkbox', id: 'show-original' });
      const list = h('div', {}, paragraphs.map((paragraph) => h('div', {},
        h('p', {}, paragraph.english),
        h('p', { class: 'original', hidden: true, lang: language.id }, paragraph.original))));
      showOriginal.addEventListener('change', () => {
        for (const original of list.querySelectorAll('.original')) original.hidden = !showOriginal.checked;
      });
      body.replaceChildren(
        h('p', { class: 'muted small' }, `Machine translation made on your device. It can contain mistakes — dates and amounts above come straight from the ${language.name} text.`),
        h('p', { class: 'translation-actions' }, showOriginal, h('label', { for: 'show-original' }, `Show the ${language.name} under each part`)),
        list);
    } catch (error) {
      console.error(error);
      body.replaceChildren(errorBox(friendlyError(error, 'translate')), h('button', { class: 'button secondary', type: 'button', onclick: run }, 'Try again'));
    }
  };

  (async () => {
    if (await isTranslatorCached(result.country)) {
      run();
      return;
    }
    const size = await translatorSize(result.country).catch(() => 0);
    body.replaceChildren(
      h('p', {}, 'Translate the full letter on your device. The translator downloads once', size ? ` (${Math.round(size / 1_000_000)} MB)` : '', ' and then works offline.'),
      h('button', { class: 'button secondary', type: 'button', onclick: run }, 'Translate the whole letter'));
  })();

  return card;
}

function repliesCard(result) {
  const replies = buildReplies(result);
  if (!replies.length) return null;
  return h('div', { class: 'card' },
    h('h2', {}, `Ready-made replies in ${languageOf(result.country).name}`),
    h('p', { class: 'muted small' }, 'Fill in the parts in [brackets], print, sign and send by post. Keep a copy.'),
    replies.map((reply) => h('details', { class: 'reply' },
      h('summary', {}, reply.title),
      h('p', {}, reply.when),
      h('p', { class: 'muted small' }, h('strong', {}, 'What it says: '), reply.english),
      h('pre', { class: 'letter', lang: result.country.language }, reply.local),
      h('div', { class: 'reply-actions' },
        h('button', { class: 'button secondary small', type: 'button', onclick: () => copy(reply.local, 'Letter copied') }, 'Copy letter'),
        h('button', { class: 'button ghost small', type: 'button', onclick: () => download(`briefly-${reply.id}.txt`, reply.local, 'text/plain;charset=utf-8') }, 'Download')))));
}

const SOURCE_NAMES = { sample: 'example letter', file: 'photo or PDF', paste: 'pasted text', share: 'shared text', edit: 'edited text' };

function reportLine(result, source) {
  const found = `${result.kind?.name ?? 'Unknown kind of letter'}${result.sender ? ` from ${result.sender.local}` : ''} · ${result.country.name} · ${SOURCE_NAMES[source] ?? source}`;
  return h('p', { class: 'report-line' },
    'Something wrong or unclear in this result? ',
    h('button', { class: 'link', type: 'button', onclick: () => openFeedback(found, 'text') }, 'Report it'));
}

function sourceCard(result) {
  const area = h('textarea', { rows: 10, spellcheck: 'false', lang: result.country.language });
  area.value = result.text;
  return h('div', { class: 'card' },
    h('details', { class: 'source' },
      h('summary', {}, 'Text we read from your letter'),
      h('p', { class: 'muted small' }, 'Photos can have reading mistakes. Fix a wrong date or amount here and check again. You can also copy or save the text.'),
      area,
      h('div', { class: 'reply-actions' },
        h('button', { class: 'button secondary', type: 'button', onclick: () => showResult(area.value, current?.source ?? 'edit', result.country.id) }, 'Check again'),
        h('button', { class: 'button ghost', type: 'button', onclick: () => copy(area.value, 'Text copied') }, 'Copy text'),
        h('button', { class: 'button ghost', type: 'button', onclick: () => download('briefly-letter.txt', area.value, 'text/plain;charset=utf-8') }, 'Save as text file'))));
}

function summaryText(result) {
  const lines = [`${result.kind?.name ?? 'Letter'}${result.sender ? ` from ${result.sender.name} (${result.sender.local})` : ''}`];
  for (const date of result.dates.filter((item) => item.iso)) lines.push(`${date.label}: ${formatWhen(date, result.country)}${date.estimated ? ' (estimated)' : ''}`);
  if (result.money.toPay) lines.push(`To pay: ${formatMoney(result.money.toPay)}`);
  if (result.money.toGet) lines.push(`You get: ${formatMoney(result.money.toGet)}`);
  lines.push('', ...buildSteps(result).map((step) => `• ${step.text}`), '', 'Made with Briefly');
  return lines.join('\n');
}

function countrySwitcher(result) {
  const select = h('select', {
    class: 'country-select',
    'aria-label': 'Country of the letter',
    onchange: (event) => showResult(result.text, current?.source ?? 'edit', event.target.value),
  }, COUNTRIES.map((country) => h('option', { value: country.id, selected: country.id === result.country.id }, country.name)));
  return h('label', { class: 'summary-country' }, 'Letter from ', select);
}

function showResult(text, source, countryId = null) {
  try {
    localStorage.setItem('briefly-returning', '1');
  } catch {}
  const result = analyze(text, countryId ? { country: countryId } : { preferred: selectedCountry });
  current = { result, source };
  const facts = [...result.dates.map((date) => dateFact(result, date)), ...moneyFacts(result)];
  const switched = !countryId && result.country.id !== selectedCountry;
  const unknown = !result.sender && !result.kind && !result.dates.length && !result.money.toPay && !result.money.toGet && !result.payment;
  $('#result-body').replaceChildren(...[
    source === 'sample' ? h('p', { class: 'notice' }, 'This is a made-up example letter. Try it with your own letter next.') : null,
    unknown ? errorBox({
      title: 'This doesn’t look like an official letter',
      message: `Briefly couldn’t find an office, a deadline or an amount. It works with letters from offices, landlords, insurers and companies in ${result.country.inName ?? result.country.name} — see the list on the start page. If this is such a letter, check that the whole page is in the photo. The translation below may still help.`,
      details: null,
    }) : null,
    switched && !unknown ? h('p', { class: 'notice' }, `This letter looks like it’s from ${result.country.inName ?? result.country.name}, so Briefly used the ${result.country.adjective} rules. Wrong? Change the country below.`) : null,
    summaryCard(result),
    facts.length ? h('div', { class: 'facts' }, facts) : null,
    stepsCard(result),
    paymentCard(result),
    referencesCard(result),
    termsCard(result),
    translationCard(result),
    repliesCard(result),
    sourceCard(result),
    reportLine(result, source),
  ].filter(Boolean));
  $('#share').hidden = !navigator.share;
  show('result');
  $('#result .summary-title')?.focus?.();
}

function setupStart() {
  renderCountryPicker();
  renderSamples();
  renderScope();

  for (const input of [$('#files'), $('#camera')]) {
    input.addEventListener('change', () => {
      if (input.files.length) processFiles(input.files);
      input.value = '';
    });
  }

  $('#paste-toggle').addEventListener('click', () => {
    $('#paste-form').hidden = false;
    $('#paste-toggle').hidden = true;
    $('#paste').focus();
  });

  $('#paste-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = $('#paste').value.trim();
    if (text.length < 20) {
      toast('Please paste the full text of the letter.');
      return;
    }
    showResult(text, 'paste');
  });

  const zone = $('#dropzone');
  for (const type of ['dragenter', 'dragover']) {
    window.addEventListener(type, (event) => {
      if (![...(event.dataTransfer?.types ?? [])].includes('Files')) return;
      event.preventDefault();
      zone.classList.add('dragging');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    window.addEventListener(type, () => zone.classList.remove('dragging'));
  }
  window.addEventListener('drop', (event) => {
    if (!event.dataTransfer?.files.length) return;
    event.preventDefault();
    processFiles(event.dataTransfer.files);
  });

  window.addEventListener('paste', (event) => {
    if (views.start.hidden || event.target.closest?.('textarea')) return;
    const files = [...(event.clipboardData?.files ?? [])];
    if (files.length) {
      event.preventDefault();
      processFiles(files);
    }
  });

  $('#again').addEventListener('click', () => {
    current = null;
    $('#result-body').replaceChildren();
    $('#start-error')?.remove();
    show('start');
  });

  $('#share').addEventListener('click', async () => {
    if (!current) return;
    try {
      await navigator.share({ title: 'Briefly summary', text: summaryText(current.result) });
    } catch {}
  });
}

const GLYPHS = {
  share: 'M12 3v12M12 3 8 7m4-4 4 4M6 11H5v10h14V11h-1',
  menu: 'M12 5.5v.01M12 12v.01M12 18.5v.01',
  install: 'M4 5h16v11H4zM9 20h6M12 8v5m0 0-2.5-2.5M12 13l2.5-2.5',
};

function glyph(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'glyph');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', GLYPHS[name]);
  if (name === 'menu') path.setAttribute('stroke-width', '3.2');
  svg.append(path);
  return svg;
}

function renderHelp(help) {
  return [
    h('p', { class: 'save-help-title' }, `${help.title}:`),
    h('ol', { class: 'save-steps' }, help.steps.map((step) => h('li', {}, step.map((part) => {
      if (typeof part === 'string') return part;
      if (part.icon) return glyph(part.icon);
      return h('strong', {}, part.strong);
    })))),
    help.note ? h('p', { class: 'save-note' }, help.note) : null,
  ].filter(Boolean);
}

function setupInstall() {
  let deferred = null;
  const header = $('#install');
  const button = $('#save-button');
  const help = $('#save-help');
  const dialog = $('#save-dialog');
  const platform = detectPlatform({ userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints });
  const steps = installHelp(platform);
  help.replaceChildren(...renderHelp(steps));
  $('#save-dialog-help').replaceChildren(...renderHelp(steps));

  const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  const refresh = () => {
    const done = installed();
    header.hidden = done;
    button.hidden = done || !deferred;
    help.hidden = done || Boolean(deferred);
    $('#save-done').hidden = !done;
  };

  const promptInstall = async () => {
    if (!deferred) return false;
    const event = deferred;
    deferred = null;
    event.prompt();
    const choice = await event.userChoice.catch(() => null);
    if (choice?.outcome === 'accepted') {
      installedNow = true;
      toast('Briefly is being saved as an app');
      refreshOffline(true);
    }
    refresh();
    return true;
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    refresh();
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    refreshOffline(true);
    refresh();
    toast('Saved! Open Briefly from your home screen or apps.');
  });

  button.addEventListener('click', promptInstall);
  header.addEventListener('click', async () => {
    if (await promptInstall()) return;
    dialog.showModal();
  });
  $('#save-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  refresh();
}

async function takeSharedFiles() {
  const params = new URLSearchParams(location.search);
  if (!params.has('shared') || !('caches' in self)) return;
  history.replaceState(null, '', '/');
  const cache = await caches.open('briefly-share');
  const requests = await cache.keys();
  const files = [];
  let text = '';
  for (const request of requests) {
    const response = await cache.match(request);
    if (request.url.endsWith('/shared/text')) text = await response.text();
    else {
      const name = decodeURIComponent(response.headers.get('x-file-name') ?? 'shared');
      files.push(new File([await response.blob()], name, { type: response.headers.get('content-type') ?? '' }));
    }
    await cache.delete(request);
  }
  if (files.length) processFiles(files);
  else if (text.trim().length >= 20) showResult(text, 'share');
}

function setupLaunchQueue() {
  if (!('launchQueue' in window)) return;
  window.launchQueue.setConsumer(async (params) => {
    if (!params.files?.length) return;
    const files = await Promise.all(params.files.map((handle) => handle.getFile()));
    processFiles(files);
  });
}

let installedNow = false;

function isInstalled() {
  return installedNow || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

const offline = { reader: 'checking', readerStep: '', missing: [], translator: 'checking', translatorProgress: 0, translatorSize: 0, warming: null };

function offlineSupported() {
  return 'serviceWorker' in navigator && 'caches' in self;
}

async function controlled() {
  if (!offlineSupported()) return false;
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) return true;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(Boolean(navigator.serviceWorker.controller)), 120000);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      clearTimeout(timer);
      resolve(true);
    }, { once: true });
  });
}

function variantsOf(country) {
  return languagesOf(country).map((id) => inLanguage(country, id));
}

function namesOf(variants) {
  return variants.map((variant) => languageOf(variant).name).join(' and ');
}

function readerKey(country) {
  return variantsOf(country).map((variant) => languageOf(variant).ocr).join('+');
}

async function missingFor(country) {
  return (await Promise.all(variantsOf(country).map((variant) => missingReaderFiles(languageOf(variant).ocr)))).flat();
}

function translatorVariants(country) {
  return variantsOf(country).filter((variant) => needsTranslator(variant));
}

async function translatorsCached(country) {
  const list = translatorVariants(country);
  return (await Promise.all(list.map((variant) => isTranslatorCached(variant)))).every(Boolean);
}

function renderOffline() {
  const country = countryById(selectedCountry);
  const language = { name: namesOf(variantsOf(country)) };
  const translatorName = namesOf(translatorVariants(country));
  const reader = $('#offline-reader');
  const translator = $('#offline-translator');
  const tick = (text) => [h('span', { class: 'offline-tick', 'aria-hidden': 'true' }, '✓'), text];
  if (!offlineSupported()) {
    reader.replaceChildren('This browser can’t save Briefly for offline use. Try Chrome, Edge, Firefox or Safari.');
    translator.replaceChildren();
    return;
  }
  reader.className = `offline-item ${offline.reader}`;
  $('#offline-title').textContent = isInstalled() ? 'Offline use — saved with the app' : 'Offline use';
  if (offline.reader === 'ready') reader.replaceChildren(...tick(`Reading ${language.name} letters works offline.`));
  else if (offline.reader === 'working') reader.replaceChildren(h('span', { class: 'mini-spinner', 'aria-hidden': 'true' }), `Getting ready to read ${language.name} letters offline… ${offline.readerStep}`);
  else if (offline.reader === 'waiting') reader.replaceChildren(`You’re offline. Connect to the internet once so Briefly can save its ${language.name} text reader (about 6 MB).`);
  else if (offline.reader === 'missing') reader.replaceChildren(`To read ${language.name} letters offline, Briefly needs to save its text reader (about 6 MB). `, h('button', { class: 'link', type: 'button', onclick: () => warmReader(true) }, 'Save it now'));
  else if (offline.reader === 'failed') reader.replaceChildren('Couldn’t save the text reader for offline use. ', h('button', { class: 'link', type: 'button', onclick: () => warmReader(true) }, 'Try again'));
  else reader.replaceChildren('Checking…');
  if (['waiting', 'missing', 'failed'].includes(offline.reader) && offline.missing.length) {
    reader.append(h('details', { class: 'offline-missing' }, h('summary', {}, 'What’s missing'), h('p', {}, offline.missing.map((path) => path.split('/').pop()).join(', '))));
  }

  translator.hidden = !translatorVariants(country).length;
  translator.className = `offline-item ${offline.translator}`;
  const size = offline.translatorSize ? ` (${Math.round(offline.translatorSize / 1_000_000)} MB)` : '';
  const plural = translatorVariants(country).length > 1 ? 's' : '';
  if (offline.translator === 'ready') translator.replaceChildren(...tick(`The ${translatorName} translator${plural} work${plural ? '' : 's'} offline.`));
  else if (offline.translator === 'working') translator.replaceChildren(h('span', { class: 'mini-spinner', 'aria-hidden': 'true' }), `Saving the ${translatorName} translator${plural}… ${Math.round(offline.translatorProgress * 100)}%`);
  else if (offline.translator === 'checking') translator.replaceChildren();
  else translator.replaceChildren(`Translating the whole letter offline needs the ${translatorName} translator${plural}${size}. `, h('button', { class: 'link', type: 'button', onclick: saveTranslatorOffline, disabled: navigator.onLine === false }, 'Save it for offline'));
}

async function warmReader(force = false) {
  const country = countryById(selectedCountry);
  const ocr = readerKey(country);
  if (offline.warming === ocr) return;
  if (!navigator.onLine) {
    offline.reader = 'waiting';
    renderOffline();
    return;
  }
  if (!force && navigator.connection?.saveData) {
    offline.reader = 'missing';
    renderOffline();
    return;
  }
  offline.warming = ocr;
  offline.reader = 'working';
  offline.readerStep = '';
  renderOffline();
  try {
    if (!(await controlled())) throw new Error('Offline saving is not active yet');
    for (const variant of variantsOf(country)) {
      await prepareReader(languageOf(variant).ocr, (step) => {
        offline.readerStep = step;
        if (readerKey(countryById(selectedCountry)) === ocr) renderOffline();
      });
    }
  } catch (error) {
    console.warn('Offline preparation failed', error);
  }
  offline.warming = null;
  if (readerKey(countryById(selectedCountry)) === ocr) {
    offline.missing = await missingFor(country);
    offline.reader = offline.missing.length ? 'failed' : 'ready';
    renderOffline();
  }
}

async function saveTranslatorOffline() {
  if (offline.translator === 'working') return;
  const country = countryById(selectedCountry);
  offline.translator = 'working';
  offline.translatorProgress = 0;
  renderOffline();
  try {
    if (!(await controlled())) throw new Error('Offline saving is not active yet');
    const list = translatorVariants(country);
    for (const [index, variant] of list.entries()) {
      await saveTranslator(variant, (progress) => {
        offline.translatorProgress = (index + progress) / list.length;
        renderOffline();
      });
    }
    offline.translator = (await translatorsCached(country)) ? 'ready' : 'missing';
  } catch (error) {
    console.warn('Saving the translator failed', error);
    offline.translator = 'missing';
    toast(navigator.onLine ? 'Couldn’t save the translator. Try again.' : 'You’re offline. Connect to the internet and try again.');
  }
  renderOffline();
}

async function refreshOffline(warm = false) {
  if (!offlineSupported()) {
    renderOffline();
    return;
  }
  const country = countryById(selectedCountry);
  const ocr = readerKey(country);
  if (offline.warming !== ocr) {
    offline.missing = await missingFor(country);
    offline.reader = !offline.missing.length ? 'ready' : (navigator.onLine ? 'missing' : 'waiting');
  }
  offline.translator = (await translatorsCached(country)) ? 'ready' : 'missing';
  offline.translatorSize = (await Promise.all(translatorVariants(country).map((variant) => translatorSize(variant).catch(() => 0)))).reduce((sum, size) => sum + size, 0);
  renderOffline();
  if (!warm || !navigator.onLine) return;
  if (offline.reader !== 'ready') await warmReader(isInstalled());
  if (isInstalled() && offline.translator === 'missing' && countryById(selectedCountry) === country) await saveTranslatorOffline();
}

function setupOffline() {
  renderOffline();
  window.addEventListener('online', () => refreshOffline(true));
  window.addEventListener('offline', () => refreshOffline());
  if (offlineSupported()) navigator.serviceWorker.addEventListener('controllerchange', () => refreshOffline(true));
  const start = () => refreshOffline(true);
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 1500);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Offline mode unavailable', error));
}

function checkSupport() {
  const missing = missingFeatures();
  if (!missing.length) return;
  $('#dropzone').before(errorBox({
    title: 'This browser can’t run Briefly',
    message: `It is missing ${missing.join(', ')}. Please update your browser, or open Briefly in the latest Chrome, Edge, Firefox or Safari.`,
    details: null,
  }));
}

document.documentElement.classList.add('ready');
checkSupport();
setupStart();
setupInstall();
setupLaunchQueue();
registerServiceWorker();
setupOffline();
takeSharedFiles();
