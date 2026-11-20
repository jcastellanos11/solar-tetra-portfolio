export class CvOrbit {
  angle = -0.55;
  readonly press = new HomePress();
  private pauses = new Set<string>();
  pause(reason: 'hover' | 'focus' | 'pointer', paused: boolean) {
    if (paused) this.pauses.add(reason); else this.pauses.delete(reason);
  }
  get paused() { return this.pauses.size > 0; }
  step(delta: number, reducedMotion: boolean, interacting = false) {
    if (!this.paused && !reducedMotion && !interacting) this.angle += Math.min(Math.max(delta, 0), 0.05) * 0.16;
  }
}

export function satellitePosition(width: number, height: number, angle: number) {
  // Reserve the top Home action and bottom face key. Compact layouts dock it.
  if (width < 450 || height < 420) return { x: width - 42, y: 90 };
  return {
    x: width * 0.5 + Math.cos(angle) * Math.max(0, width * 0.5 - 42),
    y: height * 0.46 + Math.sin(angle) * Math.max(0, height * 0.28 - 32),
  };
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
