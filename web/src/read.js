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

async function decodeImage(file) {
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

async function recognize(canvas, language) {
  const worker = await getOcr(language);
  const { data } = await worker.recognize(canvas, { rotateAuto: true });
  return data.text;
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
      pages.push({ page, number, text: pageText(await page.getTextContent()) });
    }
    const hasTextLayer = pages.some(({ text }) => text.replace(/\s/g, '').length >= 60);
    const texts = [];
    for (const { page, number, text } of pages) {
      if (hasTextLayer) {
        texts.push(text);
        continue;
      }
      onStep(`Reading page ${number} of ${count}`);
      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, viewport }).promise;
      texts.push(await recognize(canvas, language));
    }
    return texts.join('\n\n');
  } finally {
    await task.destroy();
  }
}

const PDF_DECODERS = ['pdfjs/wasm/openjpeg.wasm', 'pdfjs/wasm/jbig2.wasm', 'pdfjs/wasm/qcms_bg.wasm'];

export async function prepareReader(language, onStep = () => {}) {
  const previous = reportProgress;
  reportProgress = (label) => onStep(label);
  try {
    await getOcr(language);
  } finally {
    reportProgress = previous;
  }
  await Promise.all(PDF_DECODERS.map((path) => fetch(vendor(path)).then((response) => response.arrayBuffer())));
}

export async function isReaderSaved(language) {
  if (!('caches' in self)) return false;
  const needed = [`lang/${language}.traineddata.gz`, 'tesseract/worker.min.js', 'tesseract/tesseract.esm.min.js', 'pdfjs/pdf.min.mjs', 'pdfjs/pdf.worker.min.mjs', ...PDF_DECODERS];
  const found = await Promise.all(needed.map((path) => caches.match(vendor(path))));
  if (!found.every(Boolean)) return false;
  for (const key of await caches.keys()) {
    const requests = await (await caches.open(key)).keys();
    if (requests.some((request) => request.url.includes('/vendor/tesseract-core/'))) return true;
  }
  return false;
}

export function isSupported(file) {
  return file.type === 'application/pdf' || file.type.startsWith('image/') || file.type === 'text/plain' || /\.(pdf|png|jpe?g|webp|heic|heif|txt)$/i.test(file.name);
}

export async function readFiles(files, { language = 'deu', onProgress = () => {} } = {}) {
  const texts = [];
  let usedOcr = false;
  const list = [...files];
  for (const [position, file] of list.entries()) {
    const prefix = list.length > 1 ? `File ${position + 1} of ${list.length}: ` : '';
    reportProgress = (label, progress) => onProgress(`${prefix}${label}`, progress);
    if (file.type === 'text/plain' || /\.txt$/i.test(file.name)) {
      texts.push(await file.text());
    } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      onProgress(`${prefix}Opening the PDF`, null);
      texts.push(await readPdf(file, (label) => { usedOcr = true; onProgress(`${prefix}${label}`, null); }, language));
    } else {
      usedOcr = true;
      onProgress(`${prefix}Preparing the photo`, null);
      texts.push(await recognize(await prepareImage(file), language));
    }
  }
  return { text: texts.join('\n\n').trim(), usedOcr };
}
