import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const modules = join(root, 'node_modules');
const vendor = join(root, 'web', 'vendor');
const cache = join(root, '.cache', 'models');

const MODEL_HOST = 'https://bergamot.s3.amazonaws.com/models/';
const OCR_LANGUAGES = ['deu', 'fra', 'spa', 'ita', 'nld', 'pol', 'por', 'swe', 'dan', 'eng'];
const MOZILLA = 'https://firefox-settings-attachments.cdn.mozilla.net/main-workspace/translations-models/';
const MODELS = {
  deen: {
    model: { file: 'model.deen.intgemm.alphas.bin', sha256: '1980225d00dc5645491777accff5b3c9d20b92eff67a25135f1cf8fe2ed8fb8f' },
    lex: { file: 'lex.50.50.deen.s2t.bin', sha256: '2f7c0f7bbce97ae5b52454074a892ba7b7610fb98e3c5d341e4ca79f0850c4de' },
    vocab: { file: 'vocab.deen.spm', sha256: '417668f2ed297970febafb5b079a9d5ebc4ed0b3550ac8386d67a90473a09bd7' },
  },
  fren: {
    model: { file: 'model.intgemm.alphas.bin', sha256: '185f76d24c2d400fe4ea0cb2487df77722641b97a3ef10633872e8a7fdf40e09' },
    lex: { file: 'lex.s2t.bin', sha256: '3148abf21ea98a4d69d0e4504e0d68a6c060204a9b9a39b76855aee1d5b2c8ea' },
    vocab: { file: 'vocab.fren.spm', sha256: '4c84b95b62c930f0791466d73eb996841eef474c96d0c2f0e6c6d80640f2005a' },
  },
  esen: {
    model: { file: 'model.esen.intgemm.alphas.bin', sha256: '4b6b7f451094aaa447d012658af158ffc708fc8842dde2f871a58404f5457fe0' },
    lex: { file: 'lex.50.50.esen.s2t.bin', sha256: 'f11a2c23ef85ab1fee1c412b908d69bc20d66fd59faa8f7da5a5f0347eddf969' },
    vocab: { file: 'vocab.esen.spm', sha256: '909b1eea1face0d7f90a474fe29a8c0fef8d104b6e41e65616f864c964ba8845' },
  },
  nlen: {
    model: { file: 'model.nlen.intgemm.alphas.bin', sha256: '187f9c8f1ffbcc8ecf0724b608ffed9f15bde262b9de5c4754f8d763b585969d', url: `${MOZILLA}1db60932-8656-41a8-a00f-191eb925cef8.bin` },
    lex: { file: 'lex.50.50.nlen.s2t.bin', sha256: '15c473e6e5aef1fa3fe5cc804844e19a2c671d2e39169dcbc06f456ca4f9b2c0', url: `${MOZILLA}eeba1c98-e44a-4d97-8b5c-44c0a56edc3c.bin` },
    vocab: { file: 'vocab.nlen.spm', sha256: '48a6331cb8a69d21dd24c6c2a15de44a07bcfd4a4470eaf4616849d77945f6b9', url: `${MOZILLA}e16e52fe-1c21-48ab-9b7f-af1183a99d1a.spm` },
  },
  pten: {
    model: { file: 'model.pten.intgemm.alphas.bin', sha256: 'b4a1fd101f59ca258bfb051a3a4e5762497b9f91d7e74f28b7a2d68dc075f8fa', url: `${MOZILLA}dc4327ec-9ebc-4c12-8037-48cd30f3076d.bin` },
    lex: { file: 'lex.50.50.pten.s2t.bin', sha256: '702d9b09fbc020168998bb81afc927e74262f5a1455e9b443608a5d8efa4b52d', url: `${MOZILLA}013e0ebf-3d6b-4723-b83e-0e00ed29477f.bin` },
    vocab: { file: 'vocab.pten.spm', sha256: '2326a27577b5ffa0b822c55fe850986961728097521de35fcc186f7d6dce72d4', url: `${MOZILLA}75fa56af-540e-4a56-8a9f-1317ae7a9c61.spm` },
  },
  sven: {
    model: { file: 'model.sven.intgemm.alphas.bin', sha256: '92d79e2725718b84aed486473bdfcbe6bba3e7094922d4bead8a121cfa346372', url: `${MOZILLA}c9320d7a-0b85-444f-8b8e-4b83ddf86cbb.bin` },
    lex: { file: 'lex.50.50.sven.s2t.bin', sha256: '1c4640765e806d905cdc4f51158f6f869c78709b9e8a43070877965fa13c160e', url: `${MOZILLA}346b91bf-2540-43fa-a7d2-684e02f19252.bin` },
    vocab: { file: 'vocab.sven.spm', sha256: '93427195fac4125722ed778707478ef78cb77b3fdf1ed5b93bee9fd36e30a8ec', url: `${MOZILLA}60d6442e-ef60-4074-b1b3-330b916d619b.spm` },
  },
  daen: {
    model: { file: 'model.daen.intgemm.alphas.bin', sha256: '2c1ace24220c905404bbb1de14bfeda8a391ef8d6c56f3b193a9d3e340d99b12', url: `${MOZILLA}80b27539-da6a-4e69-90b5-138975866a2d.bin` },
    lex: { file: 'lex.50.50.daen.s2t.bin', sha256: 'e5f50fba646e0d3cedf2957575aa84c3bdca6798ce32ccd63c956fc043d774a3', url: `${MOZILLA}f5eb2acc-9170-4ad6-9251-019dc107692a.bin` },
    vocab: { file: 'vocab.daen.spm', sha256: 'b9392fcd9c53b802628d33a160f6eb52ca3d25a07ec9e015ab93b6bd5c7e8033', url: `${MOZILLA}492756d4-6932-4465-9ebf-dd402fb2e487.spm` },
  },
  plen: {
    model: { file: 'model.plen.intgemm.alphas.bin', sha256: '172a5f1d44bf8dd6a6eec3868b13b33ce265f3530e898fe11a80b739b821726e', url: `${MOZILLA}b26a428b-a136-469d-91dd-9389f72c053e.bin` },
    lex: { file: 'lex.50.50.plen.s2t.bin', sha256: '863afade0ba058fb0173fedef3d1fb14d0dcabc24c3b4584cb1fed8f84d6d879', url: `${MOZILLA}ce258bcd-2f27-42c4-8f46-4ccaac1158ae.bin` },
    vocab: { file: 'vocab.plen.spm', sha256: 'a1d27e6f5c0d29f406364ebf0382949d1c0affc750cec4380f3173150552f43e', url: `${MOZILLA}98b6b745-b695-4543-95d8-adf1996095ce.spm` },
  },
  iten: {
    model: { file: 'model.iten.intgemm.alphas.bin', sha256: '1fae546faeb9046f80b1b7e940b37b660974ce72902778181d6cd1c30b717f35' },
    lex: { file: 'lex.50.50.iten.s2t.bin', sha256: '357d362373022b029ee9965975a133e6f36fdb0fed749202ff578365cf0111f8' },
    vocab: { file: 'vocab.iten.spm', sha256: '22d5ce6973be5360a921103acbe984a9bfca952a1f6c55c9cb5ef7de4fd58266' },
  },
};

rmSync(vendor, { recursive: true, force: true });

function copy(from, to) {
  mkdirSync(dirname(join(vendor, to)), { recursive: true });
  cpSync(join(modules, from), join(vendor, to), { recursive: true });
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function download(pair, { file, sha256: expected, url }) {
  const target = join(cache, pair, file);
  if (existsSync(target) && sha256(readFileSync(target)) === expected) return target;
  console.log(`Downloading translation model ${pair}/${file}`);
  const response = await fetch(url ?? `${MODEL_HOST}${pair}/${file}`);
  if (!response.ok) throw new Error(`Download failed for ${pair}/${file}: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (sha256(buffer) !== expected) throw new Error(`Checksum mismatch for ${pair}/${file}`);
  mkdirSync(dirname(target), { recursive: true });
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
for (const language of OCR_LANGUAGES) {
  copy(`@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`, `lang/${language}.traineddata.gz`);
}

copy('pdfjs-dist/legacy/build/pdf.min.mjs', 'pdfjs/pdf.min.mjs');
copy('pdfjs-dist/legacy/build/pdf.worker.min.mjs', 'pdfjs/pdf.worker.min.mjs');
copy('pdfjs-dist/wasm', 'pdfjs/wasm');
copy('pdfjs-dist/standard_fonts', 'pdfjs/standard_fonts');
copy('pdfjs-dist/cmaps', 'pdfjs/cmaps');
copy('pdfjs-dist/iccs', 'pdfjs/iccs');
copy('pdfjs-dist/LICENSE', 'pdfjs/LICENSE');

copy('@browsermt/bergamot-translator/translator.js', 'bergamot/translator.js');
copy('@browsermt/bergamot-translator/worker', 'bergamot/worker');

const registry = {};
for (const [pair, files] of Object.entries(MODELS)) {
  registry[pair] = {};
  for (const [part, info] of Object.entries(files)) {
    const source = await download(pair, info);
    mkdirSync(join(vendor, 'models', pair), { recursive: true });
    cpSync(source, join(vendor, 'models', pair, info.file));
    registry[pair][part] = {
      name: `/vendor/models/${pair}/${info.file}`,
      size: readFileSync(source).length,
      expectedSha256Hash: info.sha256,
    };
  }
}
writeFileSync(join(vendor, 'models', 'registry.json'), JSON.stringify(registry, null, 2));

console.log('Copied libraries into web/vendor');
