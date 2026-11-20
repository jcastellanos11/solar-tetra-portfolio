import { Matrix4 } from 'three/src/math/Matrix4.js';
import { Quaternion } from 'three/src/math/Quaternion.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import type { FaceSection } from '../data/content.ts';

const vertices = [
  new Vector3(0, 1.70, 0), new Vector3(-1.48, -0.78, 0.92),
  new Vector3(1.48, -0.78, 0.92), new Vector3(0, -0.78, -1.70),
];
const center = vertices.reduce((sum, v) => sum.add(v), new Vector3()).multiplyScalar(0.25);
export const tetraVertices = vertices.map((v) => v.sub(center));

function face(id: FaceSection, indices: number[], color: string, lightColor: string, mark: string) {
  const [a, b, c] = indices.map((i) => tetraVertices[i]);
  const centroid = a.clone().add(b).add(c).multiplyScalar(1 / 3);
  const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  if (normal.dot(centroid) < 0) throw new Error(`Inward face winding: ${id}`);
  const up = a.clone().sub(centroid).normalize();
  const right = up.clone().cross(normal).normalize();
  up.copy(normal).cross(right).normalize();
  const orientation = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(right, up, normal)).invert();
  return { id, indices, color, lightColor, mark, centroid, normal, orientation };
}

export const faces = [
  face('projects', [0, 1, 2], '#D9A85D', '#805719', '01'),
  face('experience', [0, 2, 3], '#54C4AC', '#216C5D', '02'),
  face('education', [1, 3, 2], '#82AEE8', '#345F93', '03'),
  face('contact', [0, 3, 1], '#BA8FEC', '#79529C', '04'),
];
export const faceById = Object.fromEntries(faces.map((f) => [f.id, f])) as Record<FaceSection, typeof faces[number]>;
export const homeAccent = { color: '#D6B98C', lightColor: '#795625', mark: '00' };
