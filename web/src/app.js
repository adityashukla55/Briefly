import { analyze } from './analyze.js';
import { makeIcs } from './calendar.js';
import { describeDaysLeft, formatEuro, formatWhen } from './format.js';
import { isSupported, readFiles } from './read.js';
import { buildReplies } from './replies.js';
import { SAMPLES, sampleText } from './samples.js';
import { buildSteps } from './steps.js';
import { isTranslatorCached, prepareTranslator, translateText, translatorSize } from './translate.js';

const $ = (selector) => document.querySelector(selector);

function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') element.className = value;
    else if (key.startsWith('on')) element.addEventListener(key.slice(2), value);
    else if (key in element && typeof value !== 'string') element[key] = value;
    else element.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

const views = { start: $('#start'), working: $('#working'), result: $('#result') };
let current = null;

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
    toast('Please choose a photo (JPG, PNG) or a PDF.');
    return;
  }
  show('working');
  setWorking('Reading your letter');
  try {
    const text = await readFiles(files, setWorking);
    if (text.replace(/\s/g, '').length < 20) throw new Error('We couldn’t find text in this file. Try a sharper photo in good light, with the whole page visible.');
    showResult(text, 'file');
  } catch (error) {
    console.error(error);
    show('start');
    showStartError(error.message || 'Something went wrong while reading the file.');
  }
}

function showStartError(message) {
  $('#start-error')?.remove();
  $('#dropzone').before(h('p', { id: 'start-error', class: 'notice error', role: 'alert' }, message));
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
  const sender = result.sender?.german ?? 'Letter';
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
  const when = formatWhen(date);
  let note;
  if (!date.iso) note = `Within ${date.period} after you received the letter`;
  else if (date.daysLeft < 0) note = `This date has passed (${describeDaysLeft(date.daysLeft)})`;
  else note = describeDaysLeft(date.daysLeft);
  return h('div', { class: 'card fact' },
    h('span', { class: 'fact-label' }, date.label),
    h('span', { class: 'fact-value' }, when ?? '—'),
    h('span', { class: `fact-note ${tone}` }, note),
    date.estimated && date.iso ? h('span', { class: 'fact-note' }, `Estimated: ${date.period} from about 4 days after the letter date, when a posted letter usually counts as delivered.`) : null,
    calendarButton(result, date));
}

function moneyFacts(result) {
  const facts = [];
  const { toPay, toGet } = result.money;
  if (toPay) {
    facts.push(h('div', { class: 'card fact money-pay' },
      h('span', { class: 'fact-label' }, 'To pay'),
      h('span', { class: 'fact-value' }, `${formatEuro(toPay.amount)}${toPay.monthly ? ' / month' : ''}`),
      h('span', { class: 'fact-note' }, `Written in the letter as ${toPay.source.replace(/ /g, '\u00a0')}`)));
  }
  if (toGet) {
    facts.push(h('div', { class: 'card fact money-get' },
      h('span', { class: 'fact-label' }, toGet.role === 'benefit' ? 'You get' : 'Money back for you'),
      h('span', { class: 'fact-value' }, `${formatEuro(toGet.amount)}${toGet.monthly ? ' / month' : ''}`),
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
    h('p', { class: 'summary-from' }, sender ? `From: ${sender.name}${sender.german === sender.name ? '' : ` (${sender.german})`}` : 'Sender not recognised'),
    h('h1', { class: 'summary-title', tabindex: '-1' },
      kind ? kind.name : 'Letter',
      kind ? h('span', { class: 'german' }, ` · ${kind.german}`) : null),
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
      row('IBAN', payment.iban, { code: true }),
      payment.bic ? row('BIC', payment.bic, { code: true }) : null,
      payment.reference ? row('Reference', payment.reference) : null,
      result.money.toPay ? row('Amount', result.money.toPay.amount.toFixed(2).replace('.', ',')) : null));
}

function referencesCard(result) {
  const list = result.references.filter((reference) => reference.value !== result.payment?.reference);
  if (!list.length) return null;
  return h('div', { class: 'card' },
    h('h2', {}, 'Your reference numbers'),
    h('p', { class: 'muted small' }, 'Write these on every reply and use them when you call.'),
    h('dl', { class: 'rows' }, list.map((reference) => row(`${reference.name} (${reference.german})`, reference.value, { code: true }))));
}

function termsCard(result) {
  if (!result.terms.length) return null;
  return h('div', { class: 'card' },
    h('h2', {}, 'Words in this letter'),
    h('dl', { class: 'terms' }, result.terms.map((term) => h('div', {}, h('dt', {}, term.term), h('dd', {}, term.meaning)))));
}

function translationCard(result) {
  const body = h('div', { class: 'translation' });
  const status = h('p', { class: 'muted small' });
  const card = h('div', { class: 'card' }, h('h2', {}, 'The whole letter in English'), body);

  const run = async () => {
    body.replaceChildren(status);
    try {
      status.textContent = 'Preparing the translator…';
      await prepareTranslator((progress) => { status.textContent = `Downloading the translator… ${Math.round(progress * 100)}%`; });
      status.textContent = 'Translating…';
      const paragraphs = await translateText(result.text, (done, total) => { status.textContent = `Translating… ${done} of ${total}`; });
      const showGerman = h('input', { type: 'checkbox', id: 'show-german' });
      const list = h('div', {}, paragraphs.map((paragraph) => h('div', {},
        h('p', {}, paragraph.english),
        h('p', { class: 'german', hidden: true, lang: 'de' }, paragraph.german))));
      showGerman.addEventListener('change', () => {
        for (const german of list.querySelectorAll('.german')) german.hidden = !showGerman.checked;
      });
      body.replaceChildren(
        h('p', { class: 'muted small' }, 'Machine translation made on your device. It can contain mistakes — dates and amounts above come straight from the German text.'),
        h('p', { class: 'translation-actions' }, showGerman, h('label', { for: 'show-german' }, 'Show German under each part')),
        list);
    } catch (error) {
      console.error(error);
      body.replaceChildren(h('p', { class: 'notice error' }, error.message || 'Translation failed.'), h('button', { class: 'button secondary', type: 'button', onclick: run }, 'Try again'));
    }
  };

  (async () => {
    if (await isTranslatorCached()) {
      run();
      return;
    }
    const size = await translatorSize().catch(() => 0);
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
    h('h2', {}, 'Ready-made replies in German'),
    h('p', { class: 'muted small' }, 'Fill in the parts in [brackets], print, sign and send by post. Keep a copy.'),
    replies.map((reply) => h('details', { class: 'reply' },
      h('summary', {}, reply.title),
      h('p', {}, reply.when),
      h('p', { class: 'muted small' }, h('strong', {}, 'What it says: '), reply.english),
      h('pre', { class: 'letter', lang: 'de' }, reply.german),
      h('div', { class: 'reply-actions' },
        h('button', { class: 'button secondary small', type: 'button', onclick: () => copy(reply.german, 'Letter copied') }, 'Copy letter'),
        h('button', { class: 'button ghost small', type: 'button', onclick: () => download(`briefly-${reply.id}.txt`, reply.german, 'text/plain;charset=utf-8') }, 'Download')))));
}

function sourceCard(result) {
  const area = h('textarea', { rows: 10, spellcheck: 'false', lang: 'de' });
  area.value = result.text;
  return h('div', { class: 'card' },
    h('details', { class: 'source' },
      h('summary', {}, 'Text we read from your letter'),
      h('p', { class: 'muted small' }, 'Photos can have reading mistakes. Fix a wrong date or amount here and check again.'),
      area,
      h('button', { class: 'button secondary', type: 'button', onclick: () => showResult(area.value, current?.source ?? 'edit') }, 'Check again')));
}

function summaryText(result) {
  const lines = [`${result.kind?.name ?? 'Letter'}${result.sender ? ` from ${result.sender.name} (${result.sender.german})` : ''}`];
  for (const date of result.dates.filter((item) => item.iso)) lines.push(`${date.label}: ${formatWhen(date)}${date.estimated ? ' (estimated)' : ''}`);
  if (result.money.toPay) lines.push(`To pay: ${formatEuro(result.money.toPay.amount)}`);
  if (result.money.toGet) lines.push(`You get: ${formatEuro(result.money.toGet.amount)}`);
  lines.push('', ...buildSteps(result).map((step) => `• ${step.text}`), '', 'Made with Briefly');
  return lines.join('\n');
}

function showResult(text, source) {
  const result = analyze(text);
  current = { result, source };
  const facts = [...result.dates.map((date) => dateFact(result, date)), ...moneyFacts(result)];
  $('#result-body').replaceChildren(...[
    source === 'sample' ? h('p', { class: 'notice' }, 'This is a made-up example letter. Try it with your own letter next.') : null,
    summaryCard(result),
    facts.length ? h('div', { class: 'facts' }, facts) : null,
    stepsCard(result),
    paymentCard(result),
    referencesCard(result),
    termsCard(result),
    translationCard(result),
    repliesCard(result),
    sourceCard(result),
  ].filter(Boolean));
  $('#share').hidden = !navigator.share;
  show('result');
  $('#result .summary-title')?.focus?.();
}

function setupStart() {
  const chips = $('#samples');
  for (const sample of SAMPLES) {
    chips.append(h('button', { class: 'chip', type: 'button', onclick: () => showResult(sampleText(sample.id), 'sample') },
      sample.title, h('span', {}, sample.subtitle)));
  }

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

function setupInstall() {
  let deferred = null;
  const button = $('#install');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    button.hidden = false;
  });
  button.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null;
    button.hidden = true;
  });
  window.addEventListener('appinstalled', () => { button.hidden = true; });
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  $('#ios-hint').hidden = !(iOS && !standalone);
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

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Offline mode unavailable', error));
}

setupStart();
setupInstall();
setupLaunchQueue();
registerServiceWorker();
takeSharedFiles();
