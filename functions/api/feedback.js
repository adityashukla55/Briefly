export const KINDS = {
  text: 'Wrong or unclear text',
  bug: 'Something doesn’t work',
  idea: 'Idea or wish',
  other: 'Something else',
};

const LIMITS = { message: 2000, contact: 200, page: 300, browser: 120, context: 300, body: 8000 };
const RATE = { perPersonHour: 5, perDay: 50 };
const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

function clean(value, limit) {
  return typeof value === 'string' ? value.replace(/[^\P{Cc}\n\t]/gu, '').trim().slice(0, limit) : '';
}

export function readFeedback(data) {
  if (!data || typeof data !== 'object') return { error: 'bad-request' };
  if (clean(data.website, 200) || !(Number(data.elapsed) >= 1500)) return { spam: true };
  const message = clean(data.message, LIMITS.message);
  if (message.length < 5) return { error: 'too-short' };
  const page = clean(data.page, LIMITS.page);
  return {
    kind: Object.hasOwn(KINDS, data.kind) ? data.kind : 'other',
    message,
    contact: clean(data.contact, LIMITS.contact),
    page: page.startsWith('/') && !page.startsWith('//') ? page : '/',
    browser: clean(data.browser, LIMITS.browser),
    context: clean(data.context, LIMITS.context),
  };
}

export function buildEmail(feedback, { to, origin }) {
  const replyTo = EMAIL.test(feedback.contact) ? feedback.contact : null;
  return {
    from: 'Briefly feedback <onboarding@resend.dev>',
    to: [to],
    subject: `Briefly: ${KINDS[feedback.kind]} – ${feedback.page}`.replace(/\s+/g, ' ').slice(0, 150),
    text: [
      `Kind: ${KINDS[feedback.kind]}`,
      `Page: ${origin}${feedback.page}`,
      feedback.context ? `About: ${feedback.context}` : null,
      `Browser: ${feedback.browser || 'unknown'}`,
      `Reply to: ${replyTo ?? (feedback.contact || 'not given')}`,
      '',
      feedback.message,
    ].filter((line) => line !== null).join('\n'),
    ...(replyTo ? { reply_to: replyTo } : {}),
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

async function hashed(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`briefly-feedback:${value}`));
  return [...new Uint8Array(digest)].slice(0, 12).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function underLimit(store, person, now = Date.now()) {
  const hour = Math.floor(now / 3_600_000);
  const day = Math.floor(now / 86_400_000);
  const counters = [[`person:${await hashed(person)}:${hour}`, RATE.perPersonHour, 3_700], [`day:${day}`, RATE.perDay, 90_000]];
  const counts = await Promise.all(counters.map(([key]) => store.get(key).then((value) => Number(value ?? 0))));
  if (counters.some(([, max], index) => counts[index] >= max)) return false;
  await Promise.all(counters.map(([key, , ttl], index) => store.put(key, String(counts[index] + 1), { expirationTtl: ttl })));
  return true;
}

export async function handleFeedback(request, { to, send, limit = null }) {
  const origin = new URL(request.url).origin;
  const sentFrom = request.headers.get('origin');
  if (sentFrom && sentFrom !== origin) return json({ ok: false, error: 'wrong-origin' }, 403);
  const raw = await request.text();
  if (raw.length > LIMITS.body) return json({ ok: false, error: 'too-long' }, 413);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400);
  }
  const feedback = readFeedback(data);
  if (feedback.spam) return json({ ok: true });
  if (feedback.error) return json({ ok: false, error: feedback.error }, 400);
  if (!send || !to) return json({ ok: false, error: 'not-set-up' }, 503);
  if (limit && !(await limit(request.headers.get('cf-connecting-ip') ?? 'unknown'))) return json({ ok: false, error: 'too-many' }, 429);
  return (await send(buildEmail(feedback, { to, origin }))) ? json({ ok: true }) : json({ ok: false, error: 'send-failed' }, 502);
}

async function sendWithResend(email, key) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'user-agent': 'briefly-feedback' },
    body: JSON.stringify(email),
  });
  if (!response.ok) console.error('Resend refused the feedback email', response.status, await response.text());
  return response.ok;
}

export function onRequestPost({ request, env }) {
  const key = env.RESEND_API_KEY;
  const store = env.FEEDBACK_LIMITS;
  return handleFeedback(request, {
    to: env.FEEDBACK_EMAIL,
    send: key ? (email) => sendWithResend(email, key) : null,
    limit: store ? (person) => underLimit(store, person) : null,
  });
}
