export function detectPlatform({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/Android/.test(userAgent)) return /Firefox\//.test(userAgent) ? 'android-firefox' : 'android';
  const iPadOs = platform === 'MacIntel' && maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(userAgent) || iPadOs) return 'ios';
  if (/Firefox\//.test(userAgent)) return 'firefox';
  if (/Edg\//.test(userAgent)) return 'edge';
  if (/Chrome\/|Chromium\//.test(userAgent)) return 'chrome';
  if (/Macintosh/.test(userAgent) && /Safari\//.test(userAgent)) return 'mac-safari';
  return 'other';
}

const share = { icon: 'share' };
const menu = { icon: 'menu' };
const install = { icon: 'install' };

export const INSTALL_HELP = {
  ios: {
    title: 'On iPhone or iPad',
    steps: [
      ['Tap the ', share, ' ', { strong: 'Share' }, ' button (at the bottom in Safari, top right in Chrome).'],
      ['Scroll down and tap ', { strong: 'Add to Home Screen' }, '.'],
      ['Tap ', { strong: 'Add' }, '. Briefly now sits on your home screen.'],
    ],
  },
  android: {
    title: 'On Android',
    steps: [
      ['Tap the menu ', menu, ' at the top right.'],
      ['Tap ', { strong: 'Install app' }, ' or ', { strong: 'Add to Home screen' }, '.'],
      ['Tap ', { strong: 'Install' }, '.'],
    ],
  },
  'android-firefox': {
    title: 'In Firefox on Android',
    steps: [
      ['Tap the menu ', menu, '.'],
      ['Tap ', { strong: 'Add app to Home screen' }, ' or ', { strong: 'Install' }, '.'],
    ],
  },
  chrome: {
    title: 'In Chrome on your computer',
    steps: [
      ['Click the install icon ', install, ' at the right end of the address bar.'],
      ['Click ', { strong: 'Install' }, '.'],
    ],
    note: 'Don’t see the icon? Open the menu ⋮ → Cast, save and share → Install page as app.',
  },
  edge: {
    title: 'In Edge on your computer',
    steps: [
      ['Click the ', { strong: 'App available' }, ' icon ', install, ' in the address bar.'],
      ['Click ', { strong: 'Install' }, '.'],
    ],
    note: 'Or open the menu … → Apps → Install this site as an app.',
  },
  'mac-safari': {
    title: 'In Safari on a Mac',
    steps: [
      ['In the menu bar, click ', { strong: 'File' }, '.'],
      ['Click ', { strong: 'Add to Dock' }, ', then ', { strong: 'Add' }, '.'],
    ],
    note: 'Needs macOS Sonoma or newer. On older Macs, use Chrome or Edge to save it.',
  },
  firefox: {
    title: 'In Firefox on your computer',
    steps: [
      ['Firefox can’t save web apps on computers yet. Open this page in ', { strong: 'Chrome' }, ', ', { strong: 'Edge' }, ' or ', { strong: 'Safari' }, ' to save it.'],
      ['Or bookmark it with ', { strong: 'Ctrl+D' }, ' (', { strong: '⌘D' }, ' on Mac). It still works offline after your first visit.'],
    ],
  },
  other: {
    title: 'In your browser',
    steps: [
      ['Open the browser menu.'],
      ['Look for ', { strong: 'Install app' }, ' or ', { strong: 'Add to Home screen' }, '.'],
    ],
  },
};

export function installHelp(platform) {
  return INSTALL_HELP[platform] ?? INSTALL_HELP.other;
}
