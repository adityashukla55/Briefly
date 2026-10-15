import { findPayment, findReferences, isValidIban } from './analyze.js';

const TITLE = /^(?:herrn|herr|frau|familie|eheleute|mrs|mr|ms|miss|mx|dr|prof|mademoiselle|madame|monsieur|mlle|mme|m|srta|sra|sr|señora|señor|doña|don|d|exma|exmo|senhora|senhor|sig\.ra|signora|signor|sigg|sig|de heer|heer|mevrouw|mevr|dhr|pani|panie|pan|państwo|hr|fru)(?:\.|(?=[\s,]|$))[^\S\n]*/iu;

const GREETING = /^(?:sehr geehrte[rs]?|guten tag|hallo|liebe[rs]?|grüezi|grüß gott|dear|hello|hi|hej|kære|bästa|beste|geachte|madame|monsieur|cher|chère|bonjour|estimad[oa]s?|distinguid[oa]s?|muy señora?|gentile|egregi[oa]|caro|cara|exm[oa]s?\.?|prezad[oa]s?|szanown[aiy]|dzień dobry|witam)[^\S\n]+/iu;

const NOT_NAMES = new Set(['damen', 'herren', 'sir', 'madam', 'madame', 'monsieur', 'customer', 'client', 'cliente', 'clienta', 'kunde', 'kundin', 'kunden', 'taxpayer', 'contribuable', 'contribuente', 'contribuinte', 'contribuyente', 'member', 'mitglied', 'applicant', 'antragsteller', 'antragstellerin', 'versicherte', 'versicherter', 'dames', 'heren', 'señores', 'señoras', 'senhores', 'senhoras', 'signori', 'państwo', 'all', 'alle', 'team', 'colleague', 'friend', 'reader', 'resident', 'bewohner', 'mieter', 'mieterin', 'tenant', 'homeowner', 'occupier', 'parent', 'eltern']);

const CONNECTORS = new Set(['von', 'van', 'de', 'der', 'den', 'la', 'le', 'da', 'di', 'du', 'dos', 'das', 'del', 'della', 'ten', 'ter', 'zu', 'af', 'av', 'y', 'e', 'i', 'und', 'and', 'et', 'en', 'og', 'och', 'bin', 'ibn', 'al']);

const ORG = /amt(?![\p{L}])|ämter|kasse|versicherung|verwaltung|service|agentur|agency|agence|agencia|agenzia|agência|department|ministr|bureau|büro|office|ufficio|oficina|gmbh|(?<![\p{L}])(?:ag|kg|ltd|inc|llc|plc|s\.?a|s\.?l|s\.?p\.?a|b\.?v|n\.?v|ab|a\/s|aps|ard|zdf|irs|cra|hmrc|dwp|aima|uscis|ircc|caf|city|team|gas|polis|politi|sąd)(?![\p{L}])|bank|insurance|assurance|seguro|assicura|verzekering|ubezpiecz|försäkring|forsikring|council|gemeinde|stadt|commune|mairie|ayuntamiento|comune|gemeente|urząd|kommun|center|centre|centro|zentrum|revenue|tax|steuer|finanz|jobcent|caisse|polizei|police|policía|polizia|politie|policja|court|gericht|tribunal|rechtbank|domstol|school|schule|école|universit|hospital|klinik|krankenhaus|praxis|verein|verband|association|union|company|corporation|group|gruppe|direction|dirección|direzione|directie|dyrekcja|referat|abteilung|support|immigration|migration|dienst|stadtwerke|telekom|vodafone|energie|energy|strom|wasser|beitrag|regierung|government|gobierno|governo|regering|deutschland|danmark|sverige|polska|españa|italia|portugal|france|nederland|belgië|belgique|österreich|schweiz|suisse|svizzera|ireland|kingdom|states|canada|questura|préfecture|prefettura|wojew|udbetaling|forem|intreo|treasury/iu;

const POSTCODE_LINE = new RegExp([
  String.raw`^(?:[A-Z]{1,2}[-\s])?\d{4,5}\s+\p{Lu}[\p{L}\s.'’()\-]*$`,
  String.raw`^\d{4}\s?[A-Z]{2}\s+\p{Lu}[\p{L}\s.'’\-]*$`,
  String.raw`^\d{4}-\d{3}\s+\p{Lu}[\p{L}\s.'’\-]*$`,
  String.raw`^\d{2}-\d{3}\s+\p{Lu}[\p{L}\s.'’\-]*$`,
  String.raw`^\d{3}\s?\d{2}\s+\p{Lu}[\p{L}\s.'’\-]*$`,
  String.raw`^(?:[\p{L}.'’\-]+\s)*[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$`,
  String.raw`^(?:[\p{L}.'’\-]+\s)*[A-Z]\d{2}\s?[A-Z\d]{4}$`,
  String.raw`^[\p{L}\s.'’\-]+,?\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?$`,
  String.raw`^[\p{L}\s.'’\-]+,?\s+[A-Z]{2}\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d$`,
].join('|'), 'u');

const NAME_LABEL = /^(?:name|vor- und (?:zu|nach)name|vorname|nachname|familienname|geburtsname|name, vorname|nom(?: de naissance| et prénoms?)?|prénoms?|nombre(?: y apellidos)?|apellidos?|nome(?: completo)?|cognome(?: e nome)?|naam|voornamen?|achternaam|imię(?: i nazwisko)?|nazwisko|namn|förnamn|efternamn|navn|fornavn|efternavn|full name|first name|last name|surname|given names?|forenames?|schuldner(?:in)?|versicherte(?:r| person)?|antragsteller(?:in)?|patient(?:in)?|debtor|applicant|steuerpflichtige[r]?)[^\S\n]*:[^\S\n]*(?=\S)/iu;

const BIRTH = /(?<![\p{L}])(?:geboren(?: am)?|geb\.|geburtsdatum|date of birth|birth ?date|d\.?o\.?b\.?|born(?: on)?|née?(?: le)?|date de naissance|fecha de nacimiento|nacid[oa](?: el)?|data di nascita|nat[oa](?: il)?|geboortedatum|geboren op|data urodzenia|urodzon[ya](?: dnia)?|födelsedatum|född|fødselsdato|født(?: den)?|data de nascimento|nascid[oa](?: em)?)(?![\p{L}])[^\S\n]*[:.]?[^\S\n]*/giu;

const DATE_AHEAD = /^(?:\d{1,2}[./-] ?\d{1,2}[./-] ?\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\.? \p{L}+\.? \d{4}|\p{L}+\.? \d{1,2},? \d{4})/u;

const DATE_TOKEN = /^(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2})$/;

const NUMBER_LABEL = /(?<![\p{L}])(?:[\p{L}-]*(?:nummer|number|numéro|número|numero|numer|kenmerk|zeichen|referenz|reference|référence|referencia|riferimento|referentie)|nr|no|nº|n°|n\.º|az|ref|id)\.?(?![\p{L}])[^\n:]{0,25}:/giu;

const ACCOUNT_LABEL = /(?<![\p{L}])(?:konto(?:nummer|nr)?|account(?: number| no\.?)?|compte|cuenta|conto(?: corrente)?|rekening(?:nummer)?|rachunek|rachunku|konta|bankgiro|plusgiro|sort code|routing(?: number)?|reg\.? ?nr)\.?(?![\p{L}])[^\S\n]*:?[^\S\n]*/giu;

const PHONE_LABEL = /(?<![\p{L}])(?:tel(?:efon(?:nummer)?|éfono|efono|efoon|ephone|f)?|phone|mobil(?:e|nummer|telefon)?|handy|fax|cell(?:phone)?|gsm|portable|téléphone|móvil|cellulare|komórka|tlf|mob|durchwahl|direct line)\.?(?:[^\S\n]*(?:nr|no|number)\.?)?[^\S\n]*[:.]?[^\S\n]*(\+?[(\d][\d \t()/.-]{4,24}\d)/giu;

const PHONES = [
  /(?<![\p{L}\p{N}+])\+\d{1,3}(?:[ \-./]?\(0\))?(?:[ \-./]?\d{1,5}){2,6}(?!\d)/gu,
  /(?<![\p{N}-])(?:1[ \-.])?(?:\(\d{3}\) ?|\d{3}[ \-.])\d{3}[ \-.]\d{4}(?![\p{N}])/gu,
  /(?<![\p{N}.,/])0\d{1,4}(?:[ \-/]\d{2,8}){1,4}(?![\p{N}.,])/gu,
];

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu;

const IBAN = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/g;

const IDS = [
  /(?<![\p{L}\p{N}])756[. ]?\d{4}[. ]?\d{4}[. ]?\d{2}(?![\p{N}])/gu,
  /(?<![\p{L}\p{N}])[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z](?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])[XYZ]?\d{7,8}[ -]?[A-Z](?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])\d{7}[A-W][A-IW](?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])[A-Z]{2} ?\d{2} ?\d{2} ?\d{2} ?[A-D](?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])(?:19|20)?\d{6}[-+]\d{4}(?![\p{N}])/gu,
  /(?<![\p{L}\p{N}])\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}(?![\p{N}])/gu,
  /(?<![\p{L}\p{N}])(?:\d{3}|X{3})-(?:\d{2}|X{2})-\d{4}(?![\p{N}])/gu,
  /(?<![\p{L}\p{N}])X{3}[ -]?X{2}\d[ -]?\d{3}(?![\p{N}])/gu,
  /(?<![\p{L}\p{N}])[12] ?\d{2} ?(?:0[1-9]|1[0-2]|[2-9]\d) ?(?:\d{2}|2[AB]) ?\d{3} ?\d{3}(?: ?\d{2})?(?![\p{N}])/gu,
  /(?<![\p{L}\p{N}])\d{2} ?\d{6} ?[A-Z] ?\d{3}(?![\p{L}\p{N}])/gu,
  /(?<![\p{L}\p{N}])A-?\d{8,9}(?![\p{N}])/gu,
];

const KIND_ORDER = ['address', 'name', 'id', 'bank', 'number', 'birth', 'phone', 'email'];

const quantile = (values, share) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor((sorted.length - 1) * share)] : 0;
};

const digitsIn = (text) => text.match(/\d/g)?.length ?? 0;

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

function boxOf(items) {
  return {
    x0: Math.min(...items.map((item) => item.x0)),
    y0: Math.min(...items.map((item) => item.y0)),
    x1: Math.max(...items.map((item) => item.x1)),
    y1: Math.max(...items.map((item) => item.y1)),
  };
}

function segmentsOf(page, height) {
  const segments = [];
  for (const line of page.lines) {
    const words = line.words.filter((word) => word.text.trim()).sort((a, b) => a.x0 - b.x0);
    let current = [];
    for (const word of words) {
      if (current.length && word.x0 - current.at(-1).x1 > height * 8) {
        segments.push(current);
        current = [];
      }
      current.push(word);
    }
    if (current.length) segments.push(current);
  }
  return segments.map((words) => ({ words, ...boxOf(words) }));
}

function blocksOf(segments, height) {
  const gaps = [];
  for (let index = 1; index < segments.length; index += 1) {
    const gap = segments[index].y0 - segments[index - 1].y1;
    if (gap >= 0 && gap < height * 3) gaps.push(gap);
  }
  const limit = Math.min(height * 2, Math.max(height * 0.9, quantile(gaps, 0.2) * 1.6));
  const sorted = [...segments].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  const blocks = [];
  for (const segment of sorted) {
    let best = null;
    for (const block of blocks) {
      const last = block.at(-1);
      const gap = segment.y0 - last.y1;
      if (gap < -height * 0.5 || gap > limit) continue;
      const overlap = Math.min(segment.x1, last.x1) - Math.max(segment.x0, last.x0);
      const aligned = Math.abs(segment.x0 - last.x0) <= height * 2 || overlap > Math.min(segment.x1 - segment.x0, last.x1 - last.x0) * 0.5;
      if (aligned && (!best || gap < best.gap)) best = { block, gap };
    }
    if (best) best.block.push(segment);
    else blocks.push([segment]);
  }
  return blocks;
}

export function readLayout(page) {
  const height = quantile(page.lines.flatMap((line) => line.words.map((word) => word.y1 - word.y0)), 0.5) || 1;
  const blocks = blocksOf(segmentsOf(page, height), height);
  let text = '';
  const spans = [];
  const lines = [];
  blocks.forEach((block, blockIndex) => {
    if (text) text += '\n\n';
    block.forEach((segment, index) => {
      if (index) text += '\n';
      const start = text.length;
      segment.words.forEach((word, position) => {
        if (position) text += ' ';
        spans.push({ start: text.length, end: text.length + word.text.length, word, line: lines.length });
        text += word.text;
      });
      lines.push({ start, end: text.length, text: text.slice(start), block: blockIndex, segment });
    });
  });
  return { text, spans, lines, height, width: page.width, pageHeight: page.height };
}

function stripTitles(line) {
  let rest = line.trim();
  let titled = false;
  for (let match = rest.match(TITLE); match && match[0].length; match = rest.match(TITLE)) {
    rest = rest.slice(match[0].length).trim();
    titled = true;
  }
  return { rest, titled };
}

function personName(raw, { titled = false } = {}) {
  const words = raw.replace(/[,;:]+$/, '').split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 6 || /[\d@]/.test(raw)) return null;
  if (!titled && (words.length < 2 || ORG.test(raw))) return null;
  if (!words.every((word) => CONNECTORS.has(word.toLowerCase()) || /^\p{Lu}[\p{L}'’-]*\.?$/u.test(word))) return null;
  if (words.some((word) => NOT_NAMES.has(word.toLowerCase()))) return null;
  const names = words.filter((word) => !CONNECTORS.has(word.toLowerCase()) && !/^\p{Lu}\.$/u.test(word));
  return names.length ? names.map((word) => word.replace(/\.$/, '')) : null;
}

function addressRanges(layout, known) {
  const ranges = [];
  const byBlock = new Map();
  for (const [index, line] of layout.lines.entries()) {
    if (!byBlock.has(line.block)) byBlock.set(line.block, []);
    byBlock.get(line.block).push(index);
  }
  for (const [block, indexes] of byBlock) {
    const lines = indexes.map((index) => layout.lines[index]);
    const postcode = lines.findIndex((line, index) => index > 0 && POSTCODE_LINE.test(line.text.trim()));
    if (postcode < 0) continue;
    let start = -1;
    let names = null;
    for (let index = 0; index < postcode; index += 1) {
      const { rest, titled } = stripTitles(lines[index].text);
      if (!titled) continue;
      const own = rest ? personName(rest, { titled: true }) : null;
      const next = !rest && index + 1 < postcode ? personName(stripTitles(lines[index + 1].text).rest, { titled: true }) : null;
      names = own ?? next;
      if (names) {
        start = index;
        break;
      }
    }
    if (start < 0 && block > 0) {
      for (let index = Math.max(0, postcode - 3); index < postcode; index += 1) {
        if (lines.slice(index, postcode).some((line) => line.text.includes(':'))) continue;
        names = personName(lines[index].text);
        if (names) {
          start = index;
          break;
        }
      }
    }
    if (start < 0) continue;
    for (const name of names) known.names.add(name);
    for (const line of lines.slice(start + 1, postcode + 1)) {
      if (/\d/.test(line.text) && !names.some((name) => line.text.includes(name))) known.strings.set(line.text.trim(), 'address');
    }
    ranges.push({ start: lines[start].start, end: lines[postcode].end, kind: 'address', whole: true });
  }
  return ranges;
}

function greetingRanges(layout, known) {
  const ranges = [];
  for (const line of layout.lines) {
    const greeting = line.text.match(GREETING);
    if (!greeting) continue;
    const after = line.text.slice(greeting[0].length);
    const { rest } = stripTitles(after);
    const part = rest.match(/^[^,:;!\n]+/)?.[0].trim();
    const names = part ? personName(part, { titled: true }) : null;
    if (!names) continue;
    for (const name of names) known.names.add(name);
    const offset = line.start + line.text.length - rest.length;
    ranges.push({ start: offset, end: offset + part.length, kind: 'name' });
  }
  return ranges;
}

function labelledNameRanges(layout, known) {
  const ranges = [];
  for (const line of layout.lines) {
    const label = line.text.match(NAME_LABEL);
    if (!label) continue;
    const value = line.text.slice(label[0].length).trim();
    if (ORG.test(value)) continue;
    const names = personName(stripTitles(value).rest, { titled: true });
    if (names) for (const name of names) known.names.add(name);
    ranges.push({ start: line.start + label[0].length, end: line.end, kind: 'name' });
  }
  return ranges;
}

function codeAt(text, from, minDigits = 3) {
  const stop = text.indexOf('\n', from);
  const line = text.slice(from, stop < 0 ? text.length : stop);
  let start = null;
  let end = null;
  let digits = 0;
  for (const match of line.matchAll(/\S+/g)) {
    const token = match[0].replace(/[,;]$/, '');
    if (DATE_TOKEN.test(token)) break;
    const code = /^[\p{L}\p{N}+*][\p{L}\p{N}/.*+-]*$/u.test(token) && (/\d/.test(token) || /^\p{Lu}{1,5}$/u.test(token));
    if (!code) break;
    start ??= match.index;
    end = match.index + token.length;
    digits += digitsIn(token);
    if (token !== match[0]) break;
  }
  if (start === null || digits < minDigits) return null;
  const value = line.slice(start, end).replace(/[.\-/]+$/, '');
  return { start: from + start, end: from + start + value.length, value };
}

function isYear(value) {
  return /^(?:19|20)\d{2}$/.test(value.trim());
}

function keep(known, value, kind) {
  const clean = value.trim();
  if (clean.replace(/\s/g, '').length < 4 || digitsIn(clean) < 3 || isYear(clean)) return;
  if (!known.strings.has(clean)) known.strings.set(clean, kind);
}

function valueRanges(text, country, known) {
  const ranges = [];
  for (const match of text.matchAll(IBAN)) {
    const raw = match[0];
    const variants = [raw, raw.replace(/ ?[A-Z0-9]{1,3}$/, ''), raw.replace(/ ?[A-Z0-9]{4}$/, '')];
    const valid = variants.find((variant) => isValidIban(variant));
    const labelled = /iban\W{0,4}$/i.test(text.slice(Math.max(0, match.index - 10), match.index));
    if (!valid && !labelled) continue;
    const value = valid ?? raw;
    ranges.push({ start: match.index, end: match.index + value.length, kind: 'bank' });
    keep(known, value, 'bank');
  }
  for (const match of text.matchAll(ACCOUNT_LABEL)) {
    const code = codeAt(text, match.index + match[0].length, 6);
    if (!code) continue;
    ranges.push({ start: code.start, end: code.end, kind: 'bank' });
    keep(known, code.value, 'bank');
  }
  for (const match of text.matchAll(NUMBER_LABEL)) {
    const code = codeAt(text, match.index + match[0].length);
    if (!code || isYear(code.value)) continue;
    ranges.push({ start: code.start, end: code.end, kind: 'number' });
    keep(known, code.value, 'number');
  }
  for (const reference of findReferences(text, country)) {
    if (!isYear(reference.value)) keep(known, reference.value, reference.personal ? 'id' : 'number');
  }
  const payment = findPayment(text, country);
  if (payment?.iban) keep(known, payment.iban, 'bank');
  for (const [, value] of payment?.account?.rows ?? []) keep(known, value, 'bank');
  if (payment?.reference) keep(known, payment.reference, 'number');
  return ranges;
}

function patternRanges(text) {
  const ranges = [];
  for (const pattern of IDS) {
    for (const match of text.matchAll(pattern)) ranges.push({ start: match.index, end: match.index + match[0].length, kind: 'id' });
  }
  for (const match of text.matchAll(BIRTH)) {
    const from = match.index + match[0].length;
    const date = text.slice(from, from + 30).match(DATE_AHEAD);
    if (date) ranges.push({ start: from, end: from + date[0].length, kind: 'birth' });
  }
  for (const match of text.matchAll(PHONE_LABEL)) {
    if (digitsIn(match[1]) < 6) continue;
    const start = match.index + match[0].length - match[1].length;
    ranges.push({ start, end: start + match[1].length, kind: 'phone' });
  }
  for (const pattern of PHONES) {
    for (const match of text.matchAll(pattern)) {
      const digits = digitsIn(match[0]);
      if (digits >= 8 && digits <= 15 && !DATE_TOKEN.test(match[0])) ranges.push({ start: match.index, end: match.index + match[0].length, kind: 'phone' });
    }
  }
  for (const match of text.matchAll(EMAIL)) ranges.push({ start: match.index, end: match.index + match[0].length, kind: 'email' });
  return ranges;
}

function knownRanges(text, known) {
  const ranges = [];
  for (const name of known.names) {
    if (name.length < 2) continue;
    for (const variant of new Set([name, name.toUpperCase()])) {
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escape(variant)}(?![\\p{L}\\p{N}])`, 'gu');
      for (const match of text.matchAll(pattern)) ranges.push({ start: match.index, end: match.index + match[0].length, kind: 'name' });
    }
  }
  for (const [value, kind] of known.strings) {
    const flexible = [...value.replace(/\s+/g, '')].map(escape).join('\\s*');
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${flexible}(?![\\p{L}\\p{N}])`, 'gu');
    for (const match of text.matchAll(pattern)) ranges.push({ start: match.index, end: match.index + match[0].length, kind });
  }
  return ranges;
}

function rangeBoxes(layout, range) {
  const byLine = new Map();
  for (const span of layout.spans) {
    if (span.end <= range.start || span.start >= range.end) continue;
    const { word } = span;
    const length = span.end - span.start;
    const from = Math.max(range.start, span.start) - span.start;
    const to = Math.min(range.end, span.end) - span.start;
    const unit = (word.x1 - word.x0) / length;
    const x0 = from === 0 ? word.x0 : word.x0 + unit * (from - 1);
    const x1 = to === length ? word.x1 : word.x0 + unit * (to + 1);
    const { segment } = layout.lines[span.line];
    const box = byLine.get(span.line);
    byLine.set(span.line, box
      ? { ...box, x0: Math.min(box.x0, x0), x1: Math.max(box.x1, x1) }
      : { x0, x1, y0: segment.y0, y1: segment.y1 });
  }
  const boxes = [...byLine.values()];
  if (!boxes.length) return [];
  const padX = layout.height * 0.3;
  const padY = layout.height * 0.15;
  return (range.whole ? [boxOf(boxes)] : boxes).map((box) => ({
    x0: Math.max(0, box.x0 - padX),
    y0: Math.max(0, box.y0 - padY),
    x1: Math.min(layout.width ?? Infinity, box.x1 + padX),
    y1: Math.min(layout.pageHeight ?? Infinity, box.y1 + padY),
    kind: range.kind,
  }));
}

function mergeBoxes(boxes) {
  const list = boxes.map((box) => ({ ...box }));
  for (let changed = true; changed;) {
    changed = false;
    for (let i = 0; i < list.length && !changed; i += 1) {
      for (let j = i + 1; j < list.length && !changed; j += 1) {
        const a = list[i];
        const b = list[j];
        const overlapX = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const overlapY = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (overlapX < 0 || overlapY <= 0) continue;
        const sameRow = overlapY >= Math.min(a.y1 - a.y0, b.y1 - b.y0) * 0.6;
        const inside = (outer, inner) => outer.x0 <= inner.x0 && outer.y0 <= inner.y0 && outer.x1 >= inner.x1 && outer.y1 >= inner.y1;
        if (!sameRow && !inside(a, b) && !inside(b, a)) continue;
        list[i] = { ...boxOf([a, b]), kind: KIND_ORDER.indexOf(a.kind) <= KIND_ORDER.indexOf(b.kind) ? a.kind : b.kind };
        list.splice(j, 1);
        changed = true;
      }
    }
  }
  return list;
}

export function findPrivate(pages, country) {
  const layouts = pages.map(readLayout);
  const known = { names: new Set(), strings: new Map() };
  const ranges = layouts.map((layout, index) => [
    ...addressRanges(layout, known),
    ...greetingRanges(layout, known),
    ...labelledNameRanges(layout, known),
    ...valueRanges(layout.text, country, known),
    ...patternRanges(layout.text),
  ]);
  layouts.forEach((layout, index) => ranges[index].push(...knownRanges(layout.text, known)));
  return layouts.flatMap((layout, index) => mergeBoxes(ranges[index].flatMap((range) => rangeBoxes(layout, range)))
    .sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
    .map((box) => ({ page: index, ...box })));
}
