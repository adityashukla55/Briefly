import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmail, handleFeedback, onRequestPost, readFeedback } from '../functions/api/feedback.js';

const good = { kind: 'text', message: 'The deadline on this page is wrong.', contact: '', page: '/netherlands/', browser: 'Chrome on Windows', context: '', website: '', elapsed: 5000 };

function post(body, headers = {}) {
  return new Request('https://brieflyapp.pages.dev/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://brieflyapp.pages.dev', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('reads a normal report', () => {
  assert.deepEqual(readFeedback(good), { kind: 'text', message: good.message, contact: '', page: '/netherlands/', browser: 'Chrome on Windows', context: '' });
});

test('treats the hidden field and very fast sends as spam', () => {
  assert.deepEqual(readFeedback({ ...good, website: 'http://spam.example' }), { spam: true });
  assert.deepEqual(readFeedback({ ...good, elapsed: 300 }), { spam: true });
  assert.deepEqual(readFeedback({ ...good, elapsed: undefined }), { spam: true });
});

test('rejects empty messages and cleans odd input', () => {
  assert.deepEqual(readFeedback({ ...good, message: ' hi ' }), { error: 'too-short' });
  const read = readFeedback({ ...good, kind: 'toString', page: '//evil.example/x', message: `ok${String.fromCharCode(0)} fine\nline two`, contact: 'x'.repeat(500) });
  assert.equal(read.kind, 'other');
  assert.equal(read.page, '/');
  assert.equal(read.message, 'ok fine\nline two');
  assert.equal(read.contact.length, 200);
});

test('email has the page, the details and a reply address only when valid', () => {
  const email = buildEmail({ ...readFeedback(good), contact: 'anna@example.com', context: 'Tax assessment from Belastingdienst · Netherlands · photo or PDF' }, { to: 'owner@example.com', origin: 'https://brieflyapp.pages.dev' });
  assert.equal(email.from, 'Briefly feedback <onboarding@resend.dev>');
  assert.deepEqual(email.to, ['owner@example.com']);
  assert.equal(email.reply_to, 'anna@example.com');
  assert.match(email.subject, /Wrong or unclear text – \/netherlands\//);
  assert.match(email.text, /Page: https:\/\/brieflyapp\.pages\.dev\/netherlands\//);
  assert.match(email.text, /About: Tax assessment from Belastingdienst/);
  assert.match(email.text, /The deadline on this page is wrong\.$/);
  assert.equal(buildEmail({ ...readFeedback(good), contact: 'call me' }, { to: 'o@example.com', origin: '' }).reply_to, undefined);
});

test('sends a good report and answers ok', async () => {
  const sent = [];
  const response = await handleFeedback(post(good), { to: 'owner@example.com', send: async (email) => sent.push(email) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(sent.length, 1);
});

test('spam gets a quiet ok and nothing is sent', async () => {
  const sent = [];
  const response = await handleFeedback(post({ ...good, website: 'x' }), { to: 'o@example.com', send: async (email) => sent.push(email) });
  assert.equal(response.status, 200);
  assert.equal(sent.length, 0);
});

test('refuses other websites, bad JSON and huge bodies', async () => {
  const send = async () => true;
  assert.equal((await handleFeedback(post(good, { origin: 'https://evil.example' }), { to: 'o', send })).status, 403);
  assert.equal((await handleFeedback(post('{not json'), { to: 'o', send })).status, 400);
  assert.equal((await handleFeedback(post({ ...good, message: 'x'.repeat(9000) }), { to: 'o', send })).status, 413);
});

test('says when sending failed or is not set up', async () => {
  assert.equal((await handleFeedback(post(good), { to: 'o', send: async () => false })).status, 502);
  const response = await onRequestPost({ request: post(good), env: {} });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, error: 'not-set-up' });
});
