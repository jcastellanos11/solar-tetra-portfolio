import test from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { CvOrbit, HomePress, satellitePosition, clearSatelliteLabel } from '../src/interaction/accessories.ts';
import { translations } from '../src/data/content.ts';
import { cvCatalog, selectCv } from '../src/data/cv.ts';

const require = createRequire(import.meta.url);
const { outputFiles } = await build({
  stdin: {
    contents: `import { createElement } from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { CvSatellite, CvDownload } from './src/components/CvSatellite';
      import { HomeControl } from './src/components/HomeControl';
      export const satellite = (lang, orbit, element, catalog) => CvSatellite({lang, orbit, element, catalog});
      export const download = (lang, catalog) => CvDownload({lang, catalog});
      export const html = (element) => element ? renderToStaticMarkup(element) : '';
      export const home = (lang) => renderToStaticMarkup(createElement(HomeControl, {lang, active: 'home', onSelect: () => {}}));`,
    resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'tsx',
  },
  bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic',
  plugins: [{ name: 'shared-react', setup(builder) {
    builder.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, ({ path }) => ({ path: pathToFileURL(require.resolve(path)).href, external: true }));
  } }],
});
const view = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const fixture = { en: { approved: true, file: 'john-castellanos-cv-en.pdf' } };

test('CV satellite and Contact link remain absent if no language version is approved', () => {
  const orbit = new CvOrbit(), element = { current: null };
  for (const catalog of [{}, { en: { ...fixture.en, approved: false } }]) {
    assert.equal(view.satellite('en', orbit, element, catalog), null);
    assert.equal(view.download('en', catalog), null);
  }
});

test('approved English satellite and Contact link share the real native target and translated PDF language in all languages', () => {
  for (const lang of ['en', 'es', 'tr']) {
    const orbit = new CvOrbit(), satellite = view.satellite(lang, orbit, { current: null }, fixture);
    const html = view.html(satellite), contact = view.html(view.download(lang, fixture));
    for (const value of [html, contact]) {
      assert.ok(value.includes(`href="/cv/${fixture.en.file}"`)); assert.ok(value.includes(`download="${fixture.en.file}"`));
      assert.match(value, /hrefLang="en" type="application\/pdf"/);
      assert.ok(value.includes(translations[lang].cvLabel));
      assert.ok(value.includes(translations[lang].cvLanguages.en));
    }
    assert.equal(satellite.type, 'a');
    assert.equal(satellite.props.draggable, false, 'native link dragging cannot compete with pointer capture');
    assert.match(html, /<svg aria-hidden="true"/);
  }
});

test('default approved metadata activates both download surfaces without fixtures', () => {
  assert.equal(cvCatalog.en.approved, true); assert.equal(cvCatalog.es.approved, false); assert.equal(cvCatalog.tr.approved, false);
  for (const lang of ['en', 'es', 'tr']) {
    const cv = selectCv(lang);
    assert.equal(cv.language, 'en'); assert.equal(cv.href, '/cv/john-castellanos-cv-en.pdf');
    assert.match(view.html(view.satellite(lang, new CvOrbit(), { current: null })), /class="cv-satellite"/);
    assert.ok(view.html(view.download(lang)).includes(cv.href));
  }
});

test('future approved translations select their own assets using metadata alone and fall back only to English', () => {
  const catalog = structuredClone(cvCatalog);
  catalog.es.approved = true;
  assert.equal(selectCv('es', catalog).language, 'es');
  assert.equal(selectCv('tr', catalog).language, 'en');
  catalog.tr.approved = true;
  for (const lang of ['en', 'es', 'tr']) {
    const satellite = view.html(view.satellite(lang, new CvOrbit(), { current: null }, catalog));
    const contact = view.html(view.download(lang, catalog));
    for (const html of [satellite, contact]) {
      assert.ok(html.includes(`href="/cv/john-castellanos-cv-${lang}.pdf"`));
      assert.ok(html.includes(`hrefLang="${lang}"`));
      assert.ok(html.includes(translations[lang].cvLanguages[lang]));
    }
  }
  delete catalog.en; delete catalog.tr;
  assert.equal(selectCv('tr', catalog), null, 'Spanish is not an implicit fallback');
});

test('actual satellite handlers pause independently for hover and keyboard focus, then resume without a phase jump', () => {
  const orbit = new CvOrbit(), satellite = view.satellite('en', orbit, { current: null }, fixture);
  const handlers = satellite.props, start = orbit.angle;
  handlers.onPointerEnter(); orbit.step(0.05, false); assert.equal(orbit.angle, start);
  handlers.onFocus(); handlers.onPointerLeave(); orbit.step(0.05, false); assert.equal(orbit.angle, start);
  handlers.onBlur(); orbit.step(1 / 60, false);
  assert.ok(orbit.angle > start && orbit.angle - start < 0.01);
  const q = orbit.angle; orbit.step(10, true); assert.equal(orbit.angle, q);
  orbit.step(10, false, true); assert.equal(orbit.angle, q);
});

test('satellite tap stays isolated and native; dragging the satellite prevents a download', () => {
  const orbit = new CvOrbit(), { props } = view.satellite('en', orbit, { current: null }, fixture);
  let stopped = 0, prevented = 0, captured = false;
  const event = {
    pointerId: 4, clientX: 10, clientY: 20, detail: 1,
    stopPropagation() { stopped++; }, preventDefault() { prevented++; },
    currentTarget: { setPointerCapture() { captured = true; }, hasPointerCapture() { return captured; }, releasePointerCapture() { captured = false; } },
  };
  props.onPointerDown(event); assert.ok(captured); assert.ok(orbit.paused);
  props.onPointerUp(event); props.onClick(event);
  assert.equal(prevented, 0); assert.equal(stopped, 3); assert.equal(orbit.paused, false);
  props.onPointerDown(event); props.onPointerMove({ ...event, clientX: 100 });
  props.onPointerUp({ ...event, clientX: 100 }); props.onClick(event);
  assert.equal(prevented, 1); assert.equal(orbit.paused, false);
});

test('satellite cancellation clears a held pause and keyboard activation remains available', () => {
  const orbit = new CvOrbit(), { props } = view.satellite('en', orbit, { current: null }, fixture);
  props.onPointerDown({ pointerId: 1, clientX: 0, clientY: 0, stopPropagation() {}, currentTarget: { setPointerCapture() {} } });
  props.onPointerCancel({ stopPropagation() {} }); assert.equal(orbit.paused, false);
  assert.equal(orbit.press.activate(false), false);
  assert.equal(orbit.press.activate(true), true);
});

test('orbital positions remain bounded and move on mobile unless usable space is exhausted', () => {
  for (const [width, height] of [[300, 350], [500, 650], [1000, 800]]) {
    for (let i = 0; i < 100; i++) {
      const p = satellitePosition(width, height, i * 0.1);
      assert.ok(p.x >= 24 && p.x <= width - 24); assert.ok(p.y >= 24 && p.y <= height - 24);
    }
  }
  assert.notDeepEqual(satellitePosition(300, 350, 0), satellitePosition(300, 350, 3));
  const cramped = { top: 130, bottom: 135, labelTop: 100, labelBottom: 130 };
  assert.deepEqual(satellitePosition(280, 180, 0, cramped), satellitePosition(280, 180, 3, cramped));
});

test('central Home control is a labeled native button and pointer movement cannot turn a drag into Home navigation', () => {
  for (const lang of ['en', 'es', 'tr']) {
    assert.match(view.home(lang), /<button type="button" class="core-home-control"/);
    assert.ok(view.home(lang).includes(translations[lang].homeAction));
  }
  const press = new HomePress();
  press.down(1, 100, 100); press.move(1, 102, 101); assert.ok(press.activate(false));
  press.down(1, 100, 100); press.move(2, 200, 200); assert.ok(press.activate(false));
  press.move(1, 150, 100); assert.equal(press.activate(false), false);
  assert.equal(press.activate(true), true);
  press.cancel(); assert.equal(press.activate(false), false);
});

test('responsive orbit clears measured Home/navigation bands and projected face labels', () => {
  for (const width of [280, 320, 375, 390, 430, 768, 1200]) {
    const limits = { top: 124, bottom: 236, labelTop: 118, labelBottom: 242 };
    for (let i = 0; i < 720; i++) {
      const point = satellitePosition(width, 390, i * Math.PI / 360, limits);
      assert.ok(point.x >= 24 && point.x <= width - 24);
      assert.ok(point.y >= limits.top && point.y <= limits.bottom);
      const label = clearSatelliteLabel({ x: width / 2, y: 180 }, 110, 44, width, limits.labelTop, limits.labelBottom, point);
      assert.ok(label, `space exists for a label at ${width}`);
      assert.ok(Math.abs(label.x - point.x) >= 91 - .01 || Math.abs(label.y - point.y) >= 58 - .01);
    }
  }
});

test('compact tooltip is removed even on hover/focus/touch; desktop behavior and accessible names remain', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 860px\)\s*\{\s*\.cv-satellite \.satellite-label \{ display: none; \}/);
  assert.match(css, /\.cv-satellite:hover \.satellite-label, \.cv-satellite:focus \.satellite-label \{ opacity: 1; \}/);
  for (const lang of ['en', 'es', 'tr']) {
    const element = view.satellite(lang, new CvOrbit(), { current: null });
    assert.ok(element.props['aria-label'].includes(translations[lang].cvLabel));
    assert.ok(element.props['aria-label'].includes(translations[lang].cvLanguages.en));
  }
});
