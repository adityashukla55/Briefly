const vendor = (path) => new URL(`../vendor/${path}`, import.meta.url).href;

const MAX_PDF_PAGES = 8;
const MAX_SIDE = 3000;
const MIN_WIDTH = 1600;

let ocrWorker = null;
let reportProgress = () => {};

const OCR_STEPS = {
  'loading tesseract core': 'Starting the text reader',
  'initializing tesseract': 'Starting the text reader',
  'loading language traineddata': 'Loading German',
  'initializing api': 'Starting the text reader',
  'recognizing text': 'Reading the text',
};

async function getOcr() {
  if (!ocrWorker) {
    const { default: Tesseract } = await import(vendor('tesseract/tesseract.esm.min.js'));
    const { createWorker } = Tesseract;
    ocrWorker = createWorker('deu', 1, {
      workerPath: vendor('tesseract/worker.min.js'),
      corePath: vendor('tesseract-core/'),
      langPath: vendor('lang'),
      workerBlobURL: false,
      cacheMethod: 'none',
      logger: (message) => {
        const label = OCR_STEPS[message.status];
        if (label) reportProgress(label, message.progress);
      },
    }).catch((error) => {
      ocrWorker = null;
      throw error;
    });
  }
  return ocrWorker;
}

async function prepareImage(source) {
  const bitmap = source instanceof Blob ? await createImageBitmap(source, { imageOrientation: 'from-image' }) : source;
  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (bitmap.width * scale < MIN_WIDTH) scale = Math.min(MIN_WIDTH / bitmap.width, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.filter = 'grayscale(1) contrast(1.15)';
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (bitmap.close) bitmap.close();
  return canvas;
}

async function recognize(canvas) {
  const worker = await getOcr();
  const { data } = await worker.recognize(canvas, { rotateAuto: true });
  return data.text;
}

let pdfjs = null;

async function getPdfjs() {
  if (!pdfjs) {
    pdfjs = await import(vendor('pdfjs/pdf.min.mjs'));
    pdfjs.GlobalWorkerOptions.workerSrc = vendor('pdfjs/pdf.worker.min.mjs');
  }
  return pdfjs;
}

function pageText(content) {
  return content.items.map((item) => `${item.str ?? ''}${item.hasEOL ? '\n' : ''}`).join('').replace(/[ \t]+\n/g, '\n');
}

async function readPdf(file, onStep) {
  const lib = await getPdfjs();
  const task = lib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    wasmUrl: vendor('pdfjs/wasm/'),
    standardFontDataUrl: vendor('pdfjs/standard_fonts/'),
    cMapUrl: vendor('pdfjs/cmaps/'),
    iccUrl: vendor('pdfjs/iccs/'),
    isEvalSupported: false,
  });
  const doc = await task.promise;
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
    texts.push(await recognize(canvas));
  }
  await task.destroy();
  return texts.join('\n\n');
}

export function isSupported(file) {
  return file.type === 'application/pdf' || file.type.startsWith('image/') || file.type === 'text/plain' || /\.(pdf|png|jpe?g|webp|txt)$/i.test(file.name);
}

export async function readFiles(files, onProgress = () => {}) {
  const texts = [];
  const list = [...files];
  for (const [position, file] of list.entries()) {
    const prefix = list.length > 1 ? `File ${position + 1} of ${list.length}: ` : '';
    reportProgress = (label, progress) => onProgress(`${prefix}${label}`, progress);
    if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
      throw new Error('HEIC photos can’t be opened in the browser. On iPhone, take a screenshot of the photo or set the camera to “Most Compatible”.');
    }
    if (file.type === 'text/plain' || /\.txt$/i.test(file.name)) {
      texts.push(await file.text());
    } else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      onProgress(`${prefix}Opening the PDF`, null);
      texts.push(await readPdf(file, (label) => onProgress(`${prefix}${label}`, null)));
    } else {
      onProgress(`${prefix}Preparing the photo`, null);
      texts.push(await recognize(await prepareImage(file)));
    }
  }
  return texts.join('\n\n').trim();
}
