const VERSION = '3.7.0';
const SHELL_CACHE = `briefly-shell-${VERSION}`;
const VENDOR_CACHE = 'briefly-vendor-2';
const SHARE_CACHE = 'briefly-share';

const SHELL = [
  '/',
  '/styles.css',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/flags/at.svg',
  '/icons/flags/be.svg',
  '/icons/flags/ca.svg',
  '/icons/flags/ch.svg',
  '/icons/flags/de.svg',
  '/icons/flags/dk.svg',
  '/icons/flags/es.svg',
  '/icons/flags/fr.svg',
  '/icons/flags/ie.svg',
  '/icons/flags/it.svg',
  '/icons/flags/nl.svg',
  '/icons/flags/pl.svg',
  '/icons/flags/pt.svg',
  '/icons/flags/se.svg',
  '/icons/flags/uk.svg',
  '/icons/flags/us.svg',
  '/src/analyze.js',
  '/src/app.js',
  '/src/boot.js',
  '/src/calendar.js',
  '/src/cancel.js',
  '/src/countries/at.js',
  '/src/countries/be.js',
  '/src/countries/ca.js',
  '/src/countries/ch.js',
  '/src/countries/de.js',
  '/src/countries/dk.js',
  '/src/countries/es.js',
  '/src/countries/fr.js',
  '/src/countries/ie.js',
  '/src/countries/index.js',
  '/src/countries/it.js',
  '/src/countries/meta.js',
  '/src/countries/nl.js',
  '/src/countries/pl.js',
  '/src/countries/pt.js',
  '/src/countries/se.js',
  '/src/countries/uk.js',
  '/src/countries/us.js',
  '/src/dates.js',
  '/src/dom.js',
  '/src/errors.js',
  '/src/feedback.js',
  '/src/folder.js',
  '/src/format.js',
  '/src/install.js',
  '/src/languages/da.js',
  '/src/languages/de.js',
  '/src/languages/en.js',
  '/src/languages/es.js',
  '/src/languages/fr.js',
  '/src/languages/index.js',
  '/src/languages/it.js',
  '/src/languages/nl.js',
  '/src/languages/pl.js',
  '/src/languages/pt.js',
  '/src/languages/sv.js',
  '/src/letters.js',
  '/src/pdf-worker.js',
  '/src/polyfills.js',
  '/src/read.js',
  '/src/replies.js',
  '/src/steps.js',
  '/src/translate.js',
  '/src/vault.js',
];

const OCR = [
  '/vendor/tesseract/tesseract.esm.min.js',
  '/vendor/tesseract/worker.min.js',
  '/vendor/lang/deu.traineddata.gz',
  '/vendor/pdfjs/pdf.min.mjs',
  '/vendor/pdfjs/pdf.worker.min.mjs',
  '/vendor/models/registry.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(SHELL);
    const vendor = await caches.open(VENDOR_CACHE);
    await Promise.all(OCR.map(async (path) => {
      if (!(await vendor.match(path))) await vendor.add(path).catch(() => {});
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, VENDOR_CACHE, SHARE_CACHE]);
    for (const key of await caches.keys()) {
      if (!keep.has(key)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function handleShare(request) {
  const form = await request.formData();
  const cache = await caches.open(SHARE_CACHE);
  for (const key of await cache.keys()) await cache.delete(key);
  const files = form.getAll('files').filter((file) => file instanceof File);
  for (const [index, file] of files.entries()) {
    await cache.put(`/shared/${index}`, new Response(file, {
      headers: { 'content-type': file.type, 'x-file-name': encodeURIComponent(file.name) },
    }));
  }
  const text = [form.get('title'), form.get('text')].filter(Boolean).join('\n\n');
  if (text) await cache.put('/shared/text', new Response(text));
  return Response.redirect('/?shared=1', 303);
}

async function vendorFirst(request) {
  const cache = await caches.open(VENDOR_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function shellFresh(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('/');
    throw new Error('offline');
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(handleShare(event.request));
    return;
  }
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/vendor/')) {
    event.respondWith(vendorFirst(event.request));
    return;
  }
  event.respondWith(shellFresh(event.request));
});
