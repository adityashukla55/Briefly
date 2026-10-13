export class ReadError extends Error {
  constructor(title, message) {
    super(message);
    this.name = 'ReadError';
    this.title = title;
  }
}

const BROWSERS = 'the latest Chrome, Edge, Firefox or Safari';

export function friendlyError(error, task = 'read') {
  const details = `${error?.name ?? 'Error'}: ${error?.message ?? String(error)}`;
  if (error instanceof ReadError || error?.name === 'ReadError') {
    return { title: error.title, message: error.message, details: null };
  }
  const text = details.toLowerCase();
  if (/load failed|failed to fetch|networkerror|network error|could not load|err_internet|offline/.test(text)) {
    return {
      title: 'No internet for the first run',
      message: task === 'translate'
        ? 'The translator downloads once (about 23 MB). Connect to the internet and try again. After that it works offline.'
        : 'The text reader downloads once (about 6 MB). Connect to the internet and try again. After that it works offline.',
      details,
    };
  }
  if (/out of memory|memory|maximum call stack|allocation|rangeerror/.test(text)) {
    return {
      title: 'This is too big for this device',
      message: 'Try a smaller photo, fewer pages, or a computer instead of a phone.',
      details,
    };
  }
  if (task === 'translate') {
    return {
      title: 'Translation didn’t work in this browser',
      message: `Everything else on this page still works. To translate, try ${BROWSERS}.`,
      details,
    };
  }
  return {
    title: 'Briefly couldn’t read this file',
    message: `Try a photo of the letter instead, or open Briefly in ${BROWSERS}. You can also paste the text.`,
    details,
  };
}

export function missingFeatures(scope = globalThis) {
  const checks = [
    ['WebAssembly', () => typeof scope.WebAssembly === 'object'],
    ['background workers', () => typeof scope.Worker === 'function'],
    ['file reading', () => typeof scope.Blob === 'function' && typeof scope.Blob.prototype.arrayBuffer === 'function'],
    ['streams', () => typeof scope.ReadableStream === 'function'],
    ['canvas', () => typeof scope.HTMLCanvasElement === 'function'],
  ];
  return checks.filter(([, works]) => {
    try {
      return !works();
    } catch {
      return true;
    }
  }).map(([name]) => name);
}
