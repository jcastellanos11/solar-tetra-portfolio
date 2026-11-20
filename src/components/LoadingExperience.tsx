import { loadingCopy, loadingIcon } from '../loading/bootstrap';
import type { Language } from '../data/content';

export function LoadingExperience({ lang }: { lang: Language }) {
  const t = loadingCopy[lang];
  return <div className="solar-loading solar-loading--scene" role="status" aria-live="polite" aria-atomic="true">
    <div><span dangerouslySetInnerHTML={{ __html: loadingIcon }} /><strong>Solar Tetra</strong><p>{t.renderer}</p><small>{t.help}</small></div>
  </div>;
}
