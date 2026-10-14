export const KINDS = {
  text: 'Wrong or unclear text',
  bug: 'Something doesn’t work',
  idea: 'Idea or wish',
  other: 'Something else',
};

const LIMITS = { message: 2000, contact: 200, page: 300, browser: 120, context: 300, body: 8000 };
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

export async function handleFeedback(request, { to, send }) {
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
  return (await send(buildEmail(feedback, { to, origin }))) ? json({ ok: true }) : json({ ok: false, error: 'send-failed' }, 502);
}

async function sendWithResend(email, key) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'user-agent': 'briefly-feedback' },
    body: JSON.stringify(email),
  });
  return response.ok;
}

export function onRequestPost({ request, env }) {
  const key = env.RESEND_API_KEY;
  return handleFeedback(request, { to: env.FEEDBACK_EMAIL, send: key ? (email) => sendWithResend(email, key) : null });
}
