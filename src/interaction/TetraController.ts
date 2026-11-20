import { Quaternion } from 'three/src/math/Quaternion.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import type { FaceSection, Section } from '../data/content.ts';
import { ambientMotion, damping, dominantFace, idleOffset, motion, restingOrientation } from './rotation.ts';

export type Phase = 'idle' | 'dragging' | 'coasting' | 'settling' | 'aligning';
type Pointer = { id: number; x: number; y: number; startX: number; startY: number; time: number; moved: boolean; downFace: FaceSection };

/** Imperative animation store. Subscribers are notified only on section commits. */
export class TetraController {
  active: Section = 'home';
  requested: Section = 'home';
  phase: Phase = 'idle';
  revision = 0;
  reducedMotion = false;
  available = false;
  readonly orientation = restingOrientation('home');
  private readonly base = this.orientation.clone();
  private readonly target = this.orientation.clone();
  private readonly camera = new Vector3(0, 0, 7.7);
  private readonly cameraQ = new Quaternion();
  private readonly cameraInverse = new Quaternion();
  private readonly offset = new Quaternion();
  private readonly deltaQ = new Quaternion();
  private readonly axis = new Vector3();
  private readonly velocity = new Vector3();
  private pointer: Pointer | null = null;
  private candidate: FaceSection | null = null;
  private stableTime = 0;
  private elapsed = 0;
  private idleStrength = 0;
  private listeners = new Set<() => void>();
  private activityListeners = new Set<() => void>();

  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.active;
  get activeFace(): FaceSection | null { return this.active === 'home' ? null : this.active; }
  subscribeActivity = (listener: () => void) => { this.activityListeners.add(listener); return () => { this.activityListeners.delete(listener); }; };
  private activityChanged() { for (const listener of this.activityListeners) listener(); }

  setCamera(position: Vector3, orientation: Quaternion) {
    if (this.camera.distanceToSquared(position) < 1e-10 && this.cameraQ.angleTo(orientation) < 1e-6) return;
    this.camera.copy(position); this.cameraQ.copy(orientation); this.cameraInverse.copy(orientation).invert();
    if (this.phase === 'idle' || this.phase === 'aligning') this.request(this.requested);
  }

  setAvailable(available: boolean) {
    this.available = available;
    if (!available) {
      this.pointer = null; this.velocity.set(0, 0, 0); this.revision++;
      this.finish(this.requested);
    }
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    if (reduced) {
      this.velocity.set(0, 0, 0); this.idleStrength = 0;
      if (this.phase === 'aligning') this.finish(this.requested);
      if (this.phase === 'idle') this.orientation.copy(this.base);
    }
  }

  request(id: Section) {
    this.revision++; this.pointer = null; this.requested = id;
    this.base.copy(this.orientation); this.idleStrength = 0;
    this.velocity.set(0, 0, 0); this.stableTime = 0;
    this.candidate = null;
    this.target.copy(restingOrientation(id, this.cameraQ));
    this.phase = 'aligning';
    this.activityChanged();
    if (!this.available || this.reducedMotion) this.finish(id);
  }

  beginDrag(id: number, x: number, y: number, time: number, downFace: FaceSection) {
    if (this.pointer) return false;
    this.revision++; this.base.copy(this.orientation); this.idleStrength = 0;
    this.requested = this.active; this.velocity.set(0, 0, 0); this.stableTime = 0;
    this.pointer = { id, x, y, startX: x, startY: y, time, moved: false, downFace };
    this.phase = 'dragging';
    this.activityChanged();
    return true;
  }

  drag(id: number, x: number, y: number, time: number) {
    const p = this.pointer;
    if (!p || p.id !== id) return;
    const dx = x - p.x, dy = y - p.y;
    p.moved ||= Math.hypot(x - p.startX, y - p.startY) > motion.dragThreshold;
    if (p.moved) {
      this.axis.set(dy, dx, 0).applyQuaternion(this.cameraQ);
      const distance = this.axis.length();
      if (distance > 0) {
        this.axis.divideScalar(distance);
        const angle = distance * motion.dragSensitivity;
        this.deltaQ.setFromAxisAngle(this.axis, angle);
        this.base.premultiply(this.deltaQ).normalize();
        this.orientation.copy(this.base);
        const speed = Math.min(motion.maxVelocity, angle / Math.max(0.008, (time - p.time) / 1000));
        this.velocity.lerp(this.axis.multiplyScalar(speed), 0.65);
      } else this.velocity.multiplyScalar(Math.exp(-Math.max(0, time - p.time) / 100));
    }
    p.x = x; p.y = y; p.time = time;
  }

  endDrag(id: number, time: number) {
    const p = this.pointer;
    if (!p || p.id !== id) return;
    this.pointer = null;
    if (!p.moved) { this.request(p.downFace); return; }
    // Holding still before release must not replay an old fling.
    this.velocity.multiplyScalar(Math.exp(-Math.max(0, time - p.time) / 100));
    if (this.reducedMotion) this.velocity.set(0, 0, 0);
    this.candidate = this.activeFace; this.stableTime = 0; this.phase = 'coasting';
    this.activityChanged();
  }

  cancelDrag(id?: number) {
    if (!this.pointer || (id !== undefined && this.pointer.id !== id)) return;
    this.request(this.active);
  }

  step(rawDelta: number) {
    const dt = Math.min(Math.max(rawDelta, 0), 0.05);
    this.elapsed += dt;
    if (this.phase === 'dragging') return;
    if (this.phase === 'coasting' || this.phase === 'settling') {
      const speed = this.velocity.length();
      if (speed > 0) {
        // Integrate exponential decay exactly; frame rate does not alter travel.
        const travel = speed * damping(motion.inertiaDamping, dt) / motion.inertiaDamping;
        this.deltaQ.setFromAxisAngle(this.axis.copy(this.velocity).divideScalar(speed), travel);
        this.base.premultiply(this.deltaQ).normalize();
        this.velocity.multiplyScalar(Math.exp(-motion.inertiaDamping * dt));
      }
      this.orientation.copy(this.base);
      if (this.velocity.length() >= motion.velocityThreshold) { this.stableTime = 0; return; }
      if (this.phase !== 'settling') { this.phase = 'settling'; this.activityChanged(); }
      const next = dominantFace(this.base, this.camera, this.candidate);
      if (next !== this.candidate) { this.candidate = next; this.stableTime = 0; }
      this.stableTime += dt;
      if (this.stableTime >= motion.stableSeconds) this.request(next);
      return;
    }
    if (this.phase === 'aligning') {
      this.base.slerp(this.target, damping(motion.alignmentDamping, dt));
      this.orientation.copy(this.base);
      if (this.base.angleTo(this.target) < motion.alignmentTolerance) this.finish(this.requested);
      return;
    }
    if (!this.reducedMotion) {
      this.idleStrength += (1 - this.idleStrength) * damping(ambientMotion.resumeDamping, dt);
      idleOffset(this.elapsed, this.idleStrength, this.offset, this.active === 'home');
      this.deltaQ.copy(this.cameraQ).multiply(this.offset).multiply(this.cameraInverse);
      this.orientation.copy(this.base).premultiply(this.deltaQ);
    } else this.orientation.copy(this.base);
  }

  private finish(id: Section) {
    this.target.copy(restingOrientation(id, this.cameraQ));
    this.base.copy(this.target); this.orientation.copy(this.base);
    this.requested = id; this.phase = 'idle'; this.stableTime = 0; this.idleStrength = 0;
    const changed = this.active !== id;
    this.active = id;
    this.activityChanged();
    if (!changed) return;
    for (const listener of this.listeners) listener();
  }
}
