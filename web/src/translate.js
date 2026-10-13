import { formatShortDate, toIso } from './dates.js';

const vendor = (path) => new URL(`../vendor/${path}`, import.meta.url).href;

const AMOUNT = /(?:(€|EUR|Euro)\s?)?(?<![\d.,])(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})(?!\d)(?:\s?(€|EUR\b|Euro\b))?/g;
const UNTIL_DATE = /\bbis (?:zum |spätestens )?(\d{1,2}\.\d{1,2}\.\d{2,4})/g;
const EURO_OUT = /€(\d+)\.(\d{2})\b/g;
const DATE_OUT = /(?<![\d.])(\d{1,2})\.(\d{1,2})\.(\d{4})(?!\d)/g;

export function beforeTranslation(line) {
  return line
    .replace(/[·•]/g, '-')
    .replace(/§§?\s*/g, 'Paragraf ')
    .replace(AMOUNT, (match, before, whole, cents, after) => (before || after ? `€${whole.replace(/\./g, '')}.${cents}` : match))
    .replace(UNTIL_DATE, (match, date, offset, text) => (/vom\s+\S+\s*$/.test(text.slice(Math.max(0, offset - 25), offset)) ? match : `spätestens am ${date}`));
}

export function afterTranslation(english) {
  return english
    .replace(EURO_OUT, (match, whole, cents) => `€${Number(whole).toLocaleString('en-IE')}.${cents}`)
    .replace(DATE_OUT, (match, day, month, year) => {
      const iso = toIso(Number(year), Number(month), Number(day));
      return iso ? formatShortDate(iso) : match;
    });
}

let translator = null;
let ready = null;

async function modelFiles() {
  const registry = await (await fetch(vendor('models/registry.json'))).json();
  return Object.values(registry.deen);
}

async function download(onProgress) {
  const files = await modelFiles();
  const total = files.reduce((sum, file) => sum + file.size, 0);
  let loaded = 0;
  for (const file of files) {
    const response = await fetch(file.name);
    if (!response.ok || !response.body) throw new Error('Could not load the translator. Check your connection and try again.');
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      loaded += value.length;
      onProgress(Math.min(loaded / total, 1));
    }
  }
}

export async function translatorSize() {
  const files = await modelFiles();
  return files.reduce((sum, file) => sum + file.size, 0);
}

export async function isTranslatorCached() {
  if (!('caches' in self)) return false;
  const files = await modelFiles().catch(() => []);
  if (!files.length) return false;
  const hits = await Promise.all(files.map((file) => caches.match(file.name)));
  return hits.every(Boolean);
}

export function prepareTranslator(onProgress = () => {}) {
  if (!ready) {
    ready = (async () => {
      await download(onProgress);
      const { BatchTranslator } = await import(vendor('bergamot/translator.js'));
      translator = new BatchTranslator({
        registryUrl: vendor('models/registry.json'),
        pivotLanguage: null,
        downloadTimeout: 0,
        workers: 1,
        batchSize: 4,
      });
      return translator;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

export function toParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce((lines, line) => {
        const previous = lines[lines.length - 1];
        const keepBreak = !previous || /^[-•*]\s/.test(line) || /:$/.test(previous) || previous.length < 45 || /^[A-ZÄÖÜ][^.!?]{0,40}$/.test(line);
        if (keepBreak) lines.push(line);
        else lines[lines.length - 1] = `${previous} ${line}`;
        return lines;
      }, [])
      .join('\n'))
    .filter(Boolean);
}

const SALUTATION = /^(?:sehr geehrte|guten tag|hallo|liebe[rs]?\b)/i;

export function shouldTranslate(paragraphIndex, line, greetingIndex) {
  if (!/\p{L}{2,}/u.test(line)) return false;
  if (greetingIndex < 0 || paragraphIndex >= greetingIndex - 1) return true;
  return line.includes(':');
}

export function fixedPhrase(line) {
  const trimmed = line.trim();
  if (/^sehr geehrte damen und herren,?$/i.test(trimmed)) return 'Dear Sir or Madam,';
  const named = trimmed.match(/^sehr geehrte(r)?\s+(frau|herr)\s+(.+?)(,?)$/i);
  if (named) return `Dear ${named[2].toLowerCase() === 'frau' ? 'Ms' : 'Mr'} ${named[3]}${named[4]}`;
  if (/^mit freundlichen grüßen,?$/i.test(trimmed)) return 'Kind regards';
  if (/^im auftrag$/i.test(trimmed)) return 'On behalf of the office';
  return null;
}

export async function translateText(text, onParagraph = () => {}) {
  const engine = await prepareTranslator();
  const paragraphs = toParagraphs(text);
  const greetingIndex = paragraphs.findIndex((paragraph) => SALUTATION.test(paragraph));
  const results = new Array(paragraphs.length).fill(null);
  await Promise.all(paragraphs.map(async (paragraph, index) => {
    const lines = paragraph.split('\n');
    const translated = await Promise.all(lines.map(async (line) => {
      const fixed = fixedPhrase(line);
      if (fixed) return fixed;
      if (!shouldTranslate(index, line, greetingIndex)) return line;
      const response = await engine.translate({ from: 'de', to: 'en', text: beforeTranslation(line), html: false });
      return afterTranslation(response.target.text);
    }));
    results[index] = { german: paragraph, english: translated.join('\n') };
    onParagraph(results.filter(Boolean).length, paragraphs.length);
  }));
  return results;
}
