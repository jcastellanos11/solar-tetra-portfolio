import { useRef } from 'react';
import { translations, type Language, type Section } from '../data/content';
import { HomePress } from '../interaction/accessories';

/** A perimeter control: never overlays the tetrahedron's draggable glass. */
export function HomeControl({ lang, active, onSelect }: { lang: Language; active: Section; onSelect: (section: Section) => void }) {
  const press = useRef(new HomePress());
  const t = translations[lang];
  return <button type="button" className="core-home-control" data-destination="home"
    aria-label={t.homeAction} aria-current={active === 'home' ? 'page' : undefined}
    onPointerDown={(event) => { event.stopPropagation(); press.current.down(event.pointerId, event.clientX, event.clientY); }}
    onPointerMove={(event) => press.current.move(event.pointerId, event.clientX, event.clientY)}
    onPointerUp={(event) => { event.stopPropagation(); press.current.move(event.pointerId, event.clientX, event.clientY); }}
    onPointerCancel={() => press.current.cancel()}
    onClick={(event) => { event.stopPropagation(); if (press.current.activate(event.detail === 0)) onSelect('home'); }}>
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></svg>
    {t.navigation.home}
  </button>;
}
