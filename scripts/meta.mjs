import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COUNTRIES } from '../web/src/countries/index.js';

const FIELDS = ['id', 'slug', 'name', 'short', 'inName', 'adjective', 'language', 'languages', 'currency', 'signals'];

export const META_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'src', 'countries', 'meta.js');

export function metaSource() {
  const items = COUNTRIES.map((country) => {
    const lines = FIELDS.filter((field) => country[field] !== undefined).map((field) => {
      const value = field === 'signals' ? `[\n      ${country.signals.map(String).join(',\n      ')},\n    ]` : JSON.stringify(country[field]);
      return `    ${field}: ${value},`;
    });
    return `  {\n${lines.join('\n')}\n  },`;
  });
  return `export default [\n${items.join('\n')}\n];\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(META_FILE, metaSource());
  console.log(`Wrote ${META_FILE}`);
}
