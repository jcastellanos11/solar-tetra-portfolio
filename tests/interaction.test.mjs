import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Quaternion, Vector3 } from 'three';
import { TetraController } from '../src/interaction/TetraController.ts';
import { faces, faceById } from '../src/interaction/faces.ts';
import { dominantFace, faceScores, motion, restingOrientation } from '../src/interaction/rotation.ts';

const camera = new Vector3(0, 0, 7.7);
function controller() { const c = new TetraController(); c.setAvailable(true); return c; }
function advance(c, seconds = 3, fps = 60) { for (let i = 0; i < seconds * fps; i++) c.step(1 / fps); }
function drag(c, x = 160, y = 40) {
  c.beginDrag(1, 0, 0, 0, faceScores(c.orientation, camera)[0].id);
  c.drag(1, x, y, 32);
}

test('four outward-facing identities exclude Home and have consistent upright orientations', () => {
  assert.deepEqual(faces.map((f) => f.id), ['projects', 'experience', 'education', 'contact']);
  for (const face of faces) {
    assert.ok(face.normal.dot(face.centroid) > 0);
    const q = restingOrientation(face.id);
    assert.ok(face.normal.clone().applyQuaternion(q).distanceTo(new Vector3(0, 0, 1)) < 1e-8);
    assert.equal(faceScores(q, camera)[0].id, face.id);
  }
});

for (const face of faces) {
  test(`explicit ${face.id} selection holds content until alignment completes`, () => {
    const c = controller(); const commits = [];
    c.subscribe(() => commits.push(c.active));
    c.request(face.id);
    assert.equal(c.active, 'home');
    advance(c);
    assert.equal(c.active, face.id);
    assert.equal(c.phase, 'idle');
    assert.deepEqual(commits, [face.id]);
  });

  test(`idle motion keeps ${face.id} dominant and emits no extra commits`, () => {
    const c = controller(); c.request(face.id); advance(c);
    let commits = 0; c.subscribe(() => commits++);
    const first = c.orientation.clone(); let changed = false;
    for (let i = 0; i < 60 * 90; i++) {
      c.step(1 / 60);
      const scores = faceScores(c.orientation, camera);
      assert.equal(scores[0].id, face.id);
      assert.ok(scores[0].score > 0.98);
      changed ||= c.orientation.angleTo(first) > 0.01;
    }
    assert.ok(changed); assert.equal(commits, 0);
  });
}

test('dragging from any active section preserves content until release and settlement', () => {
  for (const face of faces) {
    const c = controller(); c.request(face.id); advance(c);
    const before = c.orientation.clone();
    drag(c);
    assert.ok(c.orientation.angleTo(before) > 0.5);
    advance(c, 2);
    assert.equal(c.active, face.id);
    assert.equal(c.phase, 'dragging');
    const commits = []; c.subscribe(() => commits.push(c.active));
    c.endDrag(1, 33); advance(c, 5);
    assert.equal(c.phase, 'idle');
    assert.ok(commits.length <= 1);
    assert.equal(faceScores(c.orientation, camera)[0].id, c.active);
  }
});

test('small pointer jitter remains a click; a drag does not click its original face', () => {
  const c = controller();
  c.beginDrag(1, 10, 10, 0, 'projects'); c.drag(1, 12, 12, 20); c.endDrag(1, 21);
  assert.equal(c.requested, 'projects'); advance(c);
  drag(c, 350, -70); c.endDrag(1, 33);
  assert.equal(c.phase, 'coasting');
});

test('high angular velocity delays detection and content commits', () => {
  const c = controller(); drag(c, 400, 0); c.endDrag(1, 33);
  advance(c, 0.25);
  assert.equal(c.active, 'home'); assert.equal(c.phase, 'coasting');
  advance(c, 4); assert.equal(c.phase, 'idle');
});

test('release after a stationary hold does not replay stale fling velocity', () => {
  const c = controller(); drag(c); c.endDrag(1, 1200); c.step(1 / 60);
  assert.equal(c.phase, 'settling');
});

test('stationary pointer events also damp old fling velocity before release', () => {
  const c = controller(); drag(c);
  c.drag(1, 160, 40, 1200); c.endDrag(1, 1201); c.step(1 / 60);
  assert.equal(c.phase, 'settling');
});

test('activity feedback changes at interaction boundaries without emitting section commits', () => {
  const c = controller(); let commits = 0; const activity = [];
  c.subscribe(() => commits++); c.subscribeActivity(() => activity.push(c.phase));
  c.request('contact'); advance(c, 0.1);
  assert.deepEqual(activity, ['aligning']); assert.equal(commits, 0);
  c.setAvailable(false);
  assert.deepEqual(activity, ['aligning', 'idle']); assert.equal(commits, 1);
});

test('low-velocity candidate must remain stable for the configured window', () => {
  const c = controller();
  c.beginDrag(1, 0, 0, 0, 'projects'); c.drag(1, 100, 0, 20); c.endDrag(1, 1500);
  advance(c, motion.stableSeconds - 0.04, 100);
  assert.equal(c.phase, 'settling'); assert.equal(c.active, 'home');
  advance(c, 0.08, 100); assert.equal(c.phase, 'aligning');
});

test('near equal face scores retain an incumbent candidate', () => {
  let boundary;
  const a = restingOrientation('projects'), b = restingOrientation('experience');
  for (let i = 0; i <= 2000; i++) {
    const q = a.clone().slerp(b, i / 2000);
    const scores = faceScores(q, camera);
    if (scores[0].id === 'experience' && scores[0].score - scores.find((s) => s.id === 'projects').score < motion.dominanceMargin / 2) { boundary = q; break; }
  }
  assert.ok(boundary);
  assert.equal(dominantFace(boundary, camera, 'projects'), 'projects');
  assert.equal(dominantFace(boundary, camera, 'experience'), 'experience');
  assert.equal(dominantFace(b, camera, 'projects'), 'experience');
});

test('rapid explicit requests invalidate earlier alignment without intermediate commits', () => {
  const c = controller(), commits = []; c.subscribe(() => commits.push(c.active));
  c.request('projects'); advance(c, 0.1);
  c.request('experience'); advance(c, 0.1);
  c.request('contact'); advance(c);
  assert.deepEqual(commits, ['contact']);
});

test('explicit navigation safely interrupts inertia and ignores the old pointer release', () => {
  const c = controller(); drag(c); c.endDrag(1, 33); advance(c, 0.15);
  c.request('contact'); c.drag(1, 500, 500, 200); c.endDrag(1, 201); advance(c);
  assert.equal(c.active, 'contact');
});

test('new dragging interrupts pending alignment and starts exactly at displayed orientation', () => {
  const c = controller(); c.request('projects'); advance(c, 0.2);
  const displayed = c.orientation.clone(), revision = c.revision;
  c.beginDrag(2, 0, 0, 1000, 'contact');
  assert.ok(c.orientation.angleTo(displayed) < 1e-7); assert.ok(c.revision > revision);
  c.drag(2, 150, 50, 1020); c.endDrag(2, 1021); advance(c, 5);
  assert.equal(c.phase, 'idle');
});

test('pointer cancellation and duplicate cancellation return to committed face', () => {
  const c = controller(); c.request('experience'); advance(c); drag(c);
  c.cancelDrag(99); assert.equal(c.phase, 'dragging');
  c.cancelDrag(1); c.cancelDrag(1); advance(c);
  assert.equal(c.active, 'experience'); assert.equal(c.phase, 'idle');
});

test('secondary pointers cannot move or release the initiating gesture', () => {
  const c = controller(); drag(c); const q = c.orientation.clone();
  assert.equal(c.beginDrag(2, 0, 0, 0, 'contact'), false);
  c.drag(2, 999, 999, 100); c.endDrag(2, 101);
  assert.equal(c.phase, 'dragging'); assert.ok(c.orientation.angleTo(q) < 1e-7);
});

test('inertial travel is equivalent at 30, 60 and 120 fps', () => {
  const values = [30, 60, 120].map((fps) => {
    const c = controller(); drag(c, 320, 120); c.endDrag(1, 33); advance(c, 0.5, fps); return c.orientation;
  });
  assert.ok(values[0].angleTo(values[1]) < 1e-6);
  assert.ok(values[1].angleTo(values[2]) < 1e-6);
});

test('reduced motion eliminates idle animation and inertia but retains drag selection', () => {
  const c = controller(); c.setReducedMotion(true); c.request('contact');
  assert.equal(c.active, 'contact'); const q = c.orientation.clone();
  advance(c, 10); assert.ok(c.orientation.angleTo(q) < 1e-7);
  drag(c); c.endDrag(1, 33); c.step(1 / 60);
  assert.equal(c.phase, 'settling'); advance(c, 0.5);
  assert.equal(c.phase, 'idle');
  assert.equal(faceScores(c.orientation, camera)[0].id, c.active);
});

test('enabling reduced motion completes pending explicit alignment immediately', () => {
  const c = controller(); c.request('experience'); c.step(0.02); c.setReducedMotion(true);
  assert.equal(c.active, 'experience'); assert.equal(c.phase, 'idle');
});

test('WebGL loss commits a pending destination and subsequent HTML navigation works', () => {
  const c = controller(); c.request('projects'); c.step(0.02); c.setAvailable(false);
  assert.equal(c.active, 'projects'); c.request('contact'); assert.equal(c.active, 'contact');
  c.setAvailable(true); advance(c); assert.equal(c.active, 'contact');
});

test('WebGL loss during dragging preserves committed content and clears gesture', () => {
  const c = controller(); c.request('experience'); advance(c); drag(c); c.setAvailable(false);
  c.endDrag(1, 33); assert.equal(c.active, 'experience'); assert.equal(c.phase, 'idle');
});

test('rotated camera coordinates still align and detect every face', () => {
  const q = new Quaternion().setFromEuler(new Euler(0.2, 0.6, 0));
  const position = camera.clone().applyQuaternion(q);
  for (const face of faces) {
    const c = controller(); c.setCamera(position, q); c.request(face.id); advance(c);
    assert.equal(faceScores(c.orientation, position)[0].id, face.id);
  }
});

test('long frame gaps do not jump across orientations or settle a gesture instantly', () => {
  const c = controller(); drag(c); c.endDrag(1, 33); const q = c.orientation.clone(); c.step(100);
  assert.ok(c.orientation.angleTo(q) < 0.5); assert.equal(c.active, 'home');
});

test('a full manual turn can expose Education on the former Home face', () => {
  const c = controller(); c.request('projects'); advance(c);
  c.beginDrag(1, 0, 0, 0, 'projects');
  // Drag down until the bottom face faces the viewer, then hold before release.
  let end = 0;
  for (let y = 10; y < 800; y += 10) {
    c.drag(1, 0, y, y * 4);
    if (faceScores(c.orientation, camera)[0].id === 'education' && faceScores(c.orientation, camera)[0].score > 0.9) { end = y; break; }
  }
  assert.ok(end); c.endDrag(1, end * 4 + 1500); advance(c, 3);
  assert.equal(c.active, 'education');
});

test('selected face palette remains distinct and the specified identities are preserved', () => {
  assert.equal(faceById.projects.color, '#D9A85D');
  assert.equal(faceById.experience.color, '#54C4AC');
  assert.equal(faceById.contact.color, '#BA8FEC');
  assert.equal(new Set(faces.map((f) => f.color)).size, 4);
});

test('Home is an independent overview with no scored face and no idle navigation', () => {
  const c = controller(); let commits = 0; c.subscribe(() => commits++);
  assert.equal(c.activeFace, null);
  assert.equal(faceById.home, undefined);
  const q = restingOrientation('home');
  for (const face of faces) assert.ok(q.angleTo(restingOrientation(face.id)) > 0.1);
  for (let i = 0; i < 90 * 60; i++) {
    c.step(1 / 60);
    assert.equal(c.activeFace, null);
    assert.ok(faceScores(c.orientation, camera).every((score) => score.id !== 'home'));
  }
  assert.equal(commits, 0);
});

test('manual rotation from Home selects a real face once, including an initially absent hysteresis incumbent', () => {
  const c = controller(), commits = []; c.subscribe(() => commits.push(c.active));
  assert.ok(faces.some((face) => face.id === dominantFace(c.orientation, camera, null)));
  drag(c, 220, 60); c.endDrag(1, 33); advance(c, 5);
  assert.equal(commits.length, 1);
  assert.notEqual(c.active, 'home'); assert.equal(c.activeFace, c.active);
});

test('Home interrupts drag, inertia, settling and explicit alignment without stale pointer commits', () => {
  for (const phase of ['dragging', 'coasting', 'settling', 'aligning']) {
    const c = controller(); c.request('experience'); advance(c);
    if (phase === 'aligning') c.request('education');
    else {
      drag(c, 130, 20);
      if (phase !== 'dragging') c.endDrag(1, phase === 'settling' ? 1500 : 33);
      if (phase === 'settling') c.step(1 / 60);
    }
    assert.equal(c.phase, phase);
    const commits = []; c.subscribe(() => commits.push(c.active));
    c.request('home'); c.drag(1, 999, 999, 2000); c.endDrag(1, 2001);
    advance(c);
    assert.equal(c.active, 'home'); assert.equal(c.activeFace, null);
    assert.equal(c.phase, 'idle'); assert.deepEqual(commits, ['home']);
  }
});

test('Home works immediately without WebGL and with reduced motion', () => {
  for (const reduced of [false, true]) {
    const c = controller(); c.request('education'); advance(c);
    if (reduced) c.setReducedMotion(true); else c.setAvailable(false);
    c.request('home');
    assert.equal(c.active, 'home'); assert.equal(c.activeFace, null);
    assert.ok(c.orientation.angleTo(restingOrientation('home')) < 1e-7);
  }
});
