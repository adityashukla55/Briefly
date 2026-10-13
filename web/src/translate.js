import { amountPattern } from './analyze.js';
import { languageOf } from './countries/index.js';
import { formatShortDate, toIso } from './dates.js';

const vendor = (path) => new URL(`../vendor/${path}`, import.meta.url).href;

const MONEY_OUT = /(?<![\w.])(€|EUR ?|CHF ?)(\d+)(?:\.(\d{2}))?(?!\d)/g;
const MONEY_OUT_AFTER = /(?<![\w.])(\d+)(?:\.(\d{2}))? ?(EUR|CHF)\b/g;
const DATE_OUT = /(?<![\d.\/])(\d{1,2})([./])(\d{1,2})\2(\d{4})(?!\d)/g;

export function beforeTranslation(line, country) {
  const language = languageOf(country);
  let out = line.replace(/[·•]/g, '-');
  for (const [pattern, replace] of language.rewrite) out = out.replace(new RegExp(pattern.source, pattern.flags), replace);
  return out.replace(amountPattern(country), (match, before, whole, cents, after) => {
    if (!before && !after) return match;
    const symbol = country.currency === 'CHF' ? 'CHF ' : 'EUR ';
    const digits = whole.replace(/\D/g, '');
    return cents && /^\d{2}$/.test(cents) ? `${symbol}${digits}.${cents}` : `${symbol}${digits}`;
  });
}

export function afterTranslation(english) {
  return english
    .replace(MONEY_OUT_AFTER, (match, whole, cents, code) => `${code} ${whole}${cents ? `.${cents}` : ''}`)
    .replace(MONEY_OUT, (match, symbol, whole, cents) => `${symbol.trim() === 'CHF' ? 'CHF ' : '€'}${Number(whole).toLocaleString('en-IE')}${cents ? `.${cents}` : ''}`)
    .replace(DATE_OUT, (match, day, separator, month, year) => {
      const iso = toIso(Number(year), Number(month), Number(day));
      return iso ? formatShortDate(iso) : match;
    });
}

let translator = null;
const downloads = new Map();
let registry = null;

async function modelFiles(pair) {
  registry ??= await (await fetch(vendor('models/registry.json'))).json();
  return Object.values(registry[pair]);
}

async function download(pair, onProgress) {
  const files = await modelFiles(pair);
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

export async function translatorSize(country) {
  const files = await modelFiles(languageOf(country).model);
  return files.reduce((sum, file) => sum + file.size, 0);
}

export async function isTranslatorCached(country) {
  if (!('caches' in self)) return false;
  const files = await modelFiles(languageOf(country).model).catch(() => []);
  if (!files.length) return false;
  const hits = await Promise.all(files.map((file) => caches.match(file.name)));
  return hits.every(Boolean);
}

export function prepareTranslator(country, onProgress = () => {}) {
  const pair = languageOf(country).model;
  if (!downloads.has(pair)) {
    downloads.set(pair, (async () => {
      await download(pair, onProgress);
      if (!translator) {
        const { BatchTranslator } = await import(vendor('bergamot/translator.js'));
        translator = new BatchTranslator({
          registryUrl: vendor('models/registry.json'),
          pivotLanguage: null,
          downloadTimeout: 0,
          workers: 1,
          batchSize: 4,
        });
      }
      return translator;
    })().catch((error) => {
      downloads.delete(pair);
      throw error;
    }));
  }
  return downloads.get(pair);
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
        const keepBreak = !previous || /^[-•*]\s/.test(line) || /:$/.test(previous) || previous.length < 45 || /^\p{Lu}[^.!?]{0,40}$/u.test(line);
        if (keepBreak) lines.push(line);
        else lines[lines.length - 1] = `${previous} ${line}`;
        return lines;
      }, [])
      .join('\n'))
    .filter(Boolean);
}

export function shouldTranslate(paragraphIndex, line, greetingIndex) {
  if (!/\p{L}{2,}/u.test(line)) return false;
  if (greetingIndex < 0 || paragraphIndex >= greetingIndex - 1) return true;
  return line.includes(':');
}

export function fixedPhrase(line, language) {
  const trimmed = line.trim();
  for (const [pattern, render] of language.fixedPhrases) {
    const match = trimmed.match(pattern);
    if (match) return render(match);
  }
  return null;
}

export async function translateText(text, country, onParagraph = () => {}) {
  const language = languageOf(country);
  const engine = await prepareTranslator(country);
  const paragraphs = toParagraphs(text);
  const greetingIndex = paragraphs.findIndex((paragraph) => language.greeting.test(paragraph));
  const results = new Array(paragraphs.length).fill(null);
  await Promise.all(paragraphs.map(async (paragraph, index) => {
    const lines = paragraph.split('\n');
    const translated = await Promise.all(lines.map(async (line) => {
      const fixed = fixedPhrase(line, language);
      if (fixed) return fixed;
      if (!shouldTranslate(index, line, greetingIndex)) return line;
      const response = await engine.translate({ from: language.id, to: 'en', text: beforeTranslation(line, country), html: false });
      return afterTranslation(response.target.text);
    }));
    results[index] = { original: paragraph, english: translated.join('\n') };
    onParagraph(results.filter(Boolean).length, paragraphs.length);
  }));
  return results;
}
