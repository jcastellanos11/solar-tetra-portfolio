import type { RefObject } from 'react';
import { translations, type Language } from '../data/content';
import { cvCatalog, selectCv, type CvCatalog } from '../data/cv';
import { CvOrbit } from '../interaction/accessories';

export function CvDownload({ lang, catalog = cvCatalog }: { lang: Language; catalog?: CvCatalog }) {
  const cv = selectCv(lang, catalog), t = translations[lang];
  return cv ? <a className="button button--outline cv-download" href={cv.href} download={cv.file} hrefLang={cv.language} type="application/pdf">
    {t.cvLabel}<span className="cv-download-language">{t.cvLanguages[cv.language]} · PDF</span>
  </a> : null;
}

export function CvSatellite({ lang, orbit, element, catalog = cvCatalog }: {
  lang: Language; orbit: CvOrbit; element: RefObject<HTMLAnchorElement | null>; catalog?: CvCatalog;
}) {
  const cv = selectCv(lang, catalog), t = translations[lang];
  if (!cv) return null;
  return <a ref={element} className="cv-satellite" href={cv.href} download={cv.file} hrefLang={cv.language} type="application/pdf" draggable={false} aria-label={`${t.cvLabel} — ${t.cvLanguages[cv.language]} · PDF`}
    onPointerEnter={() => orbit.pause('hover', true)} onPointerLeave={() => orbit.pause('hover', false)}
    onFocus={() => orbit.pause('focus', true)} onBlur={() => orbit.pause('focus', false)}
    onPointerDown={(event) => {
      event.stopPropagation(); orbit.pause('pointer', true);
      orbit.press.down(event.pointerId, event.clientX, event.clientY);
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => { event.stopPropagation(); orbit.press.move(event.pointerId, event.clientX, event.clientY); }}
    onPointerUp={(event) => {
      event.stopPropagation(); orbit.press.move(event.pointerId, event.clientX, event.clientY); orbit.pause('pointer', false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onLostPointerCapture={() => orbit.pause('pointer', false)}
    onPointerCancel={(event) => { event.stopPropagation(); orbit.press.cancel(); orbit.pause('pointer', false); }}
    onClick={(event) => { event.stopPropagation(); if (!orbit.press.activate(event.detail === 0)) event.preventDefault(); }}>
    <span className="satellite-glass"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 12h6m-6 4h6"/></svg></span>
    <span className="satellite-language" aria-hidden="true">{cv.language.toUpperCase()}</span>
    <span className="satellite-label" aria-hidden="true">{t.cvLabel}<small>{t.cvLanguages[cv.language]} · PDF</small></span>
  </a>;
}
