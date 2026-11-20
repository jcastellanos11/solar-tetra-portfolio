import { useFrame, useThree, type RenderCallback } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import type { WebGLRenderer } from 'three';

export type SceneFailureHandler = (error: unknown) => void;

// Animation callbacks run outside React's error boundaries.
export function useSceneFrame(callback: RenderCallback, onFailure: SceneFailureHandler) {
  useFrame((state, delta, frame) => {
    try { callback(state, delta, frame); }
    catch (error) { onFailure(error); }
  });
}

export function installRendererSafety(renderer: WebGLRenderer, onFailure: SceneFailureHandler, onReady?: () => void) {
  const originalRender = renderer.render;
  const originalShaderError = renderer.debug.onShaderError;
  let failed = false, ready = false;
  const fail: SceneFailureHandler = (error) => { failed = true; onFailure(error); };
  const render: WebGLRenderer['render'] = function (scene, camera) {
    try {
      originalRender.call(renderer, scene, camera);
      if (!failed && !ready) { ready = true; onReady?.(); }
    }
    catch (error) { fail(error); }
  };
  const shaderError: NonNullable<WebGLRenderer['debug']['onShaderError']> = (gl, program, vertex, fragment) => {
    // Keep compiler diagnostics available instead of replacing Three's log with
    // a silent fallback callback. The application's reporter logs this error.
    const details = [gl.getProgramInfoLog(program), gl.getShaderInfoLog(vertex), gl.getShaderInfoLog(fragment)].filter(Boolean).join('\n');
    fail(new Error(`WebGL shader compilation/linking failed.\n${details}`));
    originalShaderError?.(gl, program, vertex, fragment);
  };
  renderer.render = render;
  renderer.debug.onShaderError = shaderError;
  return () => {
    if (renderer.render === render) renderer.render = originalRender;
    if (renderer.debug.onShaderError === shaderError) renderer.debug.onShaderError = originalShaderError;
  };
}

export function SceneRuntime({ onFailure, onReady }: { onFailure: SceneFailureHandler; onReady?: () => void }) {
  const renderer = useThree((state) => state.gl);
  useLayoutEffect(() => installRendererSafety(renderer, onFailure, onReady), [renderer, onFailure, onReady]);
  return null;
}
