export const rendererDeadlineMs = 30_000;

export function startupMark(name: string) {
  // User Timing separates module transfer/evaluation from scene initialization in DevTools.
  if (typeof performance !== 'undefined' && performance.mark && !performance.getEntriesByName(`solar:${name}`).length) performance.mark(`solar:${name}`);
}

export function rendererPending(webgl: boolean | null, ready: boolean) {
  return webgl !== false && !ready;
}

export function watchRenderer(onFailure: (error: Error) => void, schedule = setTimeout, cancel = clearTimeout) {
  let cancelled = false;
  const timer = schedule(() => {
    if (!cancelled) onFailure(new Error('3D scene did not produce a frame within 30 seconds.'));
  }, rendererDeadlineMs);
  return () => { cancelled = true; cancel(timer); };
}

export function sceneDpr(coarsePointer: boolean): [number, number] {
  // Keep antialiasing and every material; reduce fill rate on high-DPR touch devices.
  return [1, coarsePointer ? 1.25 : 1.5];
}
