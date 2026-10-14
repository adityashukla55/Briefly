import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COUNTRIES } from '../web/src/countries/index.js';
import { LANGUAGES } from '../web/src/languages/index.js';

function patterns(value, path, seen = new Set(), found = []) {
  if (!value || typeof value !== 'object' || seen.has(value)) return found;
  seen.add(value);
  if (value instanceof RegExp) found.push([path, value]);
  else for (const [key, child] of Object.entries(value)) patterns(child, `${path}.${key}`, seen, found);
  return found;
}

test('no word boundary next to an accented letter (it never matches there)', () => {
  const all = [...COUNTRIES.flatMap((country) => patterns(country, country.id)), ...Object.values(LANGUAGES).flatMap((language) => patterns(language, language.id))];
  const broken = all.filter(([, pattern]) => pattern.source.split('|').some((part) => /\\b[^\x00-\x7F]/.test(part) || /[^\x00-\x7F](?:\(\?:[^)]*\)\?|\[[^\]]*\]\?|[?*+)])*\\b/.test(part)));
  assert.deepEqual(broken.map(([path, pattern]) => `${path}: ${pattern.source.slice(0, 60)}`), []);
});
