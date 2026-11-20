export const satelliteMotion = { desktopSpeed: 0.16, compactSpeed: 0.20, targetRadius: 24, clearance: 12, sideInset: 40, rightInset: 64, inclination: 0.12, minimumRadius: 8 };
export type OrbitLimits = { top: number; bottom: number; labelTop: number; labelBottom: number };
export type OrbitPoint = { x: number; y: number };

export class CvOrbit {
  angle = -0.55;
  readonly press = new HomePress();
  private pauses = new Set<string>();
  pause(reason: 'hover' | 'focus' | 'pointer', paused: boolean) {
    if (paused) this.pauses.add(reason); else this.pauses.delete(reason);
  }
  get paused() { return this.pauses.size > 0; }
  step(delta: number, reducedMotion: boolean, interacting = false, speed = satelliteMotion.desktopSpeed) {
    if (!this.paused && !reducedMotion && !interacting) this.angle += Math.min(Math.max(delta, 0), 0.05) * speed;
  }
}

export function satellitePosition(width: number, height: number, angle: number, limits?: OrbitLimits | null) {
  const left = Math.min(satelliteMotion.sideInset, width / 2);
  const right = Math.max(left, width - satelliteMotion.rightInset);
  const top = Math.max(36, limits?.top ?? Math.min(124, height * 0.3));
  const bottom = Math.min(height - 36, limits?.bottom ?? height - 160);
  const rx = (right - left) / 2, ry = (bottom - top) / 2;
  const usable = rx >= satelliteMotion.minimumRadius && ry >= satelliteMotion.minimumRadius;
  const centerY = Math.max(24, Math.min(height - 24, (top + bottom) / 2));
  return {
    x: usable ? (left + right) / 2 + Math.cos(angle) * rx : Math.max(24, Math.min(width - 24, right)),
    y: usable ? centerY + (Math.sin(angle) + satelliteMotion.inclination * Math.cos(angle)) / (1 + satelliteMotion.inclination) * ry : centerY,
  };
}

// Move HTML labels inward when necessary; the orbital path never chases moving labels.
export function clearSatelliteLabel(point: OrbitPoint, width: number, height: number, sceneWidth: number, top: number, bottom: number, satellite?: OrbitPoint | null): OrbitPoint | null {
  const clamp = (x: number, y: number) => ({ x: Math.max(width / 2 + 8, Math.min(sceneWidth - width / 2 - 8, x)), y: Math.max(top, Math.min(bottom, y)) });
  const initial = clamp(point.x, point.y);
  if (!satellite) return initial;
  const dx = width / 2 + satelliteMotion.targetRadius + satelliteMotion.clearance;
  const dy = height / 2 + satelliteMotion.targetRadius + satelliteMotion.clearance;
  const candidates = [initial, clamp(initial.x, satellite.y - dy), clamp(initial.x, satellite.y + dy), clamp(satellite.x - dx, initial.y), clamp(satellite.x + dx, initial.y)];
  return candidates.find((p) => Math.abs(p.x - satellite.x) >= dx - 0.01 || Math.abs(p.y - satellite.y) >= dy - 0.01) ?? null;
}

export class HomePress {
  private pointer: { id: number; x: number; y: number } | null = null;
  moved = false;
  down(id: number, x: number, y: number) { this.pointer = { id, x, y }; this.moved = false; }
  move(id: number, x: number, y: number) {
    if (this.pointer?.id === id) this.moved ||= Math.hypot(x - this.pointer.x, y - this.pointer.y) > 6;
  }
  cancel() { this.moved = true; this.pointer = null; }
  activate(keyboard: boolean) { return keyboard || !this.moved; }
}
