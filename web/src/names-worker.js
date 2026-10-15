import { AutoModelForTokenClassification, AutoTokenizer, Tensor, env } from '/vendor/transformers/transformers.min.js';
import { MAX_WORD_PIECES, chunkWords, tagWords } from './names-core.js';

const ROOT = '/vendor/ner/';
const MODEL = 'names';
const SPLIT = 'onnx/model_quantized.onnx';

let progress = () => {};
let joined = null;
let ready = null;

async function joinParts() {
  const manifest = await (await fetch(`${ROOT}${MODEL}/parts.json`)).json();
  const info = manifest[SPLIT];
  const chunks = [];
  let loaded = 0;
  for (const part of info.parts) {
    const response = await fetch(`${ROOT}${MODEL}/${part.name}`);
    if (!response.ok) throw new Error(`Could not download ${part.name} (${response.status})`);
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      progress(loaded / info.size);
    }
  }
  if (loaded !== info.size) throw new Error('The download of the name finder is incomplete');
  return new Blob(chunks);
}

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = ROOT;
env.useBrowserCache = false;
env.useWasmCache = false;
env.useCustomCache = true;
env.customCache = {
  async match(key) {
    if (!String(key?.url ?? key).endsWith(`${MODEL}/${SPLIT}`)) return undefined;
    joined ??= joinParts().catch((error) => {
      joined = null;
      throw error;
    });
    const blob = await joined;
    return new Response(blob, { headers: { 'content-type': 'application/octet-stream', 'content-length': String(blob.size) } });
  },
  async put() {},
};
env.backends.onnx.wasm.wasmPaths = { mjs: '/vendor/ort/ort-wasm-simd-threaded.mjs', wasm: '/vendor/ort/ort-wasm-simd-threaded.wasm' };
env.backends.onnx.wasm.numThreads = 1;

function load() {
  ready ??= (async () => {
    const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
    const model = await AutoModelForTokenClassification.from_pretrained(MODEL, { dtype: 'q8', device: 'wasm' });
    joined = null;
    const [cls, sep] = tokenizer.encode('');
    return { tokenizer, model, cls, sep, labels: model.config.id2label };
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

async function tagPage(words, { tokenizer, model, cls, sep, labels }) {
  const pieces = words.map((word) => tokenizer.encode(word, { add_special_tokens: false }).slice(0, MAX_WORD_PIECES));
  const counts = pieces.map((list) => list.length);
  const tags = [];
  for (const [from, to] of chunkWords(counts)) {
    const ids = [cls, ...pieces.slice(from, to).flat(), sep];
    const shape = [1, ids.length];
    const { logits } = await model({
      input_ids: new Tensor('int64', BigInt64Array.from(ids, BigInt), shape),
      attention_mask: new Tensor('int64', new BigInt64Array(ids.length).fill(1n), shape),
    });
    tags.push(...tagWords(logits.data, logits.dims[2], counts.slice(from, to), labels));
  }
  return tags;
}

self.addEventListener('message', async ({ data }) => {
  const { id, pages } = data;
  let shown = -1;
  progress = (share) => {
    const percent = Math.floor(share * 100);
    if (percent === shown) return;
    shown = percent;
    self.postMessage({ id, type: 'progress', share });
  };
  try {
    const parts = await load();
    self.postMessage({ id, type: 'working' });
    const tags = [];
    for (const words of pages) tags.push(await tagPage(words, parts));
    self.postMessage({ id, type: 'done', tags });
  } catch (error) {
    self.postMessage({ id, type: 'error', message: String(error?.message ?? error) });
  }
});
