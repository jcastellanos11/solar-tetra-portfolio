import { Euler } from 'three/src/math/Euler.js';
import { Quaternion } from 'three/src/math/Quaternion.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import type { FaceSection, Section } from '../data/content.ts';
import { faces, faceById } from './faces.ts';

export const motion = {
  stableSeconds: 0.25, velocityThreshold: 0.12, dominanceMargin: 0.06,
  inertiaDamping: 5.5, alignmentDamping: 8, alignmentTolerance: 0.003,
  dragThreshold: 6, dragSensitivity: 0.008, maxVelocity: 8,
};
export function damping(rate: number, dt: number) { return 1 - Math.exp(-rate * dt); }

export function faceScores(orientation: Quaternion, cameraPosition: Vector3) {
  return faces.map((face) => {
    const normal = face.normal.clone().applyQuaternion(orientation);
    const point = face.centroid.clone().multiplyScalar(1.13).applyQuaternion(orientation);
    return { id: face.id, score: normal.dot(cameraPosition.clone().sub(point).normalize()) };
  }).sort((a, b) => b.score - a.score);
}

// Hysteresis includes deterministic ties: the committed face is preferred initially.
export function dominantFace(orientation: Quaternion, camera: Vector3, previous: FaceSection | null) {
  const scores = faceScores(orientation, camera);
  const incumbent = scores.find((s) => s.id === previous);
  return incumbent && scores[0].score - incumbent.score <= motion.dominanceMargin ? incumbent.id : scores[0].id;
}

// Home is the whole object, seen at an angle, independent of every face normal.
const homeOverview = new Quaternion().setFromEuler(new Euler(-0.45, 0.65, 0.06));
export function restingOrientation(id: Section, cameraOrientation = new Quaternion()) {
  return cameraOrientation.clone().multiply(id === 'home' ? homeOverview : faceById[id].orientation);
}

const idleEuler = new Euler();
export function idleOffset(time: number, strength: number, out: Quaternion) {
  return out.setFromEuler(idleEuler.set(
    Math.sin(time * 0.39) * 0.014 * strength,
    Math.sin(time * 0.31) * 0.018 * strength,
    Math.sin(time * 0.24) * 0.045 * strength,
  ));
}
