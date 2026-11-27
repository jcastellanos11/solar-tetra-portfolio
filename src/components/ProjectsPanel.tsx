import { useLayoutEffect, useRef, useState } from 'react';
import { projects, projectCopy, type ProjectId } from '../data/projects';
import { translations, type Language } from '../data/content';

type Project = (typeof projects)[number];
function ProjectImage({ project, lang, compact = false }: { project: Project; lang: Language; compact?: boolean }) {
  return <img className={compact ? 'project-thumbnail' : 'project-screenshot'} src={`${project.image.base}-600.jpg`} srcSet={`${project.image.base}-600.jpg 600w, ${project.image.base}-1200.jpg 1200w`} sizes={compact ? '(max-width: 480px) 80px, 140px' : '(max-width: 600px) 90vw, 540px'} width={project.image.width} height={project.image.height} alt={compact ? '' : projectCopy[lang][project.id].imageAlt} loading="lazy" decoding="async" />;
}

// Local UI navigation only. Leaving Projects unmounts this panel and resets its overview.
export function ProjectsPanel({ lang }: { lang: Language }) {
  const [selected, setSelected] = useState<ProjectId | null>(null);
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const entries = useRef<Partial<Record<ProjectId, HTMLButtonElement>>>({});
  const pendingFocus = useRef<ProjectId | 'detail' | null>(null);
  const overviewScroll = useRef(0);
  const t = translations[lang];
  const project = projects.find((item) => item.id === selected);
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target === 'detail') {
      heading.current?.focus({ preventScroll: true });
      const top = section.current?.getBoundingClientRect().top ?? 0;
      // Only reveal the heading when opening from an entry farther down a long list.
      if (top < 0) window.scrollTo({ top: Math.max(0, window.scrollY + top - 24), behavior: 'instant' });
    } else {
      window.scrollTo({ top: overviewScroll.current, behavior: 'instant' });
      entries.current[target]?.focus({ preventScroll: true });
    }
  }, [selected]);
  const open = (id: ProjectId) => {
    overviewScroll.current = window.scrollY;
    pendingFocus.current = 'detail';
    setSelected(id);
  };
  const back = () => { pendingFocus.current = selected; setSelected(null); };
  return <section ref={section} className="content-pane" aria-labelledby="section-title">
    <div key={selected ?? 'overview'} className="project-view">
      <p className="section-overline">{t.projectEyebrow}</p>
      {project && <button className="button button--outline project-back" type="button" onClick={back}><span aria-hidden="true">← </span>{t.backProjectsLabel}</button>}
      <h1 ref={heading} id="section-title" tabIndex={-1}>{project ? project.name : t.projectTitle}</h1>
      {project ? <ProjectDetail project={project} lang={lang} /> : <>
        <p className="section-intro">{t.projectIntro}</p>
        <ul className="projects-list">
          {projects.map((item) => {
            const text = projectCopy[lang][item.id];
            return <li data-project={item.id} key={item.id}>
              <button ref={(node) => { if (node) entries.current[item.id] = node; else delete entries.current[item.id]; }} className="project-preview" type="button" onClick={() => open(item.id)} aria-label={`${t.openProjectLabel} — ${item.name}`} aria-describedby={`project-summary-${item.id}`}>
                <ProjectImage project={item} lang={lang} compact />
                <span className="project-preview-copy"><span className="project-preview-title">{item.name}<span aria-hidden="true"> →</span></span><span id={`project-summary-${item.id}`} className="project-preview-summary">{text.summary}</span>{item.developmentStatus === 'in-development' && <span className="project-preview-status">{t.projectStatus}</span>}</span>
              </button>
            </li>;
          })}
        </ul>
      </>}
    </div>
  </section>;
}

export function ProjectDetail({ project, lang }: { project: Project; lang: Language }) {
  const t = translations[lang], copy = projectCopy[lang][project.id];
  return <article className="feature-card project-detail" data-project={project.id}>
        <ProjectImage project={project} lang={lang} />
        <div className="feature-info">
          <p className="project-category">{copy.category}</p>
          {project.developmentStatus === 'in-development' && <p className="project-development status-dot">{t.projectStatus}</p>}
          <p>{copy.description}</p>
          <div className="stack-list" role="list" aria-label={t.technologiesLabel}>{project.technologies.map((technology) => <span role="listitem" key={technology}>{technology}</span>)}</div>
          <div className="external-links"><a href={project.demo} target="_blank" rel="noopener noreferrer">{t.demoLabel}<span className="sr-only"> — {project.name}. {t.newTabLabel}</span><span aria-hidden="true"> ↗</span></a></div>
          <div className="project-explanation">{copy.details.map((detail) => <p key={detail}>{detail}</p>)}</div>
        </div>
      </article>;
}
