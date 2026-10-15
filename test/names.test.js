import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { bestLabel, chunkWords, tagWords } from '../web/src/names-core.js';
import { findTaggedNames, pageWords } from '../web/src/redact.js';

const CHAR = 8;
const LINE = 20;
const HEIGHT = 14;
const LABELS = { 0: 'O', 1: 'B-DATE', 2: 'I-DATE', 3: 'B-PER', 4: 'I-PER', 5: 'B-ORG', 6: 'I-ORG', 7: 'B-LOC', 8: 'I-LOC' };

function page(text) {
  const lines = [];
  text.split('\n').forEach((line, row) => {
    const words = [...line.matchAll(/\S+/g)].map((match) => ({
      text: match[0],
      x0: 10 + match.index * CHAR,
      x1: 10 + (match.index + match[0].length) * CHAR,
      y0: 10 + row * LINE,
      y1: 10 + row * LINE + HEIGHT,
    }));
    if (words.length) lines.push({ words });
  });
  return { width: 1200, height: 20 + text.split('\n').length * LINE, lines };
}

function tagsFor(pages, people, score = 0.99) {
  return pageWords(pages).map((words) => words.map((word) => (people.has(word.replace(/[^\p{L}]/gu, '')) ? { label: 'B-PER', score } : { label: 'O', score: 0.99 })));
}

function covered(word, boxes, index = 0) {
  const x = (word.x0 + word.x1) / 2;
  const y = (word.y0 + word.y1) / 2;
  return boxes.some((box) => box.page === index && box.x0 <= x && box.x1 >= x && box.y0 <= y && box.y1 >= y);
}

function wordsOf(pages, index = 0) {
  return pages[index].lines.flatMap((line) => line.words);
}

test('splits words into chunks the model can read', () => {
  assert.deepEqual(chunkWords([1, 2, 3], 10), [[0, 3]]);
  assert.deepEqual(chunkWords([4, 4, 4, 4], 8), [[0, 2], [2, 4]]);
  assert.deepEqual(chunkWords([9, 1], 8), [[0, 1], [1, 2]]);
  assert.deepEqual(chunkWords([], 8), []);
});

test('gives each word the label of its first piece', () => {
  const width = 9;
  const rows = [
    [9, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 9, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 9, 0, 0, 0, 0],
    [9, 0, 0, 0, 0, 0, 0, 0, 0],
    [9, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  const tags = tagWords(Float32Array.from(rows.flat()), width, [2, 1, 0], LABELS);
  assert.equal(tags[0].label, 'B-PER');
  assert.equal(tags[1].label, 'I-PER');
  assert.equal(tags[2], null);
  assert.ok(tags[0].score > 0.99);
  assert.equal(bestLabel([1, 1], LABELS).score, 0.5);
});

test('hides names the AI found, also in the middle of the letter', () => {
  const pages = [page('Sehr geehrter Herr Mustermann,\nfür Ihren Sohn Lukas Weber wird Kindergeld gezahlt.\nIhre Sachbearbeiterin Frau Petra Schmidt.')];
  const boxes = findTaggedNames(pages, tagsFor(pages, new Set(['Mustermann', 'Lukas', 'Weber', 'Petra', 'Schmidt'])));
  const words = wordsOf(pages);
  for (const name of ['Mustermann,', 'Lukas', 'Weber', 'Petra', 'Schmidt.']) assert.ok(covered(words.find((word) => word.text === name), boxes), name);
  for (const other of ['Sohn', 'Kindergeld', 'Frau', 'Herr', 'Sachbearbeiterin']) assert.ok(!covered(words.find((word) => word.text === other), boxes), other);
  assert.ok(boxes.every((box) => box.kind === 'ainame'));
});

test('puts first and last name in one box', () => {
  const pages = [page('Ihr Sohn Lukas Weber kommt.')];
  const boxes = findTaggedNames(pages, tagsFor(pages, new Set(['Lukas', 'Weber'])));
  assert.equal(boxes.length, 1);
});

test('hides a name found once on every page', () => {
  const pages = [page('Ihr Sohn Lukas Weber kommt.'), page('Bitte bringen Sie den Ausweis von Lukas mit.')];
  const tags = tagsFor(pages, new Set(['Lukas', 'Weber']));
  tags[1] = tags[1].map(() => ({ label: 'O', score: 0.99 }));
  const boxes = findTaggedNames(pages, tags);
  assert.ok(covered(wordsOf(pages, 1).find((word) => word.text === 'Lukas'), boxes, 1));
});

test('ignores unsure answers, titles, greetings and offices', () => {
  const pages = [page('Hej Pani Anna Finanzamt Weber')];
  const tags = pageWords(pages).map((words) => words.map((word) => ({ label: 'B-PER', score: word === 'Weber' ? 0.4 : 0.9 })));
  const boxes = findTaggedNames(pages, tags);
  const words = wordsOf(pages);
  assert.ok(covered(words.find((word) => word.text === 'Anna'), boxes));
  for (const other of ['Hej', 'Pani', 'Finanzamt', 'Weber']) assert.ok(!covered(words.find((word) => word.text === other), boxes), other);
});

test('every part of the AI model fits the 25 MiB file limit', () => {
  const folder = new URL('../web/vendor/ner/names/', import.meta.url);
  const manifest = new URL('parts.json', folder);
  if (!existsSync(manifest)) return;
  for (const info of Object.values(JSON.parse(readFileSync(manifest, 'utf8')))) {
    assert.equal(info.parts.reduce((sum, part) => sum + part.size, 0), info.size);
    for (const part of info.parts) assert.ok(statSync(new URL(part.name, folder)).size < 25 * 1024 * 1024, part.name);
  }
  for (const file of ['../web/vendor/ort/ort-wasm-simd-threaded.wasm', '../web/vendor/transformers/transformers.min.js']) {
    assert.ok(statSync(new URL(file, import.meta.url)).size < 25 * 1024 * 1024, file);
  }
});
