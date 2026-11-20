import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { FaceSection, Language, Section } from '../data/content';
import { translations } from '../data/content';
import { selectCv } from '../data/cv';
import { faces, faceById, homeAccent, tetraVertices } from '../interaction/faces';
import { TetraController } from '../interaction/TetraController';
import { pickFace } from '../interaction/picking';
import { FaceLabels, type LabelElements } from './FaceLabels';
import { CvSatellite } from './CvSatellite';
import { CvOrbit, satellitePosition, clearSatelliteLabel, satelliteMotion, type OrbitLimits, type OrbitPoint } from '../interaction/accessories';
import { SceneRuntime, useSceneFrame, type SceneFailureHandler } from './SceneRuntime';
import { sceneDpr, startupMark } from '../loading/readiness';

function makeFace(indices: number[]) {
  const points = indices.flatMap((i) => tetraVertices[i].toArray());
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('barycentric', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3));
  geometry.computeVertexNormals();
  return geometry;
}

const glassVertex = /* glsl */ `
  attribute vec3 barycentric;
  varying vec3 vBary;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vBary = barycentric;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const glassFragment = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  uniform float uSelected;
  uniform float uDaylight;
  uniform vec3 uTint;
  uniform vec3 uAccent;
  varying vec3 vBary;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vec3 eye = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), eye)), 2.0);
    float nearEdge = min(vBary.x, min(vBary.y, vBary.z));
    float softEdge = 1.0 - smoothstep(0.0, 0.10, nearEdge);
    float solar = 1.0 - smoothstep(0.20, 2.1, length(vWorldPos - vec3(0.0, 0.06, 0.0)));
    float shimmer = 0.5 + 0.5 * sin(vWorldPos.y * 4.2 + uTime * 0.6);
    vec3 smoke = mix(vec3(0.16, 0.29, 0.33), vec3(0.30, 0.39, 0.42), fresnel);
    vec3 amber = vec3(1.0, 0.54, 0.21);
    vec3 color = mix(smoke, uTint * 0.62, 0.40) + amber * solar * (0.12 + 0.08 * shimmer);
    color = mix(color, uTint, uHover * 0.34);
    color += uAccent * uSelected * 0.20;
    color = mix(color, uTint * 0.58, uDaylight * 0.20);
    float alpha = 0.10 + fresnel * 0.17 + solar * 0.10 + softEdge * 0.095;
    alpha += uHover * (0.11 + softEdge * 0.12) + uSelected * 0.035;
    alpha += uDaylight * 0.10;
    gl_FragColor = vec4(color, min(0.76, alpha));
  }
`;

const sunVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const sunFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    float swirl = sin(vPos.x * 19.0 + sin(vPos.y * 12.0 + uTime * 1.6) * 1.5);
    swirl += sin(vPos.z * 26.0 + uTime * 0.9) * 0.65;
    float latitude = sin((vPos.x + vPos.y + vPos.z) * 16.0 - uTime * 1.2);
    float energy = smoothstep(-1.3, 1.6, swirl + latitude * 0.35);
    vec3 low = vec3(0.93, 0.29, 0.045);
    vec3 high = vec3(1.0, 0.79, 0.36);
    vec3 color = mix(low, high, energy);
    color += pow(abs(vNormal.z), 3.0) * 0.07;
    gl_FragColor = vec4(color, 1.0);
  }
`;

function makeHaloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const grad = ctx.createRadialGradient(128, 128, 1, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,210,125,.78)');
  grad.addColorStop(0.11, 'rgba(255,165,73,.52)');
  grad.addColorStop(0.42, 'rgba(255,119,44,.16)');
  grad.addColorStop(1, 'rgba(255,110,55,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function SolarCore({ reducedMotion, onFailure }: { reducedMotion: boolean; onFailure: SceneFailureHandler }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const sunShader = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: sunFragment,
    uniforms: { uTime: { value: 0 } },
  }), []);
  const haloTexture = useMemo(makeHaloTexture, []);
  useEffect(() => () => { sunShader.dispose(); haloTexture.dispose(); }, [sunShader, haloTexture]);
  useSceneFrame(({ clock }, delta) => {
    if (!reducedMotion) sunShader.uniforms.uTime.value = clock.elapsedTime;
    if (coreRef.current && !reducedMotion) {
      coreRef.current.rotation.y += delta * 0.13;
      const pulse = 1 + 0.026 * Math.sin(clock.elapsedTime * 1.2);
      coreRef.current.scale.setScalar(pulse);
    }
  }, onFailure);
  return (
    <group position={[0, 0.06, 0]}>
      <sprite scale={[2.7, 2.7, 1]}>
        <spriteMaterial map={haloTexture} transparent opacity={0.82} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <mesh ref={coreRef} material={sunShader}>
        <sphereGeometry args={[0.35, 40, 28]} />
      </mesh>
      <mesh scale={1.19}>
        <sphereGeometry args={[0.35, 32, 24]} />
        <meshBasicMaterial color="#ffad59" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

interface GlassFaceProps {
  id: FaceSection;
  controller: TetraController;
  hovered: { current: FaceSection | null };
  daylight: boolean;
  reducedMotion: boolean;
  meshes: Map<FaceSection, THREE.Mesh>;
  onFailure: SceneFailureHandler;
}
function GlassFace({ id, controller, hovered, daylight, reducedMotion, meshes, onFailure }: GlassFaceProps) {
  const geometry = useMemo(() => makeFace(faceById[id].indices), [id]);
  const shader = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: glassVertex, fragmentShader: glassFragment,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 }, uHover: { value: 0 }, uSelected: { value: 0 }, uDaylight: { value: 0 },
      uTint: { value: new THREE.Color(faceById[id].color) },
      uAccent: { value: new THREE.Color(controller.active === 'home' ? homeAccent.color : faceById[controller.active].color) },
    },
  }), [id, controller]);
  const accent = useMemo(() => new THREE.Color(), []);
  useEffect(() => () => { shader.dispose(); geometry.dispose(); }, [shader, geometry]);
  useSceneFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const u = shader.uniforms;
    if (!reducedMotion) u.uTime.value = clock.elapsedTime;
    const blend = reducedMotion ? 1 : 1 - Math.exp(-6 * dt);
    u.uHover.value = THREE.MathUtils.lerp(u.uHover.value, hovered.current === id ? 1 : 0, blend);
    u.uSelected.value = THREE.MathUtils.lerp(u.uSelected.value, controller.activeFace === id ? 1 : 0, blend);
    u.uDaylight.value = THREE.MathUtils.lerp(u.uDaylight.value, daylight ? 1 : 0, blend);
    u.uAccent.value.lerp(accent.set(controller.active === 'home' ? homeAccent.color : faceById[controller.active].color), blend);
  }, onFailure);
  return <mesh ref={(mesh) => { if (mesh) meshes.set(id, mesh); else meshes.delete(id); }} geometry={geometry} material={shader} userData={{ section: id }} />;
}

export function InteractiveTetra({ controller, daylight, reducedMotion, labels, onFailure, satellitePoint, orbitLimits }: {
  controller: TetraController; daylight: boolean; reducedMotion: boolean;
  labels: LabelElements; onFailure: SceneFailureHandler; satellitePoint?: RefObject<OrbitPoint | null>; orbitLimits?: RefObject<OrbitLimits | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const hovered = useRef<FaceSection | null>(null);
  const meshes = useMemo(() => new Map<FaceSection, THREE.Mesh>(), []);
  const { gl, camera, size } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const world = useMemo(() => new THREE.Vector3(), []);
  const eye = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    // The controller uses Three's source math classes; R3F objects use its bundle.
    // Copy structurally compatible components into the existing, read-only slot.
    group.current?.quaternion.copy(controller.orientation);
  }, [controller]);

  useEffect(() => {
    const canvas = gl.domElement;
    controller.setAvailable(true);
    const hit = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      camera.updateMatrixWorld(); group.current?.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      return pickFace(raycaster, [...meshes.values()], camera.position);
    };
    const down = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return;
      const face = hit(e);
      if (face && controller.beginDrag(e.pointerId, e.clientX, e.clientY, e.timeStamp, face)) {
        canvas.setPointerCapture(e.pointerId); hovered.current = null;
        canvas.style.cursor = 'grabbing';
      }
    };
    const move = (e: PointerEvent) => {
      controller.drag(e.pointerId, e.clientX, e.clientY, e.timeStamp);
      if (controller.phase === 'dragging') return;
      hovered.current = e.pointerType === 'touch' ? null : hit(e);
      canvas.style.cursor = hovered.current ? 'grab' : '';
    };
    const up = (e: PointerEvent) => {
      controller.endDrag(e.pointerId, e.timeStamp);
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = ''; hovered.current = null;
    };
    const cancel = (e: PointerEvent) => { controller.cancelDrag(e.pointerId); canvas.style.cursor = ''; hovered.current = null; };
    const leave = () => { hovered.current = null; };
    const blur = () => { controller.cancelDrag(); hovered.current = null; canvas.style.cursor = ''; };
    const visibility = () => { if (document.hidden) blur(); };
    const lost = (e: Event) => { e.preventDefault(); controller.setAvailable(false); onFailure(new Error('WebGL context was lost.')); };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', cancel);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('webglcontextlost', lost);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', cancel);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('webglcontextlost', lost);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
      canvas.style.cursor = ''; controller.setAvailable(false);
    };
  }, [gl, camera, controller, meshes, normal, eye, raycaster, pointer, onFailure]);

  useSceneFrame((_state, delta) => {
    if (!group.current) return;
    controller.setCamera(camera.position, camera.quaternion);
    controller.step(delta);
    group.current.quaternion.copy(controller.orientation);
    group.current.updateMatrixWorld(true);
    const occupied: { x: number; y: number; width: number }[] = [];
    // Selected and hovered labels get first choice of space.
    const ordered = [...faces].sort((a, b) => Number(b.id === controller.active) - Number(a.id === controller.active) || Number(b.id === hovered.current) - Number(a.id === hovered.current));
    for (const face of ordered) {
      const element = labels[face.id];
      if (!element) continue;
      world.copy(face.centroid).applyMatrix4(group.current.matrixWorld);
      normal.copy(face.normal).transformDirection(group.current.matrixWorld);
      eye.copy(camera.position).sub(world).normalize();
      projected.copy(face.centroid).lerp(tetraVertices[face.indices[0]], 0.5).applyMatrix4(group.current.matrixWorld).project(camera);
      let x = (projected.x * 0.5 + 0.5) * size.width;
      let y = (-projected.y * 0.5 + 0.5) * size.height;
      const width = element.offsetWidth || 110;
      const height = element.offsetHeight || 44;
      const safe = clearSatelliteLabel({ x, y }, width, height, size.width, orbitLimits?.current?.labelTop ?? 40, orbitLimits?.current?.labelBottom ?? size.height - 90, satellitePoint?.current);
      if (safe) { x = safe.x; y = safe.y; }
      const visible = projected.z > -1 && projected.z < 1 && normal.dot(eye) > 0.12;
      const moving = controller.phase !== 'idle';
      const important = face.id === controller.active || face.id === hovered.current || element === document.activeElement;
      const discoverable = controller.active === 'home' || face.id === controller.active;
      const collision = occupied.some((p) => Math.abs(x - p.x) < (width + p.width) / 2 + 12 && Math.abs(y - p.y) < 46);
      const show = Boolean(safe) && visible && (!moving || element === document.activeElement) && (important || discoverable) && !collision && x > width / 2 + 8 && x < size.width - width / 2 - 8 && y > 35 && y < size.height - 90;
      // Do not strand focus if a previously visible label becomes occluded.
      const focused = element === document.activeElement;
      element.style.visibility = show || focused ? 'visible' : 'hidden';
      element.style.opacity = show || focused ? '1' : '0';
      element.style.transform = `translate(${Math.max(width / 2 + 8, Math.min(size.width - width / 2 - 8, x))}px, ${Math.max(40, Math.min(size.height - 90, y))}px) translate(-50%, -50%)`;
      element.dataset.active = String(face.id === controller.active);
      element.dataset.hovered = String(face.id === hovered.current);
      if (show) occupied.push({ x, y, width });
    }
  }, onFailure);

  return <group ref={group} scale={1.13}>
    <SolarCore reducedMotion={reducedMotion} onFailure={onFailure} />
    {faces.map(({ id }) => <GlassFace key={id} id={id} controller={controller} hovered={hovered} daylight={daylight} reducedMotion={reducedMotion} meshes={meshes} onFailure={onFailure} />)}
  </group>;
}

export function SatelliteMotion({ orbit, element, controller, reducedMotion, enabled, onFailure, satellitePoint, orbitLimits }: {
  orbit: CvOrbit; element: RefObject<HTMLAnchorElement | null>; controller: TetraController;
  reducedMotion: boolean; enabled: boolean; onFailure: SceneFailureHandler; satellitePoint?: RefObject<OrbitPoint | null>; orbitLimits?: RefObject<OrbitLimits | null>;
}) {
  const { size } = useThree();
  useSceneFrame((_state, delta) => {
    if (!enabled || !element.current) return;
    orbit.step(delta, reducedMotion, controller.phase !== 'idle', size.width < 450 ? satelliteMotion.compactSpeed : satelliteMotion.desktopSpeed);
    const point = satellitePosition(size.width, size.height, orbit.angle, orbitLimits?.current);
    if (satellitePoint) satellitePoint.current = point;
    element.current.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
    element.current.style.visibility = 'visible';
    element.current.dataset.labelSide = point.x < size.width / 2 ? 'right' : 'left';
  }, onFailure);
  return null;
}

export function TetraScene({ controller, selected, onSelect, daylight, reducedMotion, lang, onFailure, onReady }: {
  controller: TetraController; selected: Section; onSelect: (value: Section) => void;
  daylight: boolean; reducedMotion: boolean; lang: Language; onFailure: SceneFailureHandler; onReady: () => void;
}) {
  const labels = useRef<LabelElements>({});
  const satellite = useRef<HTMLAnchorElement>(null);
  const orbit = useMemo(() => new CvOrbit(), []);
  const satellitePoint = useRef<OrbitPoint | null>(null);
  const orbitLimits = useRef<OrbitLimits | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const region = stage.current?.closest<HTMLElement>('.visual-pane');
    if (!region) return;
    const home = region.querySelector<HTMLElement>('.core-home-control');
    const navigation = region.querySelector<HTMLElement>('.face-key');
    const measure = () => {
      const rect = region.getBoundingClientRect();
      const homeBottom = home ? home.getBoundingClientRect().bottom - rect.top : 88;
      const navTop = navigation ? navigation.getBoundingClientRect().top - rect.top : rect.height - 120;
      orbitLimits.current = { top: homeBottom + 36, bottom: navTop - 36, labelTop: homeBottom + 30, labelBottom: navTop - 30 };
    };
    measure();
    const observer = new ResizeObserver(measure);
    [region, home, navigation].forEach((node) => { if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [lang]);
  const dpr = useMemo(() => sceneDpr(window.matchMedia('(pointer: coarse)').matches), []);
  return <div ref={stage} className="tetra-stage">
    <Canvas camera={{ position: [0, 0, 7.7], fov: 40, near: 0.1, far: 50 }}
      dpr={dpr} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      onCreated={() => startupMark('renderer-created')}
      className="lab-canvas" aria-label={translations[lang].sceneLabel}
    >
      <SceneRuntime onFailure={onFailure} onReady={onReady} />
      <SatelliteMotion orbit={orbit} element={satellite} controller={controller} reducedMotion={reducedMotion} enabled={Boolean(selectCv(lang))} onFailure={onFailure} satellitePoint={satellitePoint} orbitLimits={orbitLimits} />
      <InteractiveTetra controller={controller} daylight={daylight} reducedMotion={reducedMotion} labels={labels.current} onFailure={onFailure} satellitePoint={satellitePoint} orbitLimits={orbitLimits} />
    </Canvas>
    <FaceLabels elements={labels.current} lang={lang} active={selected} onSelect={onSelect} />
    <CvSatellite lang={lang} orbit={orbit} element={satellite} />
  </div>;
}
