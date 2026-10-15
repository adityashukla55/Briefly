import './polyfills.js';
import { ReadError } from './errors.js';

const vendor = (path) => new URL(`../vendor/${path}`, import.meta.url).href;

const MAX_PDF_PAGES = 8;
const MAX_SIDE = 3000;
const MIN_WIDTH = 1600;

let ocrWorker = null;
let ocrLanguage = null;
let reportProgress = () => {};

const OCR_STEPS = {
  'loading tesseract core': 'Starting the text reader',
  'initializing tesseract': 'Starting the text reader',
  'loading language traineddata': 'Loading the language',
  'initializing api': 'Starting the text reader',
  'recognizing text': 'Reading the text',
};

async function getOcr(language) {
  if (ocrWorker && ocrLanguage !== language) {
    const worker = await ocrWorker;
    await worker.reinitialize(language, 1);
    ocrLanguage = language;
  }
  if (!ocrWorker) {
    ocrLanguage = language;
    ocrWorker = (async () => {
      const { default: Tesseract } = await import(vendor('tesseract/tesseract.esm.min.js'));
      return Tesseract.createWorker(language, 1, {
        workerPath: vendor('tesseract/worker.min.js'),
        corePath: vendor('tesseract-core/'),
        langPath: vendor('lang'),
        workerBlobURL: false,
        cacheMethod: 'none',
        logger: (message) => {
          const label = OCR_STEPS[message.status];
          if (label) reportProgress(label, message.progress);
        },
      });
    })().catch((error) => {
      ocrWorker = null;
      ocrLanguage = null;
      throw error;
    });
  }
  return ocrWorker;
}

function isHeic(file) {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

async function loadWithImageElement(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function decodeImage(file) {
  const attempts = [
    () => createImageBitmap(file, { imageOrientation: 'from-image' }),
    () => createImageBitmap(file),
    () => loadWithImageElement(file),
  ];
  for (const attempt of attempts) {
    try {
      const image = await attempt();
      if (image.width && image.height) return image;
    } catch {}
  }
  if (isHeic(file)) {
    throw new ReadError('This photo format isn’t supported here', 'HEIC photos from iPhone only open in Safari. Take a screenshot of the photo and use that, or set the camera to “Most Compatible” (Settings → Camera → Formats).');
  }
  throw new ReadError('We couldn’t open this photo', 'The file may be damaged or in a format the browser can’t show. Try a JPG or PNG, or take a screenshot of the letter.');
}

async function prepareImage(file) {
  const image = await decodeImage(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  let scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  if (width * scale < MIN_WIDTH) scale = Math.min(MIN_WIDTH / width, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if ('filter' in context) context.filter = 'grayscale(1) contrast(1.15)';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (image.close) image.close();
  return canvas;
}

function ocrLines(blocks) {
  return (blocks ?? []).flatMap((block) => block.paragraphs.flatMap((paragraph) => paragraph.lines.map((line) => ({
    words: line.words.map(({ text, bbox }) => ({ text, x0: bbox.x0, y0: bbox.y0, x1: bbox.x1, y1: bbox.y1 })),
  }))));
}

async function recognize(canvas, language) {
  const worker = await getOcr(language);
  const { data } = await worker.recognize(canvas, { rotateAuto: true }, { text: true, blocks: true });
  return { text: data.text, lines: ocrLines(data.blocks), angle: data.rotateRadians ?? 0, width: canvas.width, height: canvas.height };
}

let pdfjs = null;

async function getPdfjs() {
  if (!pdfjs) {
    pdfjs = await import(vendor('pdfjs/pdf.min.mjs'));
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdf-worker.js', import.meta.url).href;
  }
  return pdfjs;
}

function pageText(content) {
  return content.items.map((item) => `${item.str ?? ''}${item.hasEOL ? '\n' : ''}`).join('').replace(/[ \t]+\n/g, '\n');
}

let measurer = null;

function splitWords(text, box, family) {
  measurer ??= document.createElement('canvas').getContext('2d');
  measurer.font = `100px ${family || 'sans-serif'}`;
  const scale = (box.x1 - box.x0) / (measurer.measureText(text).width || 1);
  return [...text.matchAll(/\S+/g)].map((match) => {
    const before = measurer.measureText(text.slice(0, match.index)).width * scale;
    const width = measurer.measureText(match[0]).width * scale;
    return { text: match[0], x0: box.x0 + before, x1: box.x0 + before + width, y0: box.y0, y1: box.y1 };
  });
}

function pdfLines(content, viewport, lib) {
  const lines = [];
  let line = null;
  let previous = null;
  for (const item of content.items) {
    if (typeof item.str !== 'string') continue;
    const matrix = lib.Util.transform(viewport.transform, item.transform);
    const size = Math.hypot(matrix[2], matrix[3]);
    if (item.str.trim() && size && Math.abs(matrix[1]) < size * 0.01 && Math.abs(matrix[2]) < size * 0.01) {
      const style = content.styles[item.fontName] ?? {};
      const ascent = style.ascent || (style.descent ? 1 + style.descent : 0.8);
      const top = matrix[5] - size * ascent;
      const box = { x0: matrix[4], y0: top, x1: matrix[4] + item.width * viewport.scale, y1: top + size };
      if (!line || Math.abs(top - previous.box.y0) > size * 0.5 || box.x0 < previous.box.x1 - size) {
        line = { words: [] };
        lines.push(line);
      }
      const words = splitWords(item.str, box, style.fontFamily);
      const last = line.words.at(-1);
      if (last && box.x0 - last.x1 < size * 0.15 && /\S$/.test(previous.str) && /^\S/.test(item.str)) {
        const first = words.shift();
        last.text += first.text;
        last.x1 = first.x1;
      }
      line.words.push(...words);
      previous = { box, str: item.str };
    }
    if (item.hasEOL) line = null;
  }
  return lines;
}

async function openPdf(file) {
  const lib = await getPdfjs();
  const task = lib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    wasmUrl: vendor('pdfjs/wasm/'),
    standardFontDataUrl: vendor('pdfjs/standard_fonts/'),
    cMapUrl: vendor('pdfjs/cmaps/'),
    iccUrl: vendor('pdfjs/iccs/'),
    isEvalSupported: false,
  });
  try {
    return { task, doc: await task.promise };
  } catch (error) {
    task.destroy();
    if (error?.name === 'PasswordException') {
      throw new ReadError('This PDF is locked with a password', 'Open it, save a copy without the password, or take a screenshot of each page and use those.');
    }
    if (error?.name === 'InvalidPDFException') {
      throw new ReadError('This PDF looks damaged', 'Try opening it and saving it again, or take a photo of the letter instead.');
    }
    throw error;
  }
}

async function readPdf(file, onStep, language) {
  const { task, doc } = await openPdf(file);
  try {
    const count = Math.min(doc.numPages, MAX_PDF_PAGES);
    const pages = [];
    for (let number = 1; number <= count; number += 1) {
      const page = await doc.getPage(number);
      const content = await page.getTextContent();
      pages.push({ page, number, content, text: pageText(content) });
    }
    const hasTextLayer = pages.some(({ text }) => text.replace(/\s/g, '').length >= 60);
    const lib = await getPdfjs();
    const texts = [];
    const layouts = [];
    for (const { page, number, content, text } of pages) {
      if (hasTextLayer) {
        const viewport = page.getViewport({ scale: 1 });
        texts.push(text);
        layouts.push({ kind: 'pdf', file, number, width: viewport.width, height: viewport.height, angle: 0, lines: pdfLines(content, viewport, lib) });
        continue;
      }
      onStep(`Reading page ${number} of ${count}`);
      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, viewport }).promise;
      const read = await recognize(canvas, language);
      texts.push(read.text);
      layouts.push({ kind: 'pdf', file, number, width: read.width, height: read.height, angle: read.angle, lines: read.lines });
    }
    return { text: texts.join('\n\n'), total: doc.numPages, read: count, pages: layouts };
  } finally {
    await task.destroy();
  }
}

const PDF_DECODERS = ['pdfjs/wasm/openjpeg.wasm', 'pdfjs/wasm/jbig2.wasm', 'pdfjs/wasm/qcms_bg.wasm'];

const SIMD = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
const RELAXED_SIMD = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 15, 1, 13, 0, 65, 1, 253, 15, 65, 2, 253, 15, 253, 128, 2, 11]);

function supports(bytes) {
  try {
    return WebAssembly.validate(bytes);
  } catch {
    return false;
  }
}

function coreFile() {
  if (supports(RELAXED_SIMD)) return 'tesseract-core/tesseract-core-relaxedsimd-lstm.wasm.js';
  if (supports(SIMD)) return 'tesseract-core/tesseract-core-simd-lstm.wasm.js';
  return 'tesseract-core/tesseract-core-lstm.wasm.js';
}

function readerFiles(language) {
  return [coreFile(), `lang/${language}.traineddata.gz`, 'tesseract/tesseract.esm.min.js', 'tesseract/worker.min.js', 'pdfjs/pdf.min.mjs', 'pdfjs/pdf.worker.min.mjs', ...PDF_DECODERS];
}

export async function prepareReader(language, onStep = () => {}) {
  const files = readerFiles(language);
  for (const [index, path] of files.entries()) {
    onStep(`${Math.round((index / files.length) * 100)}%`);
    if (await caches.match(vendor(path))) continue;
    const response = await fetch(vendor(path));
    if (!response.ok) throw new Error(`Could not save ${path}`);
    await response.arrayBuffer();
  }
  onStep('100%');
}

export async function missingReaderFiles(language) {
  if (!('caches' in self)) return readerFiles(language);
  const files = readerFiles(language);
  const found = await Promise.all(files.map((path) => caches.match(vendor(path))));
  return files.filter((path, index) => !found[index]);
}

export async function isReaderSaved(language) {
  return (await missingReaderFiles(language)).length === 0;
}

export function isSupported(file) {
  return file.type === 'application/pdf' || file.type.startsWith('image/') || file.type === 'text/plain' || /\.(pdf|png|jpe?g|webp|heic|heif|txt)$/i.test(file.name);
}

export async function renderPdfPage(file, number, width) {
  const { task, doc } = await openPdf(file);
  try {
    const page = await doc.getPage(number);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    return canvas;
  } finally {
    await task.destroy();
  }
}

export async function readFiles(files, { language = 'deu', onProgress = () => {} } = {}) {
  const texts = [];
  const pages = [];
  const shortened = [];
  let usedOcr = false;
  const list = [...files];
  for (const [position, file] of list.entries()) {
    const prefix = list.length > 1 ? `File ${position + 1} of ${list.length}: ` : '';
    reportProgress = (label, progress) => onProgress(`${prefix}${label}`, progress);
    if (file.type === 'text/plain' || /\.txt$/i.test(file.name)) {
      texts.push(await file.text());
    } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      onProgress(`${prefix}Opening the PDF`, null);
      const pdf = await readPdf(file, (label) => { usedOcr = true; onProgress(`${prefix}${label}`, null); }, language);
      texts.push(pdf.text);
      pages.push(...pdf.pages);
      if (pdf.total > pdf.read) shortened.push({ name: file.name, total: pdf.total, read: pdf.read });
    } else {
      usedOcr = true;
      onProgress(`${prefix}Preparing the photo`, null);
      const read = await recognize(await prepareImage(file), language);
      texts.push(read.text);
      pages.push({ kind: 'image', file, width: read.width, height: read.height, angle: read.angle, lines: read.lines });
    }
  }
  return { text: texts.join('\n\n').trim(), usedOcr, shortened, pages };
}
