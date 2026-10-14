import { h } from './dom.js';

const KINDS = [
  ['text', 'Wrong or unclear text'],
  ['bug', 'Something doesn’t work'],
  ['idea', 'An idea or wish'],
  ['other', 'Something else'],
];

let parts = null;
let about = '';
let openedAt = 0;

function pageAddress() {
  return `${location.pathname}${location.search}`;
}

export function browserName(agent = navigator.userAgent, touch = navigator.maxTouchPoints) {
  const name = /Edg\//.test(agent) ? 'Edge'
    : /Firefox\/|FxiOS/.test(agent) ? 'Firefox'
      : /SamsungBrowser/.test(agent) ? 'Samsung Internet'
        : /Chrome\/|CriOS/.test(agent) ? 'Chrome'
          : /Safari\//.test(agent) ? 'Safari'
            : 'Other browser';
  const system = /Android/.test(agent) ? 'Android'
    : /iPhone|iPod/.test(agent) ? 'iPhone'
      : /iPad/.test(agent) || (/Mac OS X/.test(agent) && touch > 1) ? 'iPad'
        : /Mac OS X/.test(agent) ? 'Mac'
          : /Windows/.test(agent) ? 'Windows'
            : /Linux|CrOS/.test(agent) ? 'Linux or ChromeOS'
              : 'other system';
  return `${name} on ${system}`;
}

function installed() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}

function build() {
  const kind = h('select', { id: 'feedback-kind', name: 'kind' }, KINDS.map(([value, label]) => h('option', { value }, label)));
  const message = h('textarea', {
    id: 'feedback-message',
    name: 'message',
    rows: '5',
    maxlength: '2000',
    required: true,
    placeholder: 'For example: on this page the deadline says 14 days, but my letter says 1 month.',
  });
  const contact = h('input', { id: 'feedback-contact', name: 'contact', type: 'email', maxlength: '200', autocomplete: 'email', placeholder: 'you@example.com' });
  const trap = h('input', { class: 'feedback-trap', name: 'website', type: 'text', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' });
  const sentWith = h('ul', { class: 'feedback-sent-with' });
  const error = h('p', { class: 'feedback-error', role: 'alert', hidden: true });
  const submit = h('button', { class: 'button primary', type: 'submit' }, 'Send');
  const form = h('form', { class: 'feedback-form', novalidate: true },
    h('label', { for: 'feedback-kind' }, 'What is it about?'),
    kind,
    h('label', { for: 'feedback-message' }, 'What did you notice?'),
    message,
    h('label', { for: 'feedback-contact' }, 'Your email ', h('span', { class: 'feedback-optional' }, '(optional — only if you want an answer)')),
    contact,
    trap,
    h('div', { class: 'feedback-privacy' },
      h('p', {}, h('strong', {}, 'Please don’t paste your letter or personal details.'), ' Briefly sends only what you type here, and:'),
      sentWith,
      h('p', { class: 'feedback-more' }, h('a', { href: '/privacy/#reporting-a-problem', target: '_blank', rel: 'noopener' }, 'How your message is handled'))),
    error,
    h('div', { class: 'feedback-actions' }, submit));
  const thanks = h('div', { class: 'feedback-thanks', hidden: true },
    h('p', { class: 'feedback-thanks-title' }, 'Thank you! Your message was sent.'),
    h('p', {}, 'Every report helps make Briefly more correct for everyone.'),
    h('button', { class: 'button secondary', type: 'button', onclick: () => parts.dialog.close() }, 'Close'));
  const dialog = h('dialog', { class: 'save-dialog feedback-dialog', 'aria-labelledby': 'feedback-title' },
    h('button', { class: 'dialog-close', type: 'button', 'aria-label': 'Close', onclick: () => dialog.close() }, '×'),
    h('h2', { id: 'feedback-title' }, 'Report a problem'),
    h('p', { class: 'feedback-lead' }, 'Found a mistake, wrong text or a bug? Tell me — I read every message.'),
    form,
    thanks);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    send();
  });
  document.body.append(dialog);
  return { dialog, form, thanks, kind, message, contact, trap, sentWith, error, submit };
}

function showError(text) {
  parts.error.textContent = text;
  parts.error.hidden = false;
}

function details() {
  return {
    page: pageAddress(),
    browser: `${browserName()}${installed() ? ', saved as app' : ''}`,
    context: about,
  };
}

async function send() {
  parts.error.hidden = true;
  const message = parts.message.value.trim();
  if (message.length < 5) {
    showError('Please write a few words about what you noticed.');
    parts.message.focus();
    return;
  }
  if (parts.contact.value.trim() && !parts.contact.checkValidity()) {
    showError('This email address doesn’t look right. You can also leave it empty.');
    parts.contact.focus();
    return;
  }
  if (navigator.onLine === false) {
    showError('You’re offline. Your message is still here — send it when you’re back online.');
    return;
  }
  parts.submit.disabled = true;
  parts.submit.textContent = 'Sending…';
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: parts.kind.value,
        message,
        contact: parts.contact.value.trim(),
        website: parts.trap.value,
        elapsed: Date.now() - openedAt,
        ...details(),
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
    parts.message.value = '';
    parts.contact.value = '';
    parts.form.hidden = true;
    parts.thanks.hidden = false;
    parts.thanks.querySelector('button').focus();
  } catch {
    showError(navigator.onLine === false
      ? 'You’re offline. Your message is still here — send it when you’re back online.'
      : 'Sorry, sending didn’t work. Your message is still here — please try again in a few minutes.');
  } finally {
    parts.submit.disabled = false;
    parts.submit.textContent = 'Send';
  }
}

export function openFeedback(context = '', kind = 'text') {
  parts ??= build();
  about = context;
  const { page, browser } = details();
  parts.sentWith.replaceChildren(...[
    h('li', {}, 'this page’s address: ', h('code', {}, page)),
    h('li', {}, `your browser: ${browser}`),
    context ? h('li', {}, `what Briefly found: ${context}`) : null,
  ].filter(Boolean));
  if (!parts.thanks.hidden || !parts.message.value) parts.kind.value = kind;
  parts.form.hidden = false;
  parts.thanks.hidden = true;
  parts.error.hidden = true;
  openedAt = Date.now();
  parts.dialog.showModal();
  parts.message.focus();
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest?.('[data-feedback]');
  if (!trigger) return;
  event.preventDefault();
  openFeedback(trigger.dataset.feedback ?? '');
});
