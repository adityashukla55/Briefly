import { h } from './dom.js';
import { countryById } from './countries/index.js';
import { formatShortDate, todayIso } from './dates.js';
import { describeDaysLeft, formatMoney, formatWhen } from './format.js';
import { canEncrypt } from './vault.js';
import { BadBackup, Locked, MIN_PASSWORD, NOTE_LIMIT, WrongPassword, createFolder, nextDeadline, openDeadlines, parseBackup, searchLetters, summarize } from './folder.js';

const LOCK_MINUTES = 5;
const LOCK_AFTER = LOCK_MINUTES * 60 * 1000;

const $ = (selector) => document.querySelector(selector);

let app = null;
let folder = null;
let shown = null;
let showingSaved = false;
let lastKept = null;
let lastUse = 0;
let timer = null;
let fromStart = false;
let query = '';
let renderRun = 0;

function touch() {
  lastUse = Date.now();
}

function startTimer() {
  touch();
  clearInterval(timer);
  timer = setInterval(checkIdle, 15000);
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function checkIdle() {
  if (folder?.isUnlocked() && Date.now() - lastUse >= LOCK_AFTER) lock(`My letters locked after ${LOCK_MINUTES} minutes without use`);
}

function upper(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function tone(daysLeft) {
  if (daysLeft <= 7) return 'high';
  if (daysLeft <= 21) return 'medium';
  return '';
}

function titleOf(letter) {
  return letter.summary?.kind?.name ?? 'Letter';
}

function keptOn(letter) {
  return formatShortDate(todayIso(new Date(letter.savedAt)));
}

function storageMessage(error) {
  if (error instanceof Locked) return 'My letters is locked. Open it again with your password.';
  if (error?.name === 'QuotaExceededError') return 'There is no space left on this device. Free up some space and try again.';
  return 'Briefly couldn’t save here. In a private window, browsers often don’t allow saving.';
}

function passwordField(id, label, autocomplete) {
  const input = h('input', { id, type: 'password', autocomplete, required: true, spellcheck: 'false', autocapitalize: 'off' });
  return { input, field: h('div', { class: 'field' }, h('label', { for: id }, label), input) };
}

function revealToggle(inputs, id) {
  const box = h('input', { type: 'checkbox', id });
  box.addEventListener('change', () => {
    for (const input of inputs) input.type = box.checked ? 'text' : 'password';
  });
  return h('p', { class: 'folder-reveal' }, box, h('label', { for: id }, 'Show password'));
}

function usernameField() {
  return h('input', { class: 'visually-hidden', type: 'text', autocomplete: 'username', value: 'Briefly – My letters', tabindex: '-1', 'aria-hidden': 'true', readonly: true });
}

function openDialog(dialog, focus) {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
  focus?.focus();
}

function passwordDialog({ title, lead, warning = null, create = false, submitLabel, busyLabel, wrong, onPassword }) {
  return new Promise((resolve) => {
    const first = passwordField('folder-password', create ? 'New password' : 'Password', create ? 'new-password' : 'current-password');
    const second = create ? passwordField('folder-repeat', 'Type it again', 'new-password') : null;
    const error = h('p', { class: 'folder-error', role: 'alert', hidden: true });
    const submit = h('button', { class: 'button primary', type: 'submit' }, submitLabel);
    const fail = (message, input = first.input) => {
      error.textContent = message;
      error.hidden = false;
      input.focus();
      input.select();
    };
    const form = h('form', { class: 'folder-form', novalidate: true },
      usernameField(),
      first.field,
      create ? h('p', { class: 'field-hint' }, `At least ${MIN_PASSWORD} characters. A short sentence is easy to remember.`) : null,
      second?.field,
      revealToggle([first.input, second?.input].filter(Boolean), 'folder-reveal'),
      error,
      h('div', { class: 'feedback-actions' }, submit));
    let finished = false;
    const dialog = h('dialog', { class: 'save-dialog folder-dialog', 'aria-labelledby': 'folder-dialog-title' },
      h('button', { class: 'dialog-close', type: 'button', 'aria-label': 'Close', onclick: () => dialog.close() }, '×'),
      h('h2', { id: 'folder-dialog-title' }, title),
      h('p', { class: 'feedback-lead' }, lead),
      warning ? h('p', { class: 'folder-warning' }, warning) : null,
      form);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const password = first.input.value;
      if (create && password.length < MIN_PASSWORD) return fail(`Please use at least ${MIN_PASSWORD} characters.`);
      if (create && password !== second.input.value) return fail('The two passwords are not the same. Please type them again.', second.input);
      if (!create && !password) return fail('Please type your password.');
      submit.disabled = true;
      submit.textContent = busyLabel;
      error.hidden = true;
      try {
        await onPassword(password);
        finished = true;
        resolve(true);
        dialog.close();
      } catch (problem) {
        if (!(problem instanceof WrongPassword)) console.error(problem);
        submit.disabled = false;
        submit.textContent = submitLabel;
        fail(problem instanceof WrongPassword ? wrong : problem instanceof BadBackup ? problem.message : storageMessage(problem));
      }
    });
    dialog.addEventListener('close', () => {
      if (!finished) resolve(false);
    });
    openDialog(dialog, first.input);
  });
}

function confirmDialog({ title, text, confirmLabel }) {
  return new Promise((resolve) => {
    let answer = false;
    const cancel = h('button', { class: 'button secondary', type: 'button', onclick: () => dialog.close() }, 'Cancel');
    const dialog = h('dialog', { class: 'save-dialog folder-dialog', 'aria-labelledby': 'folder-confirm-title' },
      h('h2', { id: 'folder-confirm-title' }, title),
      h('p', { class: 'feedback-lead' }, text),
      h('div', { class: 'folder-confirm-actions' },
        cancel,
        h('button', { class: 'button danger-fill', type: 'button', onclick: () => { answer = true; dialog.close(); } }, confirmLabel)));
    dialog.addEventListener('close', () => resolve(answer));
    openDialog(dialog, cancel);
  });
}

function askCreate(submitLabel) {
  return passwordDialog({
    title: 'Create a password for My letters',
    lead: 'Briefly keeps your letters in a private folder on this device. The folder is locked with your password, so only you can open it. Nothing is uploaded.',
    warning: 'Write your password down somewhere safe. If you forget it, your saved letters can’t be opened again. Nobody can reset it — not even Briefly.',
    create: true,
    submitLabel,
    busyLabel: 'Creating…',
    onPassword: async (password) => {
      await folder.create(password);
      navigator.storage?.persist?.().catch(() => {});
    },
  });
}

function askUnlock(lead, submitLabel) {
  return passwordDialog({
    title: 'Unlock My letters',
    lead,
    submitLabel,
    busyLabel: 'Unlocking…',
    wrong: 'That password is not right. Check it and try again.',
    onPassword: (password) => folder.unlock(password),
  });
}

function isKept() {
  return Boolean(shown && folder?.isUnlocked() && lastKept && lastKept.text === shown.text && lastKept.country === shown.country.id);
}

function updateKeep() {
  const button = $('#keep');
  if (!button) return;
  button.hidden = !shown;
  const kept = isKept();
  button.textContent = kept ? '✓ In My letters' : 'Keep this letter';
  button.classList.toggle('kept', kept);
}

async function keep() {
  const result = shown;
  if (!result) return;
  if (isKept()) {
    location.hash = '#letters';
    return;
  }
  if (!folder) {
    app.toast('This browser can’t keep letters. Try the latest Chrome, Edge, Firefox or Safari.');
    return;
  }
  try {
    if (!folder.isUnlocked()) {
      const ready = (await folder.exists())
        ? await askUnlock('Type your password to keep this letter.', 'Unlock and keep')
        : await askCreate('Create and keep this letter');
      if (!ready) return;
    }
    const { id, updated } = await folder.keep({ text: result.text, country: result.country.id, summary: summarize(result) });
    lastKept = { id, text: result.text, country: result.country.id };
    startTimer();
    updateKeep();
    app.toast(updated ? 'Updated in My letters' : 'Kept in My letters');
  } catch (error) {
    console.error(error);
    app.toast(storageMessage(error));
  }
}

function lock(message = null) {
  if (!folder?.isUnlocked()) return;
  folder.lock();
  stopTimer();
  query = '';
  $('#letters-body').replaceChildren();
  const onSavedLetter = showingSaved && !$('#result').hidden;
  if (showingSaved) app.closeResult();
  showingSaved = false;
  updateKeep();
  if (onSavedLetter) {
    fromStart = false;
    app.show('letters');
  }
  if (!$('#letters').hidden) render();
  if (message) app.toast(message);
}

async function guard(action) {
  touch();
  try {
    await action();
  } catch (error) {
    console.error(error);
    if (error instanceof Locked) lock();
    app.toast(storageMessage(error));
  }
}

async function openLetter(letter) {
  touch();
  lastKept = { id: letter.id, text: letter.text, country: letter.country };
  history.pushState(history.state, '', `${location.pathname}${location.search}`);
  const notes = [`From My letters. You kept it on ${keptOn(letter)}.${letter.done ? ' You marked it as done.' : ''}`];
  if (letter.note) notes.push(`Your note: ${letter.note}`);
  await app.showResult(letter.text, 'saved', letter.country, notes);
}

function deadlineItem({ letter, date, daysLeft }) {
  const country = countryById(letter.country);
  const sender = letter.summary?.sender?.local;
  const title = titleOf(letter);
  const what = title === date.label ? sender : `${title}${sender ? ` from ${sender}` : ''}`;
  return h('li', {},
    h('button', { class: 'deadline', type: 'button', onclick: () => openLetter(letter) },
      h('span', { class: 'deadline-when' }, formatWhen(date, country)),
      h('span', { class: `deadline-left ${daysLeft < 0 ? 'high' : tone(daysLeft)}` }, upper(describeDaysLeft(daysLeft))),
      h('span', { class: 'deadline-what' },
        h('strong', {}, date.label),
        what ? ` · ${what}` : '',
        date.estimated ? ' · estimated' : '')));
}

function deadlinesCard(letters) {
  const { upcoming, passed } = openDeadlines(letters, todayIso());
  let empty = 'Deadlines from the letters you keep show up here.';
  if (letters.length) empty = 'No open deadlines.';
  return h('section', { class: 'card letters-deadlines', 'aria-labelledby': 'letters-deadlines-title' },
    h('h2', { id: 'letters-deadlines-title' }, 'Open deadlines'),
    upcoming.length ? h('ol', { class: 'deadlines' }, upcoming.map(deadlineItem)) : h('p', { class: 'muted' }, empty),
    passed.length ? h('details', { class: 'deadlines-passed' },
      h('summary', {}, passed.length === 1 ? '1 date has passed' : `${passed.length} dates have passed`),
      h('p', { class: 'muted small' }, 'Mark a letter as done when it’s sorted, and its dates go away.'),
      h('ol', { class: 'deadlines' }, passed.map(deadlineItem))) : null);
}

function noteForm(letter) {
  const input = h('input', { type: 'text', maxlength: String(NOTE_LIMIT), value: letter.note ?? '', 'aria-label': 'Note', placeholder: 'For example: paid on 3 November' });
  const form = h('form', { class: 'kept-note-form', hidden: true },
    input,
    h('button', { class: 'button primary small', type: 'submit' }, 'Save note'),
    h('button', { class: 'button ghost small', type: 'button', onclick: () => { form.hidden = true; } }, 'Cancel'));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    guard(async () => {
      await folder.update(letter.id, { note: input.value });
      await render();
      app.toast(input.value.trim() ? 'Note saved' : 'Note removed');
    });
  });
  return { form, input };
}

function letterItem(letter) {
  const country = countryById(letter.country);
  const sender = letter.summary?.sender;
  const next = letter.done ? null : nextDeadline(letter, todayIso());
  const { toPay, toGet } = letter.summary ?? {};
  const note = noteForm(letter);
  return h('article', { class: `kept${letter.done ? ' done' : ''}` },
    h('div', { class: 'kept-head' },
      h('img', { class: 'flag', src: `/icons/flags/${country.id}.svg`, alt: '', width: 21, height: 14 }),
      h('h3', {}, titleOf(letter)),
      letter.done ? h('span', { class: 'badge low' }, 'Done') : null),
    h('p', { class: 'kept-meta' }, [sender ? `From ${sender.local}` : null, country.name, `Kept on ${keptOn(letter)}`].filter(Boolean).join(' · ')),
    next ? h('p', { class: `kept-next ${tone(next.daysLeft)}` }, `${next.date.label}: ${formatWhen(next.date, country)} — ${describeDaysLeft(next.daysLeft)}`) : null,
    toPay ? h('p', { class: 'kept-money' }, `To pay: ${formatMoney(toPay)}${toPay.monthly ? ' / month' : ''}`) : null,
    toGet ? h('p', { class: 'kept-money' }, `You get: ${formatMoney(toGet)}${toGet.monthly ? ' / month' : ''}`) : null,
    letter.note ? h('p', { class: 'kept-note' }, h('strong', {}, 'Note: '), letter.note) : null,
    h('div', { class: 'kept-actions' },
      h('button', { class: 'button secondary small', type: 'button', onclick: () => openLetter(letter) }, 'Open'),
      h('button', {
        class: 'button ghost small',
        type: 'button',
        onclick: () => guard(async () => {
          await folder.update(letter.id, { done: !letter.done });
          await render();
          app.toast(letter.done ? 'Marked as not done' : 'Marked as done');
        }),
      }, letter.done ? 'Not done yet' : 'Mark as done'),
      h('button', {
        class: 'button ghost small',
        type: 'button',
        onclick: () => {
          touch();
          note.form.hidden = false;
          note.input.focus();
        },
      }, letter.note ? 'Edit note' : 'Add note'),
      h('button', {
        class: 'button ghost small danger',
        type: 'button',
        onclick: () => guard(async () => {
          const sure = await confirmDialog({ title: 'Delete this letter?', text: `“${titleOf(letter)}” will be removed from My letters. This can’t be undone.`, confirmLabel: 'Delete' });
          if (!sure) return;
          await folder.remove(letter.id);
          if (lastKept?.id === letter.id) lastKept = null;
          updateKeep();
          await render();
          app.toast('Letter deleted');
        }),
      }, 'Delete')),
    note.form);
}

function allLettersCard(letters) {
  const list = h('div', { class: 'kept-list' });
  const countryName = (id) => countryById(id).name;
  const fill = () => {
    const found = searchLetters(letters, query, countryName);
    list.replaceChildren(...(found.length ? found.map(letterItem) : [h('p', { class: 'muted' }, `No letters match “${query.trim()}”.`)]));
  };
  const search = h('input', {
    class: 'letters-search',
    type: 'search',
    value: query,
    placeholder: 'Search: office, word, number or note',
    'aria-label': 'Search your letters',
    oninput: (event) => {
      touch();
      query = event.target.value;
      fill();
    },
  });
  if (letters.length) fill();
  else list.replaceChildren(h('p', { class: 'muted' }, 'No letters yet. Check a letter, then press ', h('strong', {}, 'Keep this letter'), '.'));
  return h('section', { class: 'card letters-all', 'aria-labelledby': 'letters-all-title' },
    h('h2', { id: 'letters-all-title' }, letters.length ? `All letters (${letters.length})` : 'All letters'),
    letters.length ? search : null,
    list);
}

async function restoreFrom(file) {
  touch();
  let backup;
  try {
    backup = parseBackup(await file.text());
  } catch {
    app.toast('This file is not a Briefly backup.');
    return;
  }
  await guard(async () => {
    const existed = await folder.exists();
    let outcome = null;
    if (!folder.needsPassword(backup)) outcome = await folder.restore(backup);
    else {
      const ready = await passwordDialog({
        title: 'Restore a backup',
        lead: existed
          ? 'Type the password you used when you made this backup. Its letters are added to My letters.'
          : 'Type the password you used when you made this backup. It becomes the password for My letters on this device.',
        submitLabel: 'Restore',
        busyLabel: 'Restoring…',
        wrong: 'That password doesn’t open this backup. Try again.',
        onPassword: async (password) => {
          outcome = await folder.restore(backup, password);
        },
      });
      if (!ready) return;
    }
    startTimer();
    await render();
    const { added } = outcome;
    app.toast(added ? `Restored ${added} ${added === 1 ? 'letter' : 'letters'}` : 'These letters are already here');
  });
}

function restoreButton(label, className) {
  const input = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  input.addEventListener('change', () => {
    const [file] = input.files;
    input.value = '';
    if (file) restoreFrom(file);
  });
  return [input, h('button', { class: className, type: 'button', onclick: () => input.click() }, label)];
}

function deleteAllButton() {
  return h('button', {
    class: 'button ghost small danger',
    type: 'button',
    onclick: () => guard(async () => {
      const sure = await confirmDialog({
        title: 'Delete everything?',
        text: 'This deletes all your saved letters and your password from this device. This can’t be undone.',
        confirmLabel: 'Delete everything',
      });
      if (!sure) return;
      await folder.destroy();
      stopTimer();
      lastKept = null;
      query = '';
      if (showingSaved) app.closeResult();
      showingSaved = false;
      updateKeep();
      await render();
      app.toast('Everything is deleted');
    }),
  }, 'Delete everything');
}

function backupCard() {
  return h('section', { class: 'card letters-backup', 'aria-labelledby': 'letters-backup-title' },
    h('h2', { id: 'letters-backup-title' }, 'Backup'),
    h('p', { class: 'small muted' }, 'Your letters are saved only in this browser. If you clear its data or lose this device, they are gone. A backup file keeps a copy, locked with your password.'),
    h('div', { class: 'reply-actions' },
      h('button', {
        class: 'button secondary small',
        type: 'button',
        onclick: () => guard(async () => {
          const backup = await folder.backup();
          app.download(`briefly-letters-${todayIso()}.json`, JSON.stringify(backup), 'application/json');
          app.toast('Backup ready. It is locked with your password.');
        }),
      }, 'Download a backup'),
      restoreButton('Restore a backup', 'button ghost small')),
    h('h2', { class: 'letters-delete-title' }, 'Delete'),
    h('p', { class: 'small muted' }, 'Removes all letters and the password from this device.'),
    deleteAllButton());
}

function introView() {
  return [
    h('p', { class: 'lead' }, 'Keep the letters you checked. Find them again, and see all your deadlines in one place.'),
    h('section', { class: 'card letters-intro', 'aria-labelledby': 'letters-intro-title' },
      h('h2', { id: 'letters-intro-title' }, 'How it works'),
      h('ul', { class: 'cancel-tips' },
        h('li', {}, 'Nothing is saved until you press ', h('strong', {}, 'Keep this letter'), ' on a result.'),
        h('li', {}, 'Your letters are locked with a password you choose. They stay only on this device and are never uploaded.'),
        h('li', {}, 'If you forget the password, the letters can’t be opened again. Nobody can reset it.'),
        h('li', {}, `My letters locks by itself after ${LOCK_MINUTES} minutes without use, and when you close Briefly.`)),
      h('div', { class: 'reply-actions letters-intro-actions' },
        h('button', {
          class: 'button primary',
          type: 'button',
          onclick: () => {
            history.replaceState(history.state, '', `${location.pathname}${location.search}`);
            app.show('start');
          },
        }, 'Check a letter'),
        restoreButton('Restore from a backup file', 'button ghost'))),
  ];
}

function lockedView() {
  const { input, field } = passwordField('letters-password', 'Password', 'current-password');
  const error = h('p', { class: 'folder-error', role: 'alert', hidden: true });
  const submit = h('button', { class: 'button primary', type: 'submit' }, 'Unlock');
  const form = h('form', { class: 'card folder-unlock', novalidate: true, 'aria-labelledby': 'letters-locked-title' },
    h('h2', { id: 'letters-locked-title' }, 'Locked'),
    h('p', {}, 'Your letters are locked. Type your password to open them.'),
    usernameField(),
    field,
    revealToggle([input], 'letters-reveal'),
    error,
    submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    if (!input.value) {
      error.textContent = 'Please type your password.';
      error.hidden = false;
      input.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Unlocking…';
    try {
      await folder.unlock(input.value);
      startTimer();
      updateKeep();
      await render();
    } catch (problem) {
      submit.disabled = false;
      submit.textContent = 'Unlock';
      error.textContent = problem instanceof WrongPassword ? 'That password is not right. Check it and try again.' : storageMessage(problem);
      error.hidden = false;
      input.focus();
      input.select();
    }
  });
  return [
    form,
    h('details', { class: 'card folder-forgot' },
      h('summary', {}, 'Forgot your password?'),
      h('p', {}, 'Without the password, your saved letters can’t be opened. Nobody can reset it — that is what keeps them safe. You can delete them and start again.'),
      deleteAllButton()),
  ];
}

function unlockedView(letters) {
  return [
    h('p', { class: 'muted letters-lead' }, `Saved only on this device and locked with your password. It locks by itself after ${LOCK_MINUTES} minutes without use.`),
    h('div', { class: 'letters-grid' }, deadlinesCard(letters), allLettersCard(letters), backupCard()),
  ];
}

async function render() {
  const run = ++renderRun;
  const body = $('#letters-body');
  const unlocked = Boolean(folder?.isUnlocked());
  $('#letters-lock').hidden = !unlocked;
  if (!folder) {
    body.replaceChildren(h('p', { class: 'notice error' }, 'This browser can’t keep letters. Try the latest Chrome, Edge, Firefox or Safari.'));
    return;
  }
  let view;
  try {
    if (!(await folder.exists())) view = introView();
    else if (!unlocked) view = lockedView();
    else view = unlockedView(await folder.letters());
  } catch (error) {
    console.error(error);
    if (error instanceof Locked) view = lockedView();
    else view = [h('p', { class: 'notice error' }, storageMessage(error))];
  }
  if (run !== renderRun) return;
  $('#letters-lock').hidden = !folder.isUnlocked();
  body.replaceChildren(...view);
  if (!unlocked) $('#letters-password')?.focus();
}

async function openView() {
  app.show('letters');
  await render();
  if (!$('#letters-password')) $('#letters .letters-title').focus();
}

function route() {
  if (location.hash === '#letters') openView();
  else if (!$('#letters').hidden) app.leave();
}

export function showKeep(result, source) {
  shown = result;
  showingSaved = source === 'saved';
  updateKeep();
}

export function setupLetters(options) {
  app = options;
  if (canEncrypt() && 'indexedDB' in window) folder = createFolder();
  $('#keep').addEventListener('click', keep);
  $('#letters-lock').addEventListener('click', () => {
    lock();
    app.toast('My letters is locked');
  });
  $('#letters-back').addEventListener('click', () => {
    if (fromStart) {
      history.back();
      return;
    }
    history.replaceState(history.state, '', `${location.pathname}${location.search}`);
    app.leave();
  });
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(type, touch, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkIdle();
  });
  window.addEventListener('pagehide', () => lock());
  window.addEventListener('hashchange', () => {
    fromStart = location.hash === '#letters';
    route();
  });
  route();
}
