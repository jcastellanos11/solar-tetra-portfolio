import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { initialLoadingHtml, injectInitialLoading, loadingCopy, loadingStyles } from '../src/loading/bootstrap.ts';
import { rendererPending, watchRenderer, rendererDeadlineMs, sceneDpr } from '../src/loading/readiness.ts';

test('initial branded status is HTML with inline critical styles and SVG before the application module', () => {
  const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const html = injectInitialLoading(template);
  assert.ok(html.indexOf('role="status"') < html.indexOf('src="/src/main.tsx"'));
  assert.match(html, /<svg/); assert.match(html, /Solar Tetra/); assert.match(html, /Initializing experience/);
  assert.match(html, /id="solar-loading-styles"/);
  assert.ok(html.indexOf('id="solar-loading-styles"') < html.indexOf('</head>'), 'critical styles survive React replacing root children');
  assert.doesNotMatch(initialLoadingHtml(), /three|WebGL|import\(|\.js\b|percent/i);
  assert.match(html, /<noscript>/);
});

for (const lang of ['en', 'es', 'tr']) test(`${lang}: early bootstrap translates and restores theme before React, including inaccessible storage`, () => {
  const html = initialLoadingHtml(), message = {}, document = { documentElement: { dataset: {} }, getElementById: () => message };
  const code = html.match(/<script>(.*?)<\/script>/s)[1];
  runInNewContext(code, { document, localStorage: { getItem: (key) => key === 'solar-language' ? lang : 'light' } });
  assert.equal(message.textContent, loadingCopy[lang].application);
  assert.equal(document.documentElement.lang, lang); assert.equal(document.documentElement.dataset.theme, 'light');
  runInNewContext(code, { document, localStorage: { getItem() { throw new Error('storage disabled'); } } });
  assert.equal(message.textContent, loadingCopy.en.application);
});

test('loading motion is disabled by CSS before JavaScript and the scene indicator cannot intercept input', () => {
  assert.match(loadingStyles, /@media\(prefers-reduced-motion:reduce\).*animation:none/s);
  assert.match(loadingStyles, /pointer-events:none/);
  assert.doesNotMatch(loadingStyles, /position:fixed/);
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.app-shell.*animation: none/);
});

test('renderer deadline reports a real failure and cancellation leaves no delayed failure after readiness', () => {
  let callback, duration, cancelled;
  const errors = [], schedule = (fn, ms) => { callback = fn; duration = ms; return 7; }, cancel = (id) => { cancelled = id; };
  const stop = watchRenderer((error) => errors.push(error), schedule, cancel);
  assert.equal(duration, rendererDeadlineMs); assert.equal(errors.length, 0);
  stop(); assert.equal(cancelled, 7);
  callback(); assert.equal(errors.length, 0, 'cancelled or outdated deadline cannot activate fallback');
  watchRenderer((error) => errors.push(error), schedule, cancel);
  callback(); assert.match(errors[0].message, /30 seconds/);
  assert.equal(rendererPending(true, false), true); assert.equal(rendererPending(null, false), true);
  assert.equal(rendererPending(false, false), false); assert.equal(rendererPending(true, true), false);
});

test('coarse-pointer pixel budget is reduced without changing desktop or material quality', () => {
  assert.deepEqual(sceneDpr(true), [1, 1.25]); assert.deepEqual(sceneDpr(false), [1, 1.5]);
});
