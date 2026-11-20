import test from 'node:test';
import assert from 'node:assert/strict';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Vector2 } from 'three';
import { faces, tetraVertices } from '../src/interaction/faces.ts';
import { restingOrientation } from '../src/interaction/rotation.ts';
import { pickFace } from '../src/interaction/picking.ts';

test('raycasting selects the front face for all four resting orientations despite double-sided transparent glass', () => {
  const group = new Group(); group.scale.setScalar(1.13);
  const material = new MeshBasicMaterial({ side: DoubleSide, transparent: true, opacity: 0.15 });
  const meshes = faces.map((face) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(face.indices.flatMap((i) => tetraVertices[i].toArray()), 3));
    const mesh = new Mesh(geometry, material); mesh.userData.section = face.id; group.add(mesh); return mesh;
  });
  const camera = new PerspectiveCamera(40, 1, 0.1, 50); camera.position.set(0, 0, 7.7); camera.updateMatrixWorld();
  const raycaster = new Raycaster();
  try {
    for (const face of faces) {
      group.quaternion.copy(restingOrientation(face.id)); group.updateMatrixWorld(true);
      raycaster.setFromCamera(new Vector2(0, 0), camera);
      assert.ok(raycaster.intersectObjects(meshes).length >= 2, 'both front and back glass intersect');
      assert.equal(pickFace(raycaster, meshes, camera.position), face.id);
    }
    raycaster.setFromCamera(new Vector2(0.95, 0.95), camera);
    assert.equal(pickFace(raycaster, meshes, camera.position), null);
  } finally { meshes.forEach((mesh) => mesh.geometry.dispose()); material.dispose(); }
});

test('non-face objects such as Home and CV accessories are never selected', () => {
  const raycaster = { intersectObjects: () => [{ object: { userData: { section: 'home' } } }, { object: { userData: { section: 'cv' } } }] };
  assert.equal(pickFace(raycaster, [], { x: 0, y: 0, z: 7.7 }), null);
});
