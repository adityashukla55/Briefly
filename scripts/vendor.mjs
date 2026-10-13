import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modules = join(root, 'node_modules');
const vendor = join(root, 'web', 'vendor');
const cache = join(root, '.cache', 'models');

const MODEL_HOST = 'https://bergamot.s3.amazonaws.com/models/deen/';
const MODEL_FILES = {
  model: { file: 'model.deen.intgemm.alphas.bin', sha256: '1980225d00dc5645491777accff5b3c9d20b92eff67a25135f1cf8fe2ed8fb8f' },
  lex: { file: 'lex.50.50.deen.s2t.bin', sha256: '2f7c0f7bbce97ae5b52454074a892ba7b7610fb98e3c5d341e4ca79f0850c4de' },
  vocab: { file: 'vocab.deen.spm', sha256: '417668f2ed297970febafb5b079a9d5ebc4ed0b3550ac8386d67a90473a09bd7' },
};

rmSync(vendor, { recursive: true, force: true });

function copy(from, to) {
  mkdirSync(dirname(join(vendor, to)), { recursive: true });
  cpSync(join(modules, from), join(vendor, to), { recursive: true });
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function download(name, { file, sha256: expected }) {
  const target = join(cache, file);
  if (existsSync(target) && sha256(readFileSync(target)) === expected) return target;
  console.log(`Downloading translation ${name} (${file})`);
  const response = await fetch(MODEL_HOST + file);
  if (!response.ok) throw new Error(`Download failed for ${file}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (sha256(buffer) !== expected) throw new Error(`Checksum mismatch for ${file}`);
  mkdirSync(cache, { recursive: true });
  writeFileSync(target, buffer);
  return target;
}

copy('tesseract.js/dist/tesseract.esm.min.js', 'tesseract/tesseract.esm.min.js');
copy('tesseract.js/dist/worker.min.js', 'tesseract/worker.min.js');
copy('tesseract.js/LICENSE.md', 'tesseract/LICENSE.md');
for (const file of readdirSync(join(modules, 'tesseract.js-core'))) {
  if (file.endsWith('-lstm.wasm.js')) copy(`tesseract.js-core/${file}`, `tesseract-core/${file}`);
}
copy('tesseract.js-core/LICENSE', 'tesseract-core/LICENSE');
copy('@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz', 'lang/deu.traineddata.gz');

copy('pdfjs-dist/build/pdf.min.mjs', 'pdfjs/pdf.min.mjs');
copy('pdfjs-dist/build/pdf.worker.min.mjs', 'pdfjs/pdf.worker.min.mjs');
copy('pdfjs-dist/wasm', 'pdfjs/wasm');
copy('pdfjs-dist/standard_fonts', 'pdfjs/standard_fonts');
copy('pdfjs-dist/cmaps', 'pdfjs/cmaps');
copy('pdfjs-dist/iccs', 'pdfjs/iccs');
copy('pdfjs-dist/LICENSE', 'pdfjs/LICENSE');

copy('@browsermt/bergamot-translator/translator.js', 'bergamot/translator.js');
copy('@browsermt/bergamot-translator/worker', 'bergamot/worker');

const registry = { deen: {} };
for (const [name, info] of Object.entries(MODEL_FILES)) {
  const source = await download(name, info);
  mkdirSync(join(vendor, 'models', 'deen'), { recursive: true });
  cpSync(source, join(vendor, 'models', 'deen', info.file));
  registry.deen[name] = {
    name: `/vendor/models/deen/${info.file}`,
    size: readFileSync(source).length,
    expectedSha256Hash: info.sha256,
  };
}
writeFileSync(join(vendor, 'models', 'registry.json'), JSON.stringify(registry, null, 2));

console.log('Copied libraries into web/vendor');
