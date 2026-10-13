import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectPlatform, installHelp } from '../web/src/install.js';

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
};

test('detects where the user is, to show the right save steps', () => {
  assert.equal(detectPlatform({ userAgent: UA.iphone }), 'ios');
  assert.equal(detectPlatform({ userAgent: UA.macSafari, platform: 'MacIntel', maxTouchPoints: 5 }), 'ios');
  assert.equal(detectPlatform({ userAgent: UA.android }), 'android');
  assert.equal(detectPlatform({ userAgent: UA.android, platform: 'MacIntel', maxTouchPoints: 5 }), 'android');
  assert.equal(detectPlatform({ userAgent: UA.macChrome, platform: 'MacIntel' }), 'chrome');
  assert.equal(detectPlatform({ userAgent: UA.macSafari, platform: 'MacIntel' }), 'mac-safari');
  assert.equal(detectPlatform({ userAgent: UA.edge }), 'edge');
  assert.equal(detectPlatform({ userAgent: UA.firefox }), 'firefox');
  assert.equal(detectPlatform({ userAgent: 'Something' }), 'other');
});

test('every platform has steps', () => {
  for (const platform of ['ios', 'android', 'android-firefox', 'chrome', 'edge', 'mac-safari', 'firefox', 'other', 'unknown']) {
    assert.ok(installHelp(platform).steps.length > 0);
  }
});
