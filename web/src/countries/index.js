import at from './at.js';
import ch from './ch.js';
import de from './de.js';
import es from './es.js';
import fr from './fr.js';
import it from './it.js';
import { LANGUAGES } from '../languages/index.js';

export const COUNTRIES = [de, at, ch, fr, es, it];

export const DEFAULT_COUNTRY = 'de';

export function countryById(id) {
  return COUNTRIES.find((country) => country.id === id) ?? COUNTRIES.find((country) => country.id === DEFAULT_COUNTRY);
}

export function languageOf(country) {
  return LANGUAGES[country.language];
}

function words(text) {
  return text.toLowerCase().match(/\p{L}+/gu) ?? [];
}

export function detectLanguage(text) {
  const list = words(text);
  if (list.length < 8) return null;
  const scores = Object.values(LANGUAGES).map((language) => {
    const stop = new Set(language.stopwords);
    return { id: language.id, score: list.filter((word) => stop.has(word)).length / list.length };
  }).sort((a, b) => b.score - a.score);
  const [best, second] = scores;
  if (!best || best.score < 0.04) return null;
  return { id: best.id, confident: !second || best.score > second.score * 1.5 };
}

export function detectCountry(text, preferredId = DEFAULT_COUNTRY) {
  const preferred = countryById(preferredId);
  const language = detectLanguage(text);
  const candidates = COUNTRIES.filter((country) => !language || country.language === language.id);
  if (!candidates.length) return preferred;
  const scored = candidates.map((country) => ({
    country,
    score: country.signals.reduce((sum, signal) => sum + (signal.test(text) ? 1 : 0), 0) + (country.id === preferred.id ? 0.5 : 0),
  })).sort((a, b) => b.score - a.score);
  return scored[0].country;
}

export function samplesFor(country) {
  return country.samples ?? [];
}

export function sampleText(countryId, sampleId, today) {
  return countryById(countryId).samples.find((sample) => sample.id === sampleId)?.build(today) ?? '';
}
