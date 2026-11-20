import { academicRecords } from '../data/academic';
import { translations, type Language } from '../data/content';

export function EducationPanel({ lang }: { lang: Language }) {
  const t = translations[lang];
  const groups = ['degrees', 'academic', 'certificates', 'training'] as const;
  return <section className="content-pane content-pane--education" aria-labelledby="section-title">
    <p className="section-overline">{t.educationEyebrow}</p>
    <h1 id="section-title" tabIndex={-1}>{t.educationTitle}</h1>
    <p className="section-intro">{t.educationIntro}</p>
    {groups.map((group) => <section key={group} className="profile-block" aria-labelledby={`education-${group}`}>
      <h2 id={`education-${group}`}>{t.educationGroups[group]}</h2>
      <ul className="academic-records">
        {academicRecords.filter((record) => record.category === group).map((record) => <li key={record.id} data-credential={record.id} data-kind={record.kind}>
          <span className="credential-kind">{t.educationKinds[record.kind]}</span>
          <h3>{record.title}</h3>
          {record.institution && <p className="credential-institution">{record.institution}</p>}
          <p className="career-period"><time dateTime={record.start}>{record.start}</time>{record.end && <>–<time dateTime={record.end}>{record.end}</time></>}</p>
          <p>{t.educationDescriptions[record.id]}</p>
          {'website' in record && <a className="academic-external-link" href={record.website} target="_blank" rel="noopener noreferrer">{t.academicWebsiteLabel}<span className="sr-only"> — Grupo Linux Universidad Distrital (GLUD). {t.newTabLabel}</span><span aria-hidden="true"> ↗</span></a>}
        </li>)}
      </ul>
    </section>)}
  </section>;
}
