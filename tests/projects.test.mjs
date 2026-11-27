import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { createElement } from 'react';
import { act, createRoot, extend } from '@react-three/fiber';
import { projects, projectCopy } from '../src/data/projects.ts';
import { translations } from '../src/data/content.ts';

const require = createRequire(import.meta.url), THREE = require('three');
// Installed React/R3F drives real hooks, commits, refs and unmounts. These host nodes
// stand in for HTML for handler/focus tests; they do not implement browser layout.
function HtmlNode() {
  const group = new THREE.Group();
  for (const key of Reflect.ownKeys(group)) {
    if (key !== 'id') Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(group, key));
  }
  for (const key of ['aria-describedby', 'aria-label', 'aria-labelledby', 'aria-hidden', 'data-project']) this[key] = '';
  this.id = ''; this.style = {}; this.focus = (options) => { focused = this; this.focusOptions = options; };
  this.getBoundingClientRect = () => ({ top: sectionTop });
}
HtmlNode.prototype = Object.create(THREE.Group.prototype);
extend(Object.fromEntries(['Section', 'Div', 'P', 'H1', 'H2', 'H3', 'Button', 'Article', 'Img', 'Span', 'Ul', 'Ol', 'Li', 'A', 'Details', 'Summary', 'Time', 'Strong'].map((name) => [name, HtmlNode])));
const compiled = await build({ stdin: { contents: `export {ContentPanel} from './src/components/LabApp'; export {projects,projectCopy} from './src/data/projects';`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', plugins: [{ name: 'react', setup(b) { b.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, ({path}) => ({ path: pathToFileURL(require.resolve(path)).href, external: true })); } }] });
const { ContentPanel, projects: renderedProjects, projectCopy: renderedCopy } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
let focused, sectionTop = 0;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = { scrollY: 0, scrollTo: ({top}) => { window.scrollY = top; } };
const warn = console.warn;
// R3F intentionally has no text host; text semantics are covered by HTML SSR tests.
console.warn = (...args) => { if (!String(args[0]).startsWith('Text is not allowed in the R3F tree')) warn(...args); };
async function mount(t, lang) {
  const canvas = { width: 640, height: 600, style: {}, addEventListener() {}, removeEventListener() {} };
  const root = createRoot(canvas);
  await root.configure({ gl: { domElement: canvas, setSize() {}, setPixelRatio() {}, render() {}, renderLists: { dispose() {} }, forceContextLoss() {} }, frameloop: 'never', size: { width: 640, height: 600, top: 0, left: 0 } });
  const navigation = [];
  const element = (active = 'projects') => createElement(ContentPanel, { active, lang, onSelect: (id) => navigation.push(id) });
  let store;
  await act(async () => { store = root.render(element()); });
  t.after(async () => { await act(async () => root.unmount()); });
  const nodes = () => { const result = []; store.getState().scene.traverse((node) => { if (node.__r3f) result.push(node); }); return result; };
  const find = (predicate) => nodes().find((node) => predicate(node.__r3f.props));
  return { root, element, navigation, nodes, find };
}
for (const lang of ['en', 'es', 'tr']) {
  test(`${lang}: mounted project selection/Back preserve section, full details, focus and overview scroll`, async (t) => {
    const view = await mount(t, lang);
    for (const project of projects) {
      const entry = view.find((p) => p['aria-label'] === `${translations[lang].openProjectLabel} — ${project.name}`);
      assert.ok(entry);
      window.scrollY = 900; sectionTop = -120;
      await act(async () => entry.__r3f.props.onClick());
      assert.equal(focused.__r3f.props.id, 'section-title');
      assert.deepEqual(focused.focusOptions, { preventScroll: true });
      assert.equal(window.scrollY, 756);
      assert.equal(view.find((p) => p.className === 'project-preview'), undefined);
      const link = view.find((p) => p.href === project.demo);
      assert.ok(link); assert.equal(link.__r3f.props.target, '_blank'); assert.equal(link.__r3f.props.rel, 'noopener noreferrer');
      assert.ok(view.find((p) => p.alt === projectCopy[lang][project.id].imageAlt));
      await act(async () => view.find((p) => p.className?.includes('project-back')).__r3f.props.onClick());
      assert.equal(focused.__r3f.props['aria-label'], `${translations[lang].openProjectLabel} — ${project.name}`);
      assert.equal(window.scrollY, 900);
      assert.deepEqual(view.navigation, [], 'internal navigation never requests another tetrahedron section');
    }
    await act(async () => view.find((p) => p.className === 'project-preview').__r3f.props.onClick());
    await act(async () => view.root.render(view.element('contact')));
    assert.ok(view.find((p) => p.href === 'mailto:jhonjaner11@gmail.com'));
    await act(async () => view.root.render(view.element()));
    assert.ok(view.find((p) => p.className === 'project-preview'), 're-entry resets predictably to overview');
  });
}
test('all sections share a content-independent desktop viewport; mobile stays in document flow', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(min-width: 861px\)\s*\{[^}]*\.app-shell \{ overflow: clip; \}\s*\.visual-pane \{[^}]*align-self: start;[^}]*position: sticky;[^}]*100svh[^}]*max-height:[^}]*min-height: 0;/);
  assert.doesNotMatch(css, /data-section="(?:projects|experience|education)"\] \.visual-pane/);
  assert.match(css, /\.company-logo img \{[^}]*object-fit: contain;/);
  assert.match(css, /\.company-logo \{[^}]*width: 76px; height: 56px; padding: 8px;/);
  assert.match(css, /\.project-preview \{[^}]*140px minmax\(0, 1fr\)/);
  assert.match(css, /\.project-preview \{[^}]*80px minmax\(0, 1fr\)/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.project-view \{ animation: none;/);
});

test('the same explorer handles ten records without component changes', async (t) => {
  const originalLength = renderedProjects.length;
  const fixtureIds = [];
  try {
    for (let i = originalLength; i < 10; i++) {
      const id = `fixture-${i}`; fixtureIds.push(id);
      renderedProjects.push({ ...renderedProjects[0], id, name: `Fixture ${i}` });
      for (const lang of ['en', 'es', 'tr']) renderedCopy[lang][id] = { ...renderedCopy[lang]['travel-maps'] };
    }
    const view = await mount(t, 'en');
    assert.equal(view.nodes().filter((n) => n.__r3f.props.className === 'project-preview').length, 10);
    const last = view.find((p) => p['aria-label'] === 'Open project — Fixture 9');
    await act(async () => last.__r3f.props.onClick());
    assert.ok(view.find((p) => p['data-project'] === 'fixture-9'));
    await act(async () => view.find((p) => p.className?.includes('project-back')).__r3f.props.onClick());
    assert.equal(focused.__r3f.props['aria-label'], 'Open project — Fixture 9');
    assert.equal(view.nodes().filter((n) => n.__r3f.props.className === 'project-preview').length, 10);
    assert.deepEqual(view.navigation, []);
  } finally {
    renderedProjects.splice(originalLength);
    for (const lang of ['en', 'es', 'tr']) for (const id of fixtureIds) delete renderedCopy[lang][id];
  }
});
