import type { CSSProperties } from 'react';
import { faces } from '../interaction/faces';
import type { FaceSection, Language, Section } from '../data/content';
import { translations } from '../data/content';

export type LabelElements = Partial<Record<FaceSection, HTMLButtonElement | null>>;
export function FaceLabels({ elements, lang, active, onSelect }: {
  elements: LabelElements; lang: Language; active: Section; onSelect: (id: Section) => void;
}) {
  return <div className="face-labels">
    {faces.map((face) => <button
      key={face.id}
      type="button"
      ref={(element) => { elements[face.id] = element; }}
      className="face-label" data-face={face.id}
      style={{ '--face-color': face.color, '--face-light-color': face.lightColor } as CSSProperties}
      aria-label={translations[lang].navigation[face.id]}
      aria-current={active === face.id ? 'page' : undefined}
      onClick={() => onSelect(face.id)}
    ><span className="face-mark" aria-hidden="true">{face.mark}</span>{translations[lang].navigationShort[face.id]}</button>)}
  </div>;
}
