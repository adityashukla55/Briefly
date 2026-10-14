import META from './meta.js';
import { LANGUAGES } from '../languages/index.js';

const IDS = ['de', 'at', 'ch', 'fr', 'es', 'pt', 'it', 'nl', 'be', 'pl', 'se', 'dk', 'uk', 'ie', 'us', 'ca'];

export const COUNTRIES = IDS.map((id) => ({ ...(META.find((meta) => meta.id === id) ?? { id }) }));

export const DEFAULT_COUNTRY = 'de';

export function isLoaded(country) {
  return Boolean(country?.senders);
}

export async function loadCountry(id) {
  const index = COUNTRIES.findIndex((country) => country.id === id);
  if (index < 0) return loadCountry(DEFAULT_COUNTRY);
  if (!isLoaded(COUNTRIES[index])) COUNTRIES[index] = (await import(`./${id}.js`)).default;
  return COUNTRIES[index];
}

export async function loadAllCountries() {
  await Promise.all(IDS.map(loadCountry));
}

if (typeof window === 'undefined') await loadAllCountries();

export function countryById(id) {
  return COUNTRIES.find((country) => country.id === id) ?? COUNTRIES.find((country) => country.id === DEFAULT_COUNTRY);
}

export function languageOf(country) {
  return LANGUAGES[country.language];
}

export function languagesOf(country) {
  return country.languages ?? [country.language];
}

export function inLanguage(country, languageId) {
  if (languageId === country.language || !languagesOf(country).includes(languageId)) return country;
  return { ...country, ...(country.byLanguage?.[languageId] ?? {}), language: languageId };
}

function words(text) {
  return text.toLowerCase().match(/\p{L}+/gu) ?? [];
}

function languageScores(text, ids = Object.keys(LANGUAGES)) {
  const list = words(text);
  return ids.map((id) => {
    const stop = new Set(LANGUAGES[id].stopwords);
    return { id, score: list.length ? list.filter((word) => stop.has(word)).length / list.length : 0 };
  }).sort((a, b) => b.score - a.score);
}

export function detectLanguage(text) {
  if (words(text).length < 8) return null;
  const [best, second] = languageScores(text);
  if (!best || best.score < 0.04) return null;
  return { id: best.id, confident: !second || best.score > second.score * 1.5 };
}

export function resolveLanguage(country, text) {
  const ids = languagesOf(country);
  if (ids.length < 2) return country;
  const [best] = languageScores(text, ids);
  return inLanguage(country, best.score > 0 ? best.id : ids[0]);
}

export function detectCountry(text, preferredId = DEFAULT_COUNTRY) {
  const preferred = preferredId ? countryById(preferredId) : null;
  const language = detectLanguage(text);
  const candidates = COUNTRIES.filter((country) => !language || languagesOf(country).includes(language.id));
  if (!candidates.length) return preferred ?? countryById(DEFAULT_COUNTRY);
  const scored = candidates.map((country) => ({
    country,
    score: country.signals.reduce((sum, signal) => sum + (signal.test(text) ? 1 : 0), 0) + (country.id === preferred?.id ? 0.5 : 0),
  })).sort((a, b) => b.score - a.score);
  return scored[0].country;
}

export function samplesFor(country) {
  return country.samples ?? [];
}

export function sampleText(countryId, sampleId, today) {
  return countryById(countryId).samples.find((sample) => sample.id === sampleId)?.build(today) ?? '';
}
