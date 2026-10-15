import { h } from './dom.js';
import { decodeImage, renderPdfPage } from './read.js';
import { findPrivate } from './redact.js';

const MAX_SIDE = 2200;
const PDF_WIDTH = 1700;

const KINDS = [
  ['address', 'Name and address'],
  ['name', 'Names'],
  ['bank', 'Bank accounts'],
  ['number', 'Reference and customer numbers'],
  ['id', 'Tax and ID numbers'],
  ['birth', 'Birth dates'],
  ['phone', 'Phone numbers'],
  ['email', 'Email addresses'],
];

const TOUCH = window.matchMedia('(any-pointer: coarse)');

let session = 0;
let state = null;

export function hideCard(onOpen) {
  return h('div', { class: 'card hide-card' },
    h('div', {},
      h('h2', {}, 'Share the letter safely'),
      h('p', {}, 'Want a friend or an advice centre to look at your letter? Briefly first covers your name, address, bank and reference numbers with black boxes.')),
    h('button', { class: 'button secondary', type: 'button', onclick: onOpen }, 'Hide private details and share'));
}

function straighten(source, width, height, angle) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.translate(width / 2, height / 2);
  context.rotate(angle);
  context.drawImage(source, -width / 2, -height / 2, width, height);
  return canvas;
}

async function pageImage(page) {
  if (page.kind === 'pdf') {
    const canvas = await renderPdfPage(page.file, page.number, PDF_WIDTH);
    if (!page.angle) return canvas;
    const straight = straighten(canvas, canvas.width, canvas.height, page.angle);
    canvas.width = 0;
    return straight;
  }
  const image = await decodeImage(page.file);
  const scale = Math.min(1, MAX_SIDE / Math.max(page.width, page.height));
  const canvas = straighten(image, Math.round(page.width * scale), Math.round(page.height * scale), page.angle);
  image.close?.();
  return canvas;
}

function snap(box) {
  return { x: Math.floor(box.x0), y: Math.floor(box.y0), width: Math.ceil(box.x1) - Math.floor(box.x0), height: Math.ceil(box.y1) - Math.floor(box.y0) };
}

function paint(context, item) {
  context.drawImage(item.base, 0, 0);
  context.fillStyle = '#000';
  for (const box of item.boxes) {
    if (!box.on) continue;
    const { x, y, width, height } = snap(box);
    context.fillRect(x, y, width, height);
  }
}

function draw(item) {
  const context = item.view.getContext('2d');
  paint(context, item);
  const line = Math.max(2, item.view.width / 450);
  context.save();
  context.lineWidth = line;
  context.setLineDash([line * 3, line * 2]);
  context.strokeStyle = '#d92d20';
  for (const box of item.boxes) {
    if (!box.on) context.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
  }
  if (item.preview) {
    const { x0, y0, x1, y1 } = item.preview;
    context.fillStyle = 'rgb(0 0 0 / 45%)';
    context.fillRect(x0, y0, x1 - x0, y1 - y0);
    context.setLineDash([]);
    context.strokeStyle = '#000';
    context.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }
  context.restore();
}

function hiddenCount() {
  return state.items.reduce((sum, item) => sum + item.boxes.filter((box) => box.on).length, 0);
}

function changed(items = state.items) {
  state.blobs = null;
  for (const item of items) draw(item);
  const count = hiddenCount();
  state.status.textContent = count ? `${count} ${count === 1 ? 'part' : 'parts'} hidden` : 'Nothing hidden yet';
  state.undoButton.disabled = !state.undo.length;
  renderKinds();
}

function setBoxes(changes) {
  state.undo.push({ type: 'set', changes: changes.map(([box]) => [box, box.on]) });
  for (const [box, on] of changes) box.on = on;
}

function undo() {
  const step = state.undo.pop();
  if (!step) return;
  if (step.type === 'set') for (const [box, on] of step.changes) box.on = on;
  if (step.type === 'add') step.item.boxes.splice(step.item.boxes.indexOf(step.box), 1);
  if (step.type === 'remove') step.item.boxes.splice(step.index, 0, step.box);
  changed();
}

function renderKinds() {
  const autos = state.items.flatMap((item) => item.boxes.filter((box) => box.auto));
  const rows = KINDS.map(([kind, label]) => ({ kind, label, boxes: autos.filter((box) => box.kind === kind) })).filter((row) => row.boxes.length);
  if (!rows.length) {
    state.kinds.replaceChildren(h('p', { class: 'muted small' }, 'Briefly didn’t find private details by itself. Drag over anything you want to hide.'));
    return;
  }
  state.kinds.replaceChildren(h('ul', { class: 'hide-kinds' }, rows.map((row) => {
    const on = row.boxes.filter((box) => box.on).length;
    const input = h('input', {
      type: 'checkbox',
      id: `hide-kind-${row.kind}`,
      checked: on === row.boxes.length,
      onchange: (event) => {
        setBoxes(row.boxes.map((box) => [box, event.target.checked]));
        changed();
      },
    });
    input.indeterminate = on > 0 && on < row.boxes.length;
    return h('li', {}, input, h('label', { for: input.id }, row.label, h('span', { class: 'hide-kind-count' }, String(row.boxes.length))));
  })));
}

function boxAt(item, point) {
  const reach = 10 * point.ratio;
  const hits = item.boxes.filter((box) => point.x >= box.x0 - reach && point.x <= box.x1 + reach && point.y >= box.y0 - reach && point.y <= box.y1 + reach);
  return hits.sort((a, b) => (a.x1 - a.x0) * (a.y1 - a.y0) - (b.x1 - b.x0) * (b.y1 - b.y0))[0] ?? null;
}

function tap(item, point) {
  const box = boxAt(item, point);
  if (!box) return;
  if (box.auto) setBoxes([[box, !box.on]]);
  else {
    const index = item.boxes.indexOf(box);
    item.boxes.splice(index, 1);
    state.undo.push({ type: 'remove', item, box, index });
  }
  changed([item]);
}

function rectFrom(a, b, canvas) {
  const clamp = (value, max) => Math.min(Math.max(value, 0), max);
  return {
    x0: clamp(Math.min(a.x, b.x), canvas.width),
    y0: clamp(Math.min(a.y, b.y), canvas.height),
    x1: clamp(Math.max(a.x, b.x), canvas.width),
    y1: clamp(Math.max(a.y, b.y), canvas.height),
  };
}

function attach(item) {
  const canvas = item.view;
  let press = null;
  const point = (event) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = canvas.width / rect.width;
    return { x: (event.clientX - rect.left) * ratio, y: (event.clientY - rect.top) * ratio, ratio };
  };
  canvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const drawing = event.pointerType !== 'touch' || state.draw;
    press = { id: event.pointerId, start: point(event), drawing, moved: false };
    if (drawing) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {}
      event.preventDefault();
    }
  });
  canvas.addEventListener('pointermove', (event) => {
    const now = point(event);
    if (!press) {
      if (event.pointerType === 'mouse') canvas.style.cursor = boxAt(item, now) ? 'pointer' : 'crosshair';
      return;
    }
    if (event.pointerId !== press.id) return;
    if (Math.hypot(now.x - press.start.x, now.y - press.start.y) / now.ratio > 6) press.moved = true;
    if (press.drawing && press.moved) {
      item.preview = rectFrom(press.start, now, canvas);
      draw(item);
    }
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!press || event.pointerId !== press.id) return;
    const now = point(event);
    const { drawing, moved, start } = press;
    press = null;
    item.preview = null;
    if (drawing && moved) {
      const box = { ...rectFrom(start, now, canvas), kind: 'own', auto: false, on: true };
      if (box.x1 - box.x0 > 4 * now.ratio && box.y1 - box.y0 > 4 * now.ratio) {
        item.boxes.push(box);
        state.undo.push({ type: 'add', item, box });
        changed([item]);
      } else draw(item);
    } else if (!moved) tap(item, now);
  });
  canvas.addEventListener('pointercancel', () => {
    press = null;
    item.preview = null;
    draw(item);
  });
}

async function makeBlobs() {
  if (state.blobs) return state.blobs;
  const blobs = [];
  for (const item of state.items) {
    const canvas = document.createElement('canvas');
    canvas.width = item.base.width;
    canvas.height = item.base.height;
    paint(canvas.getContext('2d'), item);
    blobs.push(await new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not make the image'))), 'image/png')));
    canvas.width = 0;
  }
  state.blobs = blobs;
  return blobs;
}

function fileNames(count) {
  return Array.from({ length: count }, (_, index) => (count > 1 ? `briefly-letter-page-${index + 1}.png` : 'briefly-letter.png'));
}

async function makeFiles() {
  const blobs = await makeBlobs();
  const names = fileNames(blobs.length);
  return blobs.map((blob, index) => new File([blob], names[index], { type: 'image/png' }));
}

function canShareFiles() {
  try {
    return Boolean(navigator.canShare?.({ files: [new File([''], 'page.png', { type: 'image/png' })] }));
  } catch {
    return false;
  }
}

async function busy(button, label, work) {
  const text = button.textContent;
  button.disabled = true;
  button.textContent = label;
  try {
    await work();
  } catch (error) {
    if (error?.name === 'AbortError') return;
    if (error?.name === 'NotAllowedError') state.toast('Ready. Tap the button again.');
    else {
      console.error(error);
      state.toast('Something went wrong. Please try again.');
    }
  } finally {
    button.disabled = false;
    button.textContent = text;
  }
}

async function saveImages() {
  const blobs = await makeBlobs();
  const names = fileNames(blobs.length);
  for (const [index, blob] of blobs.entries()) {
    const url = URL.createObjectURL(blob);
    const link = h('a', { href: url, download: names[index] });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    if (index < blobs.length - 1) await new Promise((resolve) => setTimeout(resolve, 400));
  }
  state.toast(blobs.length > 1 ? `${blobs.length} images saved` : 'Image saved');
}

async function sharePages() {
  await navigator.share({ files: await makeFiles(), title: 'Letter' });
}

async function printPages() {
  const urls = (await makeBlobs()).map((blob) => URL.createObjectURL(blob));
  const sheet = h('div', { class: 'print-sheet print-pages' }, urls.map((url, index) => h('img', { src: url, alt: `Page ${index + 1}` })));
  document.body.append(sheet);
  await Promise.all([...sheet.querySelectorAll('img')].map((image) => image.decode().catch(() => {})));
  document.documentElement.classList.add('printing');
  window.addEventListener('afterprint', () => {
    sheet.remove();
    document.documentElement.classList.remove('printing');
    for (const url of urls) URL.revokeObjectURL(url);
  }, { once: true });
  window.print();
}

function setDraw(on) {
  state.draw = on;
  state.drawButton?.setAttribute('aria-pressed', String(on));
  state.root.classList.toggle('hide-drawing', on);
}

function header(back) {
  return [
    h('div', { class: 'result-top' }, h('button', { class: 'link back', type: 'button', onclick: back }, '← Back to the result')),
    h('h1', { class: 'hide-title', tabindex: '-1' }, 'Hide private details'),
    h('p', { class: 'lead' }, 'Black boxes cover your name, address, bank and reference numbers and other private details. Check them, then save or share the letter.'),
  ];
}

function free() {
  for (const item of state?.items ?? []) {
    item.base.width = 0;
    item.view.width = 0;
  }
  state = null;
}

export function closeHide(container) {
  session += 1;
  free();
  container.replaceChildren();
}

export async function openHide(container, pages, country, { back, toast }) {
  const run = ++session;
  free();
  container.replaceChildren(...header(back), h('div', { class: 'card hide-loading' }, h('div', { class: 'spinner', 'aria-hidden': 'true' }), h('p', {}, 'Getting the pages ready…')));
  container.querySelector('.hide-title').focus();
  const items = [];
  try {
    const found = findPrivate(pages, country);
    for (const [index, page] of pages.entries()) {
      const base = await pageImage(page);
      if (run !== session) {
        base.width = 0;
        for (const item of items) item.base.width = 0;
        return;
      }
      const scale = base.width / page.width;
      const boxes = found.filter((box) => box.page === index).map((box) => ({ x0: box.x0 * scale, y0: box.y0 * scale, x1: box.x1 * scale, y1: box.y1 * scale, kind: box.kind, auto: true, on: true }));
      items.push({ base, boxes, view: null, preview: null });
    }
  } catch (error) {
    console.error(error);
    for (const item of items) item.base.width = 0;
    if (run !== session) return;
    container.replaceChildren(...header(back), h('p', { class: 'notice error' }, 'Briefly couldn’t open the pages again. Go back and add the letter once more.'));
    return;
  }

  const touch = TOUCH.matches;
  state = { root: container, items, undo: [], blobs: null, draw: false, toast };
  state.status = h('p', { class: 'hide-status', 'aria-live': 'polite' });
  state.undoButton = h('button', { class: 'button ghost small', type: 'button', onclick: undo }, 'Undo');
  state.drawButton = touch ? h('button', { class: 'button ghost small hide-draw', type: 'button', 'aria-pressed': 'false', onclick: () => setDraw(!state.draw) }, 'Draw boxes') : null;
  state.kinds = h('div', {});

  const figures = items.map((item, index) => {
    item.view = h('canvas', { class: 'hide-canvas', width: item.base.width, height: item.base.height, role: 'img', 'aria-label': `Page ${index + 1} of the letter, with private details covered` });
    attach(item);
    return h('figure', { class: 'hide-page' }, item.view, items.length > 1 ? h('figcaption', {}, `Page ${index + 1} of ${items.length}`) : null);
  });

  const shareButton = canShareFiles() ? h('button', { class: 'button primary', type: 'button', onclick: (event) => busy(event.currentTarget, 'Preparing…', sharePages) }, 'Share') : null;
  const saveButton = h('button', { class: `button ${shareButton ? 'secondary' : 'primary'}`, type: 'button', onclick: (event) => busy(event.currentTarget, 'Preparing…', saveImages) }, items.length > 1 ? 'Save as images' : 'Save as image');
  const printButton = h('button', { class: 'button ghost', type: 'button', onclick: (event) => busy(event.currentTarget, 'Preparing…', printPages) }, 'Print or save as PDF');

  container.replaceChildren(
    ...header(back),
    h('div', { class: 'hide-layout' },
      h('div', { class: 'hide-pages' },
        h('div', { class: 'hide-toolbar' },
          h('div', {},
            state.status,
            h('p', { class: 'hide-hint' }, touch
              ? 'Tap a black box to remove it. To add one, turn on “Draw boxes” and drag over the page.'
              : 'Click a black box to remove it. Drag over the page to add a new one.')),
          h('div', { class: 'hide-tools' }, state.drawButton, state.undoButton)),
        figures),
      h('div', { class: 'hide-side' },
        h('div', { class: 'card' }, h('h2', {}, 'What is hidden'), state.kinds),
        h('div', { class: 'card' },
          h('h2', {}, 'Save or share'),
          h('p', { class: 'notice hide-check' }, h('strong', {}, 'Check before you share. '), 'Look at every page. Briefly can miss things, like handwriting, stamps or text it couldn’t read.'),
          h('div', { class: 'reply-actions' }, shareButton, saveButton, printButton),
          h('p', { class: 'muted small hide-safe' }, 'The saved pages are plain pictures. The hidden text is really gone, and so is photo data like the place a photo was taken. Nothing is kept after you close Briefly.')))));
  container.querySelector('.hide-title').focus();
  changed();
}
