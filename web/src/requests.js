const SENTENCE_END = /(?<=[.!?])\s+(?=[\p{Lu}„"«(])/u;
const LOOK_BACK = 300;

export function sentencesOf(text) {
  const sentences = [];
  let offset = 0;
  for (const line of text.split('\n')) {
    let start = offset;
    for (const part of line.split(SENTENCE_END)) {
      const index = line.indexOf(part, start - offset);
      const from = offset + index;
      if (part.trim()) sentences.push({ start: from, end: from + part.length, text: part.trim() });
      start = from + part.length;
    }
    offset += line.length + 1;
  }
  return sentences;
}

export function findRequests(text, language) {
  const { asks } = language;
  const sentences = sentencesOf(text);
  if (!asks) return { requests: [], nothing: false, sentences };
  const requests = [];
  let nothing = false;
  for (const sentence of sentences) {
    if (asks.none.test(sentence.text)) {
      nothing = true;
      continue;
    }
    const ask = asks.ask.test(sentence.text);
    const owed = asks.owed.test(sentence.text);
    const due = asks.due.test(sentence.text);
    if (!ask && !owed && !due) continue;
    requests.push({ ...sentence, ask, owed, due, pay: (ask && asks.pay.test(sentence.text)) || owed });
  }
  return { requests, nothing, sentences };
}

const inside = (sentence, index) => index >= sentence.start && index < sentence.end;

const WORD = /\p{L}{5,}/gu;

function lineAround(text, index) {
  const start = text.lastIndexOf('\n', index - 1) + 1;
  const stop = text.indexOf('\n', index);
  const own = text.slice(start, stop < 0 ? text.length : stop);
  const leading = !/\p{L}{3,}/u.test(text.slice(start, index));
  const previous = leading ? text.slice(text.lastIndexOf('\n', start - 2) + 1, start) : '';
  return `${previous}${own}`.toLowerCase();
}

function shared(sentence, line) {
  const stems = new Set((sentence.toLowerCase().match(WORD) ?? []).map((word) => word.slice(0, 6)));
  return (line.match(WORD) ?? []).filter((word) => stems.has(word.slice(0, 6))).length;
}

export function askedPayment(requests, items, text = '') {
  const paying = requests.filter((request) => request.pay);
  const pick = (request) => {
    const own = items.filter((item) => inside(request, item.index));
    if (own.length) return own.find((item) => item.total) ?? own[0];
    if (request.owed) return null;
    const before = items.filter((item) => item.index < request.start && request.start - item.index <= LOOK_BACK);
    if (!before.length) return null;
    const ranked = before.map((item, order) => ({ item, order, score: shared(request.text, lineAround(text, item.index)) * 2 + (item.total ? 1 : 0) }));
    ranked.sort((a, b) => b.score - a.score || b.item.amount - a.item.amount);
    return ranked[0].item;
  };
  const picks = [...paying.filter((item) => item.ask), ...paying.filter((item) => !item.ask)]
    .map((request) => ({ item: pick(request), request }))
    .filter((found) => found.item);
  return picks.find((found) => found.item.total) ?? picks[0] ?? null;
}

