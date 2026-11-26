import { projects, projectCopy } from '../data/projects';
import { translations, type Language } from '../data/content';

export function ProjectsPanel({ lang }: { lang: Language }) {
  const t = translations[lang];
  return <section className="content-pane" aria-labelledby="section-title">
    <p className="section-overline">{t.projectEyebrow}</p>
    <h1 id="section-title" tabIndex={-1}>{t.projectTitle}</h1>
    <p className="section-intro">{t.projectIntro}</p>
    <div className="projects-list">
      {projects.map((project, index) => {
        const copy = projectCopy[lang][project.id];
        return <article className="feature-card" data-project={project.id} key={project.id} aria-labelledby={`project-${project.id}`}>
          <div className="card-topline"><span className="card-serial">{String(index + 1).padStart(3, '0')} / {t.projectCardLabel}</span>{project.developmentStatus === 'in-development' && <span className="status-dot">{t.projectStatus}</span>}</div>
          <img className="project-screenshot" src={`${project.image.base}-600.jpg`} srcSet={`${project.image.base}-600.jpg 600w, ${project.image.base}-1200.jpg 1200w`} sizes="(max-width: 600px) 90vw, 540px" width={project.image.width} height={project.image.height} alt={copy.imageAlt} loading="lazy" decoding="async" />
          <div className="feature-info">
            <h2 id={`project-${project.id}`}>{project.name}</h2>
            <p className="project-category">{copy.category}</p>
            <p>{copy.description}</p>
            <div className="stack-list" role="list" aria-label={t.technologiesLabel}>{project.technologies.map((technology) => <span role="listitem" key={technology}>{technology}</span>)}</div>
            <div className="external-links"><a href={project.demo} target="_blank" rel="noopener noreferrer">{t.demoLabel}<span className="sr-only"> — {project.name}. {t.newTabLabel}</span><span aria-hidden="true"> ↗</span></a></div>
            <details className="project-details"><summary>{t.projectDetailsLabel}<span className="sr-only"> — {project.name}</span></summary>{copy.details.map((detail) => <p key={detail}>{detail}</p>)}</details>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
