import type { Object3D, Raycaster } from 'three';
import { Vector3 } from 'three/src/math/Vector3.js';
import type { FaceSection } from '../data/content';
import { faceById } from './faces.ts';

const normal = new Vector3();
const eye = new Vector3();

/** Transparent back surfaces never receive an activation through the object. */
export function pickFace(raycaster: Raycaster, meshes: Object3D[], cameraPosition: Vector3): FaceSection | null {
  for (const intersection of raycaster.intersectObjects(meshes, false)) {
    const id = intersection.object.userData.section as FaceSection;
    if (!Object.hasOwn(faceById, id)) continue;
    normal.copy(faceById[id].normal).transformDirection(intersection.object.matrixWorld);
    eye.copy(cameraPosition).sub(intersection.point).normalize();
    if (normal.dot(eye) > 0.08) return id;
  }
  return null;
}
