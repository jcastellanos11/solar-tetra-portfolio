import type { Language } from '../data/content';
import { technologies, technologyCategories, technologyCopy } from '../data/technologies';

export function TechnologyStack({ lang }: { lang: Language }) {
  const t = technologyCopy[lang];
  return <section className="profile-block technology-stack" aria-labelledby="technology-title">
    <h2 id="technology-title">{t.title}</h2>
    <p className="technology-intro">{t.intro}</p>
    <div className="technology-groups">
      {technologyCategories.map((category, index) => <section key={category} className="technology-group" aria-labelledby={`technology-${category}`}>
        <h3 id={`technology-${category}`}><span aria-hidden="true">0{index + 1}</span>{t.categories[category]}</h3>
        <p>{t.descriptions[category]}</p>
        <ul aria-label={`${t.listLabel}: ${t.categories[category]}`}>
          {technologies.filter((item) => item.category === category).map((item) => <li key={item.id} data-technology={item.id} data-scope={item.scope}>
            {item.name ?? t.practices[item.term]}{item.scope === 'projects' && <><span className="technology-marker" aria-hidden="true"> *</span><span className="sr-only"> — {t.projectLabel}</span></>}
          </li>)}
        </ul>
      </section>)}
    </div>
    <p className="technology-legend">{t.projectLegend}</p>
  </section>;
}
