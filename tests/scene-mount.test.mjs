import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { createElement, lazy } from 'react';
import { act, createRoot, extend } from '@react-three/fiber';
import { CvOrbit } from '../src/interaction/accessories.ts';

// Use the installed reconciler and Three catalogue, not a mock of applyProps.
const require = createRequire(import.meta.url);
const THREE = require('three');
extend(THREE);
// A minimal host object for this component's wrapper; no DOM or GPU is simulated.
class ReadinessHost extends THREE.Group { ['data-ready'] = false; ['data-renderer-state'] = 'loading'; }
extend({ Div: ReadinessHost });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const compiled = await build({
  stdin: {
    contents: `export {InteractiveTetra, SatelliteMotion} from './src/components/TetraScene';
      export {TetraController} from './src/interaction/TetraController';
      export {SceneRuntime} from './src/components/SceneRuntime';
      export {SceneBoundary} from './src/components/SceneBoundary';
      export {SceneExperience} from './src/components/SceneExperience';`,
    resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'tsx',
  },
  bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic',
  plugins: [{ name: 'installed-runtime', setup(builder) {
    builder.onResolve({ filter: /^(react|react-dom|three|@react-three\/fiber)(\/.*)?$/ }, ({ path }) => ({ path: pathToFileURL(require.resolve(path)).href, external: true }));
  } }],
});
const { InteractiveTetra, SatelliteMotion, TetraController, SceneRuntime, SceneBoundary, SceneExperience } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);

class Canvas extends EventTarget {
  width = 640; height = 600; style = {}; captured = new Set();
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; }
  setPointerCapture(id) { this.captured.add(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  getContext() { return { createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }; }
}
globalThis.window = new EventTarget();
globalThis.document = Object.assign(new EventTarget(), { hidden: false, activeElement: null, createElement: () => new Canvas() });

function frame(store, time) { store.getState().advance(time, false); }
function advance(store, start = 0, seconds = 3) {
  for (let i = 1; i <= seconds * 60; i++) frame(store, start + i / 60);
}

async function mount(t, { throwRender = false, satelliteEnabled = false, shaderFailure = false } = {}) {
  const canvas = new Canvas(), controller = new TetraController(), errors = [];
  let renders = 0, readyCalls = 0;
  const renderer = {
    domElement: canvas, debug: { onShaderError: null, checkShaderErrors: true },
    setSize() {}, setPixelRatio() {}, renderLists: { dispose() {} }, forceContextLoss() {},
    render() {
      if (throwRender) throw new Error('GPU render failed');
      if (shaderFailure) this.debug.onShaderError({ getProgramInfoLog: () => 'compile failed', getShaderInfoLog: () => '' }, {}, {}, {});
      renders++;
    },
  };
  const root = createRoot(canvas);
  await root.configure({ gl: renderer, frameloop: 'never', dpr: 1, size: { width: 640, height: 600, top: 0, left: 0 }, camera: { position: [0, 0, 7.7], fov: 40 } });
  const orbit = new CvOrbit(), satellite = { current: { style: {}, dataset: {} } };
  const onFailure = (error) => { errors.push(error); controller.setAvailable(false); };
  const element = () => createElement('group', { name: 'scene' },
    createElement(SceneRuntime, { onFailure, onReady: () => { readyCalls++; } }),
    createElement(SatelliteMotion, { orbit, element: satellite, controller, reducedMotion: controller.reducedMotion, enabled: satelliteEnabled, onFailure }),
    createElement(InteractiveTetra, { controller, daylight: false, reducedMotion: false, labels: {}, onFailure }),
  );
  let store;
  await act(async () => { store = root.render(element()); });
  t.after(async () => { await act(async () => root.unmount()); });
  const tetra = store.getState().scene.getObjectByName('scene')?.children[0];
  return { canvas, controller, errors, renderer, root, store, tetra, element, orbit, satellite, renders: () => renders, readyCalls: () => readyCalls };
}

test('mounted renderer announces readiness once after a successful frame, never on a throwing or shader-failed frame', async (t) => {
  const success = await mount(t);
  assert.equal(success.readyCalls(), 0, 'mounting alone is not GPU readiness');
  frame(success.store, 1 / 60);
  assert.equal(success.readyCalls(), 1);
  advance(success.store, 1 / 60);
  assert.equal(success.readyCalls(), 1, 'idle does not produce readiness renders');
  const throwing = await mount(t, { throwRender: true }); frame(throwing.store, 1 / 60);
  const shader = await mount(t, { shaderFailure: true }); frame(shader.store, 1 / 60);
  assert.equal(throwing.readyCalls(), 0); assert.equal(shader.readyCalls(), 0);
  assert.match(shader.errors[0].message, /compile failed/);
});

async function mountExperience(t, { webgl = true, Renderer } = {}) {
  const canvas = new Canvas(), root = createRoot(canvas), errors = [];
  const controller = new TetraController(); let callbacks;
  const fakeRenderer = { domElement: canvas, setSize() {}, setPixelRatio() {}, render() {}, renderLists: { dispose() {} }, forceContextLoss() {} };
  await root.configure({ gl: fakeRenderer, frameloop: 'never', dpr: 1, size: { width: 640, height: 600, top: 0, left: 0 } });
  function SuccessfulScene(props) { callbacks = props; return createElement('group', { name: `live-${props.selected}` }); }
  const onFailure = (error) => { errors.push(error); controller.setAvailable(false); };
  const element = (selected = 'home') => createElement(SceneExperience, {
    webgl, Renderer: Renderer ?? SuccessfulScene, controller, selected, lang: 'en', daylight: false, reducedMotion: false, onFailure,
    onSelect: (id) => controller.request(id), loading: createElement('group', { name: 'loading' }), fallback: createElement('group', { name: 'static-fallback' }),
  });
  let store;
  await act(async () => { store = root.render(element()); });
  t.after(async () => { await act(async () => root.unmount()); });
  return { errors, controller, root, element, scene: store.getState().scene, callbacks: () => callbacks };
}

test('mounted readiness component remains nonblocking while slow, then removes loading without restarting on section navigation', async (t) => {
  const view = await mountExperience(t);
  assert.ok(view.scene.getObjectByName('loading'));
  assert.ok(view.scene.getObjectByName('live-home'), 'scene mounts alongside the indicator');
  view.controller.request('experience'); assert.equal(view.controller.active, 'experience', 'HTML navigation is independent before a renderer is available');
  await act(async () => { view.callbacks().onReady(); });
  assert.equal(view.scene.getObjectByName('loading'), undefined);
  await act(async () => { view.root.render(view.element('contact')); });
  assert.ok(view.scene.getObjectByName('live-contact'));
  assert.equal(view.scene.getObjectByName('loading'), undefined, 'no loader between faces');
  assert.deepEqual(view.errors, []);
});

test('mounted Suspense waits for the actual renderer module and initialization before dismissing loading', async (t) => {
  let resolveModule, callbacks;
  const Renderer = lazy(() => new Promise((resolve) => { resolveModule = resolve; }));
  const view = await mountExperience(t, { Renderer });
  assert.ok(view.scene.getObjectByName('loading'));
  await act(async () => { resolveModule({ default: (props) => { callbacks = props; return createElement('group', { name: 'resolved-renderer' }); } }); });
  assert.ok(view.scene.getObjectByName('resolved-renderer'));
  assert.ok(view.scene.getObjectByName('loading'), 'download completion alone is not readiness');
  await act(async () => { callbacks.onReady(); });
  assert.equal(view.scene.getObjectByName('loading'), undefined);
});

test('mounted runtime failure and unavailable WebGL dismiss loading and retain a static fallback', async (t) => {
  const view = await mountExperience(t);
  const original = new Error('context unavailable');
  await act(async () => { view.callbacks().onFailure(original); view.callbacks().onReady(); });
  assert.ok(view.scene.getObjectByName('static-fallback'));
  assert.equal(view.scene.getObjectByName('loading'), undefined);
  assert.deepEqual(view.errors, [original], 'original failure is reported');
  const unavailable = await mountExperience(t, { webgl: false });
  assert.ok(unavailable.scene.getObjectByName('static-fallback'));
  assert.equal(unavailable.scene.getObjectByName('loading'), undefined);
});

test('mounted renderer module rejection reaches the real boundary and dismisses loading', async (t) => {
  t.mock.method(console, 'error', () => {});
  const original = new Error('renderer download failed');
  const Renderer = lazy(() => Promise.reject(original));
  const view = await mountExperience(t, { Renderer });
  assert.ok(view.scene.getObjectByName('static-fallback'));
  assert.equal(view.scene.getObjectByName('loading'), undefined);
  assert.deepEqual(view.errors, [original]);
});

test('mounted startup deadline waits while hidden and activates fallback if a visible scene never produces a frame', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  document.hidden = true;
  t.after(() => { document.hidden = false; });
  const view = await mountExperience(t);
  await act(async () => { t.mock.timers.tick(31_000); });
  assert.deepEqual(view.errors, [], 'background RAF suspension is not failure');
  document.hidden = false; document.dispatchEvent(new Event('visibilitychange'));
  await act(async () => { t.mock.timers.tick(29_999); });
  assert.ok(view.scene.getObjectByName('loading'));
  await act(async () => { t.mock.timers.tick(1); });
  assert.ok(view.scene.getObjectByName('static-fallback'));
  assert.equal(view.scene.getObjectByName('loading'), undefined);
  assert.match(view.errors[0].message, /30 seconds/);
});

test('actual scene mounts through R3F with source-class quaternion and keeps Object3D quaternion identity', async (t) => {
  const { controller, store, tetra, errors, root, element, renders } = await mount(t);
  assert.ok(tetra, 'the real InteractiveTetra group mounted');
  assert.notEqual(tetra.quaternion.constructor, controller.orientation.constructor, 'reproduce the source-vs-bundle constructor mismatch');
  assert.equal(Object.getOwnPropertyDescriptor(tetra, 'quaternion').writable, false);
  const quaternion = tetra.quaternion;
  assert.ok(quaternion.angleTo(controller.orientation) < 1e-7, 'initial orientation is copied before rendering');
  const meshes = tetra.children.filter((child) => child.isMesh);
  assert.equal(meshes.length, 4, 'all four glass faces exist');
  assert.ok(meshes.every((mesh) => mesh.material.isShaderMaterial && mesh.material.transparent));
  assert.ok(tetra.children[0].children.some((child) => child.geometry?.type === 'SphereGeometry'), 'solar core exists');

  frame(store, 1 / 60);
  assert.equal(renders(), 1, 'frame reaches the renderer');
  assert.equal(tetra.quaternion, quaternion);
  for (const [i, id] of ['projects', 'experience', 'education', 'contact', 'home'].entries()) {
    controller.request(id); advance(store, i * 3 + 1 / 60);
    assert.equal(controller.active, id);
    assert.equal(tetra.quaternion, quaternion, 'navigation mutates the existing instance');
    assert.ok(quaternion.angleTo(controller.orientation) < 1e-7);
    await act(async () => { root.render(element()); });
    assert.equal(tetra.quaternion, quaternion, 'React prop updates do not replace the instance');
  }
  const beforeIdle = quaternion.clone(); advance(store, 15 + 1 / 60, 3);
  assert.ok(quaternion.angleTo(beforeIdle) > 0.001, 'idle animation still reaches the mounted object');
  assert.deepEqual(errors, []);
});

test('mounted scene follows drag, inertia and settling before committing exactly once', async (t) => {
  const { controller, store, tetra, errors } = await mount(t);
  const commits = []; controller.subscribe(() => commits.push(controller.active));
  const before = tetra.quaternion.clone();
  controller.beginDrag(1, 0, 0, 0, 'projects'); controller.drag(1, 220, 60, 32);
  frame(store, 1 / 60);
  assert.ok(tetra.quaternion.angleTo(before) > 0.5);
  assert.equal(controller.active, 'home');
  controller.endDrag(1, 33); advance(store, 1 / 60, 0.2);
  assert.equal(controller.active, 'home'); assert.equal(commits.length, 0);
  advance(store, 0.2 + 1 / 60, 5);
  assert.equal(controller.phase, 'idle'); assert.ok(commits.length <= 1);
  assert.ok(tetra.quaternion.angleTo(controller.orientation) < 1e-7);
  assert.deepEqual(errors, []);
});

test('runtime animation and renderer exceptions report their original errors', async (t) => {
  const mounted = await mount(t);
  const original = new Error('orientation update failed');
  mounted.controller.step = () => { throw original; };
  assert.doesNotThrow(() => frame(mounted.store, 1 / 60));
  assert.equal(mounted.errors[0], original);
  assert.equal(mounted.controller.available, false);

  const broken = await mount(t, { throwRender: true });
  assert.doesNotThrow(() => frame(broken.store, 1 / 60));
  assert.equal(broken.errors[0].message, 'GPU render failed');
  assert.equal(broken.controller.available, false);
});

test('mounted context-loss listener reports failure and makes pending HTML navigation immediate', async (t) => {
  const { canvas, controller, errors } = await mount(t);
  controller.request('contact');
  const event = new Event('webglcontextlost', { cancelable: true }); canvas.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(errors[0].message, 'WebGL context was lost.');
  assert.equal(controller.available, false); assert.equal(controller.active, 'contact');
  controller.request('experience'); assert.equal(controller.active, 'experience');
});

test('shader failure preserves program, vertex and fragment diagnostics and restores renderer hooks on unmount', async (t) => {
  const { renderer, errors, root } = await mount(t);
  const vertex = {}, fragment = {};
  renderer.debug.onShaderError({
    getProgramInfoLog: () => 'program link log',
    getShaderInfoLog: (shader) => shader === vertex ? 'vertex compiler log' : 'fragment compiler log',
  }, {}, vertex, fragment);
  assert.match(errors[0].message, /program link log/);
  assert.match(errors[0].message, /vertex compiler log/);
  assert.match(errors[0].message, /fragment compiler log/);
  await act(async () => root.unmount());
  assert.equal(renderer.debug.onShaderError, null);
});

test('renderer initialization failure rejects the actual R3F configuration instead of starting an empty scene', async (t) => {
  const root = createRoot(new Canvas());
  t.after(async () => { await act(async () => root.unmount()); });
  const original = new Error('WebGL initialization failed');
  await assert.rejects(root.configure({ gl: () => { throw original; }, dpr: 1, frameloop: 'never' }), (error) => error === original);
  assert.equal(root.ready.status, 'rejected');
});

test('actual React scene error boundary immediately mounts its fallback on a child mount error', async (t) => {
  // R3F captures console.error when creating the root, so intercept before it.
  const reported = [];
  t.mock.method(console, 'error', (...args) => reported.push(args));
  const canvas = new Canvas(), root = createRoot(canvas), errors = [];
  await root.configure({ gl: { domElement: canvas, setSize() {}, setPixelRatio() {}, render() {} }, frameloop: 'never', dpr: 1, size: { width: 640, height: 600, top: 0, left: 0 } });
  t.after(async () => { await act(async () => root.unmount()); });
  const original = new Error('scene initialization failed');
  function BrokenScene() { throw original; }
  let store;
  await act(async () => {
    store = root.render(createElement(SceneBoundary, { fallback: createElement('group', { name: 'static-fallback' }), onFailure: (error) => errors.push(error) }, createElement(BrokenScene)));
  });
  assert.ok(store.getState().scene.getObjectByName('static-fallback'));
  assert.equal(errors[0], original);
  assert.ok(reported.some((args) => args[0] === original));
});

test('mounted native pointer handlers accept touch-style face drags without treating Home as a face', async (t) => {
  const { canvas, controller, store, tetra, errors } = await mount(t);
  const before = tetra.quaternion.clone();
  const pointer = (type, x, y, time) => {
    const event = new Event(type);
    Object.defineProperties(event, Object.fromEntries(Object.entries({ pointerId: 7, clientX: x, clientY: y, timeStamp: time, pointerType: 'touch', isPrimary: true, button: 0 }).map(([key, value]) => [key, { value }])));
    canvas.dispatchEvent(event);
  };
  pointer('pointerdown', 320, 300, 0);
  assert.equal(controller.phase, 'dragging'); assert.ok(canvas.hasPointerCapture(7));
  pointer('pointermove', 510, 245, 32); frame(store, 1 / 60);
  assert.ok(tetra.quaternion.angleTo(before) > 0.5);
  assert.equal(controller.active, 'home');
  pointer('pointerup', 510, 245, 33); assert.equal(canvas.hasPointerCapture(7), false);
  pointer('lostpointercapture', 510, 245, 34); advance(store, 1 / 60, 5);
  assert.notEqual(controller.active, 'home'); assert.ok(controller.activeFace);
  assert.deepEqual(errors, []);
});

test('mounted satellite respects its enable gate and follows independent paused motion when enabled', async (t) => {
  const hidden = await mount(t); advance(hidden.store);
  assert.deepEqual(hidden.satellite.current.style, {});
  const shown = await mount(t, { satelliteEnabled: true });
  frame(shown.store, 1 / 60);
  assert.equal(shown.satellite.current.style.visibility, 'visible');
  assert.ok(['left', 'right'].includes(shown.satellite.current.dataset.labelSide), 'label is anchored inward at the orbital edges');
  const before = shown.satellite.current.style.transform;
  shown.orbit.pause('focus', true); advance(shown.store, 1 / 60);
  assert.equal(shown.satellite.current.style.transform, before);
  assert.equal(shown.controller.active, 'home');
  shown.orbit.pause('focus', false); advance(shown.store, 3 + 1 / 60);
  assert.notEqual(shown.satellite.current.style.transform, before);
  const still = shown.satellite.current.style.transform;
  shown.controller.setReducedMotion(true);
  await act(async () => shown.root.render(shown.element()));
  advance(shown.store, 6 + 1 / 60);
  assert.equal(shown.satellite.current.style.transform, still);
  assert.deepEqual(shown.errors, []);
});
