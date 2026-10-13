import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildPages, sitemap } from '../scripts/pages.mjs';

const web = new URL('../web/', import.meta.url).pathname;
const pages = buildPages();
const paths = new Set(pages.map((page) => page.path));

function exists(href) {
  const path = href.split('#')[0].split('?')[0];
  if (path === '/' || paths.has(path)) return true;
  return existsSync(join(web, path));
}

test('every page has a unique title and a description', () => {
  const titles = new Map();
  for (const page of pages) {
    assert.ok(page.title.length > 10, page.path);
    assert.ok(page.description.length > 40, `${page.path} description too short`);
    assert.ok(!titles.has(page.title), `duplicate title: ${page.title}`);
    titles.set(page.title, page.path);
  }
});

test('all internal links point to real pages or files', () => {
  for (const page of pages) {
    for (const [, href] of page.html.matchAll(/href="(\/[^"]*)"/g)) {
      assert.ok(exists(href), `${page.path} links to missing ${href}`);
    }
  }
});

test('the home page links to every country and tool page', () => {
  const home = readFileSync(join(web, 'index.html'), 'utf8');
  for (const page of pages.filter((item) => item.path.split('/').length === 3 && item.path !== '/404.html')) {
    assert.ok(home.includes(`href="${page.path}"`), `home page does not link to ${page.path}`);
  }
});

test('sitemap lists every indexable page', () => {
  const xml = sitemap(pages);
  for (const page of pages.filter((item) => !item.noIndex)) assert.ok(xml.includes(`${page.path}</loc>`), page.path);
  assert.ok(!xml.includes('/404.html'));
});

test('generated files are up to date', () => {
  for (const page of pages) {
    const file = page.path.endsWith('/') ? join(web, page.path, 'index.html') : join(web, page.path);
    assert.ok(existsSync(file), `missing ${file} — run npm run pages`);
    assert.equal(readFileSync(file, 'utf8'), page.html, `${page.path} is out of date — run npm run pages`);
  }
});
