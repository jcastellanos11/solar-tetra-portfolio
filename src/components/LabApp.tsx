import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { SceneExperience } from './SceneExperience';
import { TetraController } from '../interaction/TetraController';
import { faces, faceById } from '../interaction/faces';
import { careerPeriods, formatCareerMonth } from '../data/academic';
import { EducationPanel } from './EducationPanel';
import { HomeControl } from './HomeControl';
import { CvDownload } from './CvSatellite';
import { TechnologyStack } from './TechnologyStack';
import { startupMark } from '../loading/readiness';
import { experienceStacks, languages, links, projectStack, sections, translations, type Language, type Section } from '../data/content';

function Logo() {
  return <svg className="brand-logo" viewBox="0 0 44 44" aria-hidden="true" fill="none">
    <path d="M22 4 3 37h38L22 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M22 4v21M3 37l19-12 19 12" stroke="currentColor" strokeWidth=".8" opacity=".38" />
    <circle cx="22" cy="25" r="3.4" fill="#F7AF63" />
  </svg>;
}

function SectionIcon({ name }: { name: Section }) {
  switch (name) {
    case 'home': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55"><path d="m3 10 9-7 9 7v10H3z" /><path d="M9 20v-7h6v7" /></svg>;
    case 'projects': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></svg>;
    case 'experience': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55"><circle cx="12" cy="8" r="4"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" /></svg>;
    case 'education': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55"><path d="m2 8 10-5 10 5-10 5zM6 11v6c4 3 8 3 12 0v-6M22 8v9"/></svg>;
    case 'contact': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 6 8 7 8-7" /></svg>;
  }
}

function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7" /></svg>;
}

function Moon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.5 15.8A8.4 8.4 0 0 1 8.2 3.5 8.4 8.4 0 1 0 20.5 15.8Z" /></svg>; }
function Sun() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" /></svg>; }

function CareerPeriod({ id, lang }: { id: keyof typeof careerPeriods; lang: Language }) {
  const period = careerPeriods[id];
  return <p className="career-period"><time dateTime={period.start}>{formatCareerMonth(period.start, lang)}</time> – {period.end ? <time dateTime={period.end}>{formatCareerMonth(period.end, lang)}</time> : translations[lang].presentLabel}</p>;
}

export function ContentPanel({ active, lang, onSelect }: { active: Section; lang: Language; onSelect: (s: Section) => void }) {
  const t = translations[lang];
  if (active === 'home') return (
    <section className="content-pane content-pane--home" aria-labelledby="hero-title" key="home">
      <div className="intro-line"><span className="tiny-rule" /> {t.hello}</div>
      <h1 id="hero-title" tabIndex={-1}>{t.headline}</h1>
      <p className="intro-copy">{t.intro}</p>
      <div className="hero-actions">
        <button className="button button--primary" onClick={() => onSelect('projects')}>{t.primary}<Arrow /></button>
        <button className="button button--outline" onClick={() => onSelect('experience')}>{t.secondary}</button>
      </div>
      <div className="hero-footnote"><span className="footnote-line" /> {t.homeFootnote}</div>
    </section>
  );
  if (active === 'projects') return (
    <section className="content-pane" aria-labelledby="section-title" key="projects">
      <p className="section-overline">{t.projectEyebrow}</p>
      <h1 id="section-title" tabIndex={-1}>{t.projectTitle}</h1>
      <p className="section-intro">{t.projectIntro}</p>
      <article className="feature-card">
        <div className="card-topline"><span className="card-serial">{t.projectCardLabel}</span><span className="status-dot">{t.projectStatus}</span></div>
        <div className="feature-visual" aria-hidden="true"><span className="visual-grid"/><span className="visual-orbit visual-orbit--one"/><span className="visual-orbit visual-orbit--two"/><span className="visual-pin pin-one"/><span className="visual-pin pin-two"/><span className="visual-pin pin-three"/><span className="visual-caption">{t.projectVisualLabel}</span></div>
        <div className="feature-info"><h2>{t.projectName}</h2><p>{t.projectBody}</p>
          <div className="stack-list">{projectStack.map((technology) => <span key={technology}>{technology}</span>)}</div>
          <p className="project-workflow"><strong>{t.projectWorkflowLabel}</strong> {t.projectWorkflow}</p>
          {(links.travelMapsDemo || links.travelMapsRepo) && <div className="external-links">{links.travelMapsDemo && <a href={links.travelMapsDemo} target="_blank" rel="noopener noreferrer">{t.demoLabel} ↗</a>}{links.travelMapsRepo && <a href={links.travelMapsRepo} target="_blank" rel="noopener noreferrer">{t.sourceLabel} ↗</a>}</div>}
          <small className="pending-note">{t.projectFoot}</small>
        </div>
      </article>
    </section>
  );
  if (active === 'experience') return (
    <section className="content-pane content-pane--experience" aria-labelledby="section-title" key="experience">
      <p className="section-overline">{t.experienceEyebrow}</p>
      <h1 id="section-title" tabIndex={-1}>{t.experiencePanelTitle}</h1>
      <p className="section-intro">{t.experienceIntro}</p>
      <div className="about-stat"><strong>8<span>+</span></strong><span>{t.yearsLabel}</span></div>
      <div className="about-pill">{t.experiencePill}</div>
      <section className="profile-block" aria-labelledby="experience-title">
        <h2 id="experience-title">{t.experienceTitle}</h2>
        <ol className="career-timeline">
          {t.experience.map((job) => <li key={job.id}>
            <h3>{job.company}</h3><p className="career-role">{job.position}</p>
            <CareerPeriod id={job.id} lang={lang} />
            <p>{job.summary}</p>
            <details className="career-details">
              <summary>{t.experienceDetailsLabel}<span className="sr-only"> — {job.company}</span></summary>
              <ul>{job.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              <p className="career-technologies"><strong>{t.technologiesLabel}:</strong> {experienceStacks[job.id].join(' · ')}</p>
            </details>
          </li>)}
        </ol>
      </section>
      <TechnologyStack lang={lang} />
      <section className="profile-block" aria-labelledby="ai-skills-title">
        <h2 id="ai-skills-title">{t.aiSkillsTitle}</h2>
        <ul className="skill-list">{t.aiSkills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
        <p className="ai-tools"><strong>{t.aiToolsTitle}:</strong> {t.aiToolsBody}</p>
      </section>
      <div className="panel-actions profile-actions">
        {links.github && <a href={links.github} className="button button--outline" target="_blank" rel="noopener noreferrer">GitHub<Arrow /></a>}
        {links.linkedin && <a href={links.linkedin} className="button button--outline" target="_blank" rel="noopener noreferrer">LinkedIn<Arrow /></a>}
      </div>
    </section>
  );
  if (active === 'education') return <EducationPanel lang={lang} />;
  return (
    <section className="content-pane" aria-labelledby="section-title" key="contact">
      <p className="section-overline">{t.contactEyebrow}</p>
      <h1 id="section-title" tabIndex={-1}>{t.contactTitle}</h1>
      <p className="section-intro">{t.contactIntro}</p>
      <div className="contact-list">
        {links.email && <a href={`mailto:${links.email}`}>{t.emailLabel} <span>{links.email} ↗</span></a>}
        {links.github && <a href={links.github} target="_blank" rel="noopener noreferrer">GitHub <span>{t.profileLabel} ↗</span></a>}
        {links.linkedin && <a href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span>{t.connectLabel} ↗</span></a>}
      </div>
      <div className="panel-actions"><CvDownload lang={lang} /></div>
    </section>
  );
}

export function LabApp() {
  const [controller] = useState(() => new TetraController());
  const shell = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusBeforeCommit = useRef<Element | null>(null);
  const subscribe = useCallback((notify: () => void) => controller.subscribe(() => {
    const focused = document.activeElement;
    focusBeforeCommit.current = focused && panel.current?.contains(focused) ? focused : null;
    notify();
  }), [controller]);
  const active = useSyncExternalStore(subscribe, controller.getSnapshot, controller.getSnapshot);
  const setActive = useCallback((section: Section) => controller.request(section), [controller]);
  const sceneFailed = useRef(false);
  const onFailure = useCallback((error: unknown) => {
    if (sceneFailed.current) return;
    sceneFailed.current = true;
    console.error('[Solar Tetra] 3D scene failed; using the static fallback.', error);
    controller.setAvailable(false);
    startupMark('static-fallback');
    setWebgl(false);
  }, [controller]);
  const [lang, setLang] = useState<Language>(() => {
    try { const saved = localStorage.getItem('solar-language'); if (languages.includes(saved as Language)) return saved as Language; } catch { /* optional storage */ }
    return 'en';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { if (localStorage.getItem('solar-theme') === 'light') return 'light'; } catch { /* optional storage */ }
    return 'dark';
  });
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const t = translations[lang];

  useLayoutEffect(() => { startupMark('app-ready'); }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const onMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', onMotion);
    // Let Canvas attempt the real context once. Initialization failures reach
    // SceneBoundary; do not allocate and deliberately lose a separate probe.
    setWebgl(typeof WebGL2RenderingContext !== 'undefined');
    return () => media.removeEventListener('change', onMotion);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('solar-theme', theme); } catch { /* optional */ }
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('solar-language', lang); } catch { /* optional */ }
  }, [lang]);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setActive('home'); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [setActive]);
  useEffect(() => { controller.setReducedMotion(reducedMotion); }, [controller, reducedMotion]);
  useEffect(() => {
    const update = () => {
      if (!shell.current) return;
      shell.current.dataset.phase = controller.phase;
      shell.current.querySelectorAll<HTMLElement>('[data-destination]').forEach((button) => {
        button.dataset.pending = String(controller.phase === 'aligning' && controller.requested !== controller.active && button.dataset.destination === controller.requested);
      });
    };
    update();
    return controller.subscribeActivity(update);
  }, [controller]);
  useLayoutEffect(() => {
    if (focusBeforeCommit.current && !focusBeforeCommit.current.isConnected) {
      panel.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    }
    focusBeforeCommit.current = null;
  }, [active]);

  return <div ref={shell} className="app-shell" data-section={active}>
    <a href="#main" className="skip-link">{t.skipContent}</a>
    <div className="background-aurora" aria-hidden="true" />
    <header className="topbar">
      <button className="brand" type="button" onClick={() => setActive('home')} aria-label={`Solar Tetra — ${t.navigation.home}`}><Logo /><span className="brand-copy"><strong>JANER<span className="brand-separator"> / </span>SOLAR TETRA</strong><small>{t.prototype}</small></span></button>
      <nav className="desktop-nav" aria-label={t.controls}>
        {sections.map((name) => <button key={name} data-destination={name} className={active === name ? 'nav-item is-active' : 'nav-item'} aria-current={active === name ? 'page' : undefined} aria-label={t.navigation[name]} onClick={() => setActive(name)}>{t.navigationShort[name]}</button>)}
      </nav>
      <div className="top-actions">
        <div className="language-group" role="group" aria-label={t.languageLabel}>
          {languages.map((code) => <button key={code} type="button" onClick={() => setLang(code)} className={lang === code ? 'active' : ''} aria-pressed={lang === code}>{code.toUpperCase()}</button>)}
        </div>
        <span className="toolbar-divider" aria-hidden="true" />
        <button className="theme-switch" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? t.light : t.dark} title={theme === 'dark' ? t.light : t.dark}>{theme === 'dark' ? <Moon /> : <Sun />}</button>
      </div>
    </header>

    <main id="main" className="workbench" tabIndex={-1}>
      <div className="visual-pane">
        <div className="visual-corner visual-corner--top">TETRA / 001 <span className="small-dot" /></div>
        <SceneExperience webgl={webgl} controller={controller} selected={active} onSelect={setActive} daylight={theme === 'light'} reducedMotion={reducedMotion} lang={lang} onFailure={onFailure} />
        <HomeControl lang={lang} active={active} onSelect={setActive} />
        <div className="visual-float-label">{t.navigationShort[active].toLocaleUpperCase(lang)}<span> / 3D LAB</span></div>
        <nav className="face-key" aria-label={t.faceNavigation}>
          {faces.map((face) => <button key={face.id} type="button" data-destination={face.id}
            style={{ '--face-color': face.color, '--face-light-color': face.lightColor } as CSSProperties}
            aria-current={active === face.id ? 'page' : undefined}
            aria-label={t.navigation[face.id]} onClick={() => setActive(face.id)}><span className="face-mark" aria-hidden="true">{face.mark}</span>{t.navigationShort[face.id]}</button>)}
        </nav>
        <div className="visual-corner visual-corner--bottom"><span className="red-dot"/> {webgl === false ? t.webglFallback : reducedMotion ? t.reducedMotion : webgl ? t.interactionHint : t.fallbackHint}</div>
      </div>

      <div className="information-pane">
        <div className="pane-top"><span className="section-number">{active === 'home' ? '00' : faceById[active].mark} <span>/ 04</span></span><span>{t.prototype}</span></div>
        <div ref={panel} className="content-slot"><div key={active} className="content-transition"><ContentPanel active={active} lang={lang} onSelect={setActive}/></div></div>
        <div className="panel-bottom"><span><span className="tiny-orb"/> SOLAR TETRA · V0.1</span><span>© {new Date().getFullYear()} JANER</span></div>
      </div>
    </main>

    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{t.sectionAnnouncement}: {t.navigation[active]}</p>
    <footer className="bottom-navigation">
      <span className="bottom-caption">{t.controls}</span>
      <nav className="mobile-nav" aria-label={t.controls}>
        {sections.map((name) => <button key={name} data-destination={name} type="button" className={active === name ? 'bottom-link selected' : 'bottom-link'} aria-current={active === name ? 'page' : undefined} aria-label={t.navigation[name]} onClick={() => setActive(name)}><SectionIcon name={name}/><span>{t.navigationShort[name]}</span></button>)}
      </nav>
      <span className="footer-legend">◌ &nbsp; {t.faceLegend}</span>
    </footer>
  </div>;
}
