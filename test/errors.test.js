import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ReadError, friendlyError, missingFeatures } from '../web/src/errors.js';

test('our own errors are shown as they are, without technical details', () => {
  const problem = friendlyError(new ReadError('This PDF is locked with a password', 'Open it and save a copy.'));
  assert.equal(problem.title, 'This PDF is locked with a password');
  assert.equal(problem.details, null);
});

test('raw browser errors become plain messages with details kept for reports', () => {
  const problem = friendlyError(new TypeError("undefined is not a function (near '...t of e...')"));
  assert.equal(problem.title, 'Briefly couldn’t read this file');
  assert.match(problem.message, /latest Chrome, Edge, Firefox or Safari/);
  assert.match(problem.details, /undefined is not a function/);
});

test('network problems explain the one-time download', () => {
  assert.equal(friendlyError(new TypeError('Load failed')).title, 'No internet for the first run');
  assert.match(friendlyError(new TypeError('Failed to fetch'), 'translate').message, /23 MB/);
});

test('translation failures say the rest still works', () => {
  assert.match(friendlyError(new Error('boom'), 'translate').message, /Everything else on this page still works/);
});

test('reports missing browser features', () => {
  assert.deepEqual(missingFeatures({}), ['WebAssembly', 'background workers', 'file reading', 'streams', 'canvas']);
});
