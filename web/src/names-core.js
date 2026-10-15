export const MAX_PIECES = 400;
export const MAX_WORD_PIECES = 32;

export function chunkWords(counts, limit = MAX_PIECES) {
  const chunks = [];
  let start = 0;
  let total = 0;
  counts.forEach((count, index) => {
    if (index > start && total + count > limit) {
      chunks.push([start, index]);
      start = index;
      total = 0;
    }
    total += count;
  });
  if (counts.length > start) chunks.push([start, counts.length]);
  return chunks;
}

export function bestLabel(values, labels) {
  let best = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > values[best]) best = index;
  }
  let sum = 0;
  for (const value of values) sum += Math.exp(value - values[best]);
  return { label: labels[best], score: 1 / sum };
}

export function tagWords(data, width, counts, labels) {
  const tags = [];
  let position = 1;
  for (const count of counts) {
    tags.push(count ? bestLabel(Array.from(data.slice(position * width, (position + 1) * width)), labels) : null);
    position += count;
  }
  return tags;
}
