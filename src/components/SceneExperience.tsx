import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import type { TetraScene } from './TetraScene';
import { SceneBoundary } from './SceneBoundary';
import { StaticTetra } from './StaticTetra';
import { LoadingExperience } from './LoadingExperience';
import { translations } from '../data/content';
import { rendererPending, startupMark, watchRenderer } from '../loading/readiness';

type RendererProps = Parameters<typeof TetraScene>[0];
const DeferredScene = lazy(() => {
  startupMark('renderer-requested');
  return import('./TetraScene').then((module) => {
    startupMark('renderer-module-ready');
    return { default: module.TetraScene };
  });
});

// Readiness is local to the visual region, independent of section commits.
export function SceneExperience({ webgl, Renderer = DeferredScene, loading, fallback, ...props }: Omit<RendererProps, 'onReady'> & {
  webgl: boolean | null; Renderer?: ComponentType<RendererProps>; loading?: ReactNode; fallback?: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const failure = useRef(false);
  const onReady = useCallback(() => {
    if (failure.current) return;
    startupMark('first-frame');
    setReady(true);
  }, []);
  const { onFailure } = props;
  const fail = useCallback((error: unknown) => {
    if (failure.current) return;
    failure.current = true;
    startupMark('static-fallback');
    setFailed(true);
    onFailure(error);
  }, [onFailure]);
  const pending = rendererPending(failed ? false : webgl, ready);
  useEffect(() => {
    if (webgl === false) startupMark('static-fallback');
    if (!pending) return;
    let stop = () => {};
    const watchVisible = () => {
      stop();
      // Browsers suspend RAF in background tabs. That is not a renderer failure.
      if (!document.hidden) stop = watchRenderer(fail);
    };
    watchVisible();
    document.addEventListener('visibilitychange', watchVisible);
    return () => { stop(); document.removeEventListener('visibilitychange', watchVisible); };
  }, [pending, webgl, fail]);
  const staticView = fallback ?? <StaticTetra label={translations[props.lang].staticLabel} />;
  return <div className="visual-scene" data-ready={ready} data-renderer-state={failed || webgl === false ? 'fallback' : ready ? 'ready' : 'loading'}>
    {webgl && !failed ? <SceneBoundary onFailure={fail} fallback={staticView}><Suspense fallback={null}><Renderer {...props} onFailure={fail} onReady={onReady} /></Suspense></SceneBoundary> : staticView}
    {pending && (loading ?? <LoadingExperience lang={props.lang} />)}
  </div>;
}
