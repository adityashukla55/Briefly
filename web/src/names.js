const FOLDER = '/vendor/ner/names/';
const VENDOR_CACHE = 'briefly-vendor-2';

export const NAME_FINDER_SIZE = 'about 150 MB';

let worker = null;
let next = 0;

export async function nameFinderSaved() {
  if (!('caches' in self)) return false;
  try {
    const cache = await caches.open(VENDOR_CACHE);
    const manifest = await cache.match(`${FOLDER}parts.json`);
    if (!manifest) return false;
    const files = Object.values(await manifest.json()).flatMap((info) => info.parts.map((part) => `${FOLDER}${part.name}`));
    files.push(`${FOLDER}config.json`, `${FOLDER}tokenizer.json`, `${FOLDER}tokenizer_config.json`, '/vendor/transformers/transformers.min.js', '/vendor/ort/ort-wasm-simd-threaded.mjs', '/vendor/ort/ort-wasm-simd-threaded.wasm');
    return (await Promise.all(files.map((file) => cache.match(file)))).every(Boolean);
  } catch {
    return false;
  }
}

function stop() {
  worker?.terminate();
  worker = null;
}

export function findNames(pages, onProgress = () => {}) {
  worker ??= new Worker('/src/names-worker.js', { type: 'module' });
  const current = worker;
  const id = ++next;
  return new Promise((resolve, reject) => {
    const done = () => {
      current.removeEventListener('message', listen);
      current.removeEventListener('error', fail);
    };
    const listen = ({ data }) => {
      if (data.id !== id) return;
      if (data.type === 'progress') onProgress('download', data.share);
      else if (data.type === 'working') onProgress('working');
      else {
        done();
        if (data.type === 'done') resolve(data.tags);
        else {
          stop();
          reject(new Error(data.message));
        }
      }
    };
    const fail = (event) => {
      done();
      stop();
      reject(new Error(event.message || 'The name finder could not start'));
    };
    current.addEventListener('message', listen);
    current.addEventListener('error', fail);
    current.postMessage({ id, pages });
  });
}
