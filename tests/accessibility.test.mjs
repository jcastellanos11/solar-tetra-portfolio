import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { faces } from '../src/interaction/faces.ts';
import * as content from '../src/data/content.ts';
import { translations, sections, languages, links, cvCatalog, selectCv } from '../src/data/content.ts';
import { technologies, technologyCategories, technologyCopy } from '../src/data/technologies.ts';
import { validatePortfolioContent } from '../scripts/validate-content.mjs';

// Render the actual TSX without installing a browser or creating generated files.
const escaped = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const require = createRequire(import.meta.url);
const compiled = await build({
  stdin: {
    contents: `import {createElement} from 'react';
      import {renderToStaticMarkup} from 'react-dom/server';
      import {LabApp, ContentPanel} from './src/components/LabApp';
      import {FaceLabels} from './src/components/FaceLabels';
      export const app = () => renderToStaticMarkup(createElement(LabApp));
      export const panel = (active, lang) => renderToStaticMarkup(createElement(ContentPanel, {active, lang, onSelect: () => {}}));
      export const labels = (active, lang) => renderToStaticMarkup(createElement(FaceLabels, {active, lang, elements: {}, onSelect: () => {}}));`,
    resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'tsx',
  },
  bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic',
  plugins: [{ name: 'shared-react', setup(builder) {
    builder.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, ({ path }) => ({ path: pathToFileURL(require.resolve(path)).href, external: true }));
  } }],
});
const view = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
globalThis.window = { matchMedia: () => ({ matches: false }) };

test('Technology Stack layout allows a single narrow column and wrapping chips without horizontal scrolling', () => {
  // CSS contract only; actual 320px layout is separately verified in Chrome.
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.technology-groups\s*\{[^}]*minmax\(min\(100%, 210px\), 1fr\)/);
  assert.match(css, /\.technology-group ul\s*\{[^}]*flex-wrap: wrap/);
  assert.match(css, /\.technology-group li\s*\{[^}]*max-width: 100%[^}]*overflow-wrap: anywhere/);
  assert.doesNotMatch(css, /\.technology[^}]*overflow-x: (?:scroll|auto)/);
});

for (const lang of languages) {
  test(`${lang}: GLUD updates the existing 2017 record with a safe, labeled external link`, () => {
    const html = view.panel('education', lang), t = translations[lang];
    assert.equal((html.match(/data-credential="research"/g) || []).length, 1);
    assert.ok(html.includes('Grupo Linux Universidad Distrital (GLUD)'));
    assert.match(html, /href="https:\/\/glud.org\/" target="_blank" rel="noopener noreferrer"/);
    assert.ok(html.includes(t.academicWebsiteLabel)); assert.ok(html.includes(t.newTabLabel));
    const record = html.split('data-credential="research"')[1].split('</li>')[0];
    assert.match(record, /<time dateTime="2017">2017<\/time>/);
  });

  test(`${lang}: six stack categories render after the timeline with translated practices and explicit project-only scopes`, () => {
    const html = view.panel('experience', lang), t = technologyCopy[lang];
    assert.ok(html.indexOf('id="technology-title"') > html.indexOf('</ol>'));
    assert.ok(html.includes(t.title)); assert.ok(html.includes(t.projectLegend));
    for (const category of technologyCategories) {
      assert.ok(html.includes(`id="technology-${category}"`));
      assert.ok(html.includes(escaped(t.categories[category])));
      assert.ok(html.includes(t.descriptions[category]));
    }
    for (const item of technologies) {
      assert.ok(html.includes(`data-technology="${item.id}" data-scope="${item.scope}"`));
      assert.ok(html.includes(escaped(item.name ?? t.practices[item.term])));
    }
    assert.equal((html.match(/data-technology="php"/g) || []).length, 1);
    assert.doesNotMatch(html, /Next\.js|Laravel|GitHub Copilot|Prompt Engineering|Ingeniería de prompts/);
    for (const id of ['html', 'css', 'codex', 'agentic']) assert.ok(html.includes(`data-technology="${id}" data-scope="projects"`));
  });

  test(`${lang}: HTML fallback exposes every section with native buttons and a committed active state`, () => {
    globalThis.localStorage = { getItem: (name) => name === 'solar-language' ? lang : null };
    const html = view.app();
    assert.match(html, /class="static-tetra"/);
    assert.match(html, /class="skip-link"/);
    assert.match(html, /id="main"[^>]*tabindex="-1"/);
    assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
    assert.ok(html.includes(translations[lang].faceNavigation));
    for (const section of sections) {
      assert.ok(html.includes(`data-destination="${section}"`));
      assert.ok(html.includes(escaped(translations[lang].navigation[section])));
    }
    assert.match(html, /data-destination="home"[^>]*aria-current="page"/);
    assert.doesNotMatch(html, /data-destination="(?:projects|experience|education|contact)"[^>]*aria-current="page"/);
  });

  test(`${lang}: each content panel has one labeled section, a focusable heading, and no invented links`, () => {
    for (const active of sections) {
      const html = view.panel(active, lang);
      assert.equal((html.match(/<h1\b/g) || []).length, 1);
      assert.match(html, /<section[^>]*aria-labelledby="(?:hero-title|section-title)"/);
      assert.match(html, /<h1[^>]*tabindex="-1"/);
      assert.doesNotMatch(html, /href="(?:null|undefined|#)"/);
      if (active === 'projects') { assert.ok(html.includes('Travel Maps')); assert.ok(html.includes('Break My API')); assert.doesNotMatch(html, /github\.com/); }
      if (active === 'contact') assert.ok(html.includes('mailto:jhonjaner11@gmail.com'));
    }
  });

  test(`${lang}: face labels have explicit section names and a non-color selected indicator`, () => {
    for (const active of sections) {
      const html = view.labels(active, lang);
      assert.equal((html.match(/<button\b/g) || []).length, 4);
      assert.equal((html.match(/aria-current="page"/g) || []).length, active === 'home' ? 0 : 1);
      for (const face of faces) {
        assert.ok(html.includes(`aria-label="${escaped(translations[lang].navigation[face.id])}"`));
        assert.ok(html.includes(face.mark));
      }
    }
  });

  test(`${lang}: confirmed public contact links render exactly and external profiles open safely`, () => {
    const html = view.panel('contact', lang);
    assert.ok(html.includes('href="mailto:jhonjaner11@gmail.com"'));
    assert.ok(html.includes('jhonjaner11@gmail.com'));
    assert.ok(html.includes(translations[lang].emailLabel));
    assert.ok(html.includes(translations[lang].profileLabel));
    assert.ok(html.includes(translations[lang].connectLabel));
    for (const url of [links.github, links.linkedin]) {
      assert.ok(html.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
      const about = view.panel('experience', lang);
      assert.ok(about.includes(`href="${url}" class="button button--outline" target="_blank" rel="noopener noreferrer"`));
    }
    assert.ok(html.includes('href="/cv/john-castellanos-cv-en.pdf"'));
    assert.ok(html.includes('download="john-castellanos-cv-en.pdf"'));
    assert.ok(html.includes(translations[lang].cvLabel));
    assert.ok(html.includes(translations[lang].cvLanguages.en));
  });

  test(`${lang}: approved career, PHP, AI skills and project workflow render without an unapproved CV`, () => {
    const t = translations[lang], about = view.panel('experience', lang), projects = view.panel('projects', lang);
    assert.match(about, /Infometrika/); assert.match(about, /PHP/);
    assert.match(about, /Pariveda/); assert.match(about, /Assistance Team/);
    assert.ok(about.includes(t.experienceTitle));
    assert.ok(about.includes(t.aiSkillsTitle));
    assert.ok(about.includes(t.aiToolsBody));
    assert.match(about, /<details class="career-details">/);
    assert.equal((about.match(/<details\b/g) || []).length, 3);
    assert.ok(projects.includes(t.projectStatus));
    assert.match(projects, /Codex/);
    assert.doesNotMatch(about, /\bdownload\b|href="[^\"]*\.pdf|CV link coming soon|CV bağlantısı yakında|Enlace al CV/);
    assert.doesNotMatch(about, /Claude Code|Cursor|GitHub Copilot/);
  });

  test(`${lang}: Education separates seven exact records and labels LPIC-1 only as preparation`, () => {
    const html = view.panel('education', lang), t = translations[lang];
    assert.equal((html.match(/data-credential=/g) || []).length, 7);
    assert.match(html, /data-credential="lpic" data-kind="preparation"/);
    assert.match(html, /data-credential="scrum" data-kind="certificate"/);
    assert.match(html, /data-credential="exchange" data-kind="exchange"/);
    assert.match(html, /data-credential="research" data-kind="research"/);
    assert.ok(html.includes(t.educationKinds.preparation));
    for (const record of content.academicRecords) {
      assert.ok(html.includes(escaped(record.title)));
      if (record.institution) assert.ok(html.includes(escaped(record.institution)));
      assert.match(html, new RegExp(`datetime="${record.start}"`, 'i'));
      assert.ok(html.includes(escaped(t.educationDescriptions[record.id])));
    }
    const experience = view.panel('experience', lang);
    for (const value of ['2025-11', '2018-09', '2025-10', '2017-07']) assert.ok(experience.includes(`dateTime="${value}"`) || experience.includes(`datetime="${value}"`));
    assert.ok(experience.includes(t.presentLabel));
  });
}

for (const lang of ['en', 'es', 'tr']) {
  test(`${lang}: exactly two ordered projects have confirmed accessible external demos and complete copy`, () => {
    const html = view.panel('projects', lang), t = translations[lang];
    assert.equal((html.match(/<article\b/g) || []).length, 2);
    assert.equal((html.match(/data-project="travel-maps"/g) || []).length, 1);
    assert.ok(html.indexOf('data-project="travel-maps"') < html.indexOf('data-project="break-my-api"'));
    const anchors = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
    assert.equal(anchors.length, 2);
    for (const [index, project] of content.projects.entries()) {
      const copy = content.projectCopy[lang][project.id];
      assert.ok(anchors[index].includes(`href="${project.demo}" target="_blank" rel="noopener noreferrer"`));
      for (const text of [t.demoLabel, project.name, t.newTabLabel]) assert.ok(anchors[index].includes(escaped(text)));
      for (const text of [copy.category, copy.description, ...copy.details, ...project.technologies]) assert.ok(html.includes(escaped(text)));
      assert.ok(html.includes(`alt="${escaped(copy.imageAlt)}" loading="lazy" decoding="async"`));
    }
    assert.equal((html.match(/<details class="project-details">/g) || []).length, 2);
    assert.doesNotMatch(html, /github\.com|href="#"|pending-note/);
  });
}

test('project screenshots are responsive local captures with reserved dimensions', () => {
  const html = view.panel('projects', 'en');
  assert.equal((html.match(/srcSet="[^"]+600w, [^"]+1200w"/gi) || []).length, 2);
  assert.equal((html.match(/width="1200" height="738"/g) || []).length, 2);
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.project-screenshot \{[^}]*width: 100%; height: auto;/);
  assert.match(css, /\.stack-list \{[^}]*flex-wrap: wrap;/);
});

test('content validation enforces complete translation parity and the approved English source', () => {
  assert.doesNotThrow(() => validatePortfolioContent(content));
  const doc = readFileSync(new URL('../docs/SOLAR_TETRA_CONTENT_REWRITE.md', import.meta.url), 'utf8');
  assert.equal(translations.en.intro, doc.match(/## Short intro \(Home\)\n\n([^\n]+)/)[1]);
  assert.equal(translations.en.experienceIntro, doc.match(/## About Me — full summary\n\n([^\n]+)/)[1]);
  assert.equal(translations.en.headline, 'Senior Full-Stack Software Engineer');
  assert.equal(translations.en.aiSkillsTitle, 'AI-Assisted Software Development');
  const broken = structuredClone(translations); delete broken.tr.profileLabel;
  assert.throws(() => validatePortfolioContent({ ...content, translations: broken }), /Translation keys\/types differ: tr/);
  const missingProjectCopy = structuredClone(content.projectCopy); delete missingProjectCopy.tr['break-my-api'];
  assert.throws(() => validatePortfolioContent({ ...content, projectCopy: missingProjectCopy }));
  assert.throws(() => validatePortfolioContent({ ...content, projects: [content.projects[0], content.projects[0]] }));
  assert.equal(content.projectCopy.en['travel-maps'].description, doc.match(/\*\*Short description:\*\* ([^\n]+?)(?:  )?\n/)[1]);
  assert.equal(content.projectCopy.en['travel-maps'].details[0], doc.match(/\*\*Engineering angle:\*\* ([^\n]+?)(?:  )?\n/)[1]);
});

test('CV selection requires explicit approval and rejects unsafe or mislabeled filenames', () => {
  assert.equal(selectCv('en', {}), null);
  assert.equal(selectCv('en', { en: { ...cvCatalog.en, approved: false } }), null);
  for (const file of ['https://example.com/cv.pdf', '../historical.pdf', '/resume.pdf', 'file.txt', 'john-castellanos-cv-es.pdf']) assert.equal(selectCv('en', { en: { approved: true, file } }), null);
  assert.equal(selectCv('en').href, '/cv/john-castellanos-cv-en.pdf');
});

test('publication validation rejects a missing or invalid CV asset even when its path is marked approved', (t) => {
  const publicDir = mkdtempSync(join(tmpdir(), 'solar-cv-validation-'));
  t.after(() => rmSync(publicDir, { recursive: true, force: true }));
  cpSync(new URL('../public/projects', import.meta.url), join(publicDir, 'projects'), { recursive: true });
  const approved = { ...content, cvCatalog: { en: cvCatalog.en } };
  assert.throws(() => validatePortfolioContent(approved, publicDir), /ENOENT/);
  mkdirSync(join(publicDir, 'cv')); writeFileSync(join(publicDir, 'cv', cvCatalog.en.file), 'Not a PDF');
  assert.throws(() => validatePortfolioContent(approved, publicDir), /Approved CV asset must be a PDF/);
  // A format fixture in a temporary directory, never a published portfolio file.
  writeFileSync(join(publicDir, 'cv', cvCatalog.en.file), '%PDF-1.7\n');
  assert.doesNotThrow(() => validatePortfolioContent(approved, publicDir));
  writeFileSync(join(publicDir, 'cv', cvCatalog.es.file), '%PDF-1.7\n');
  assert.throws(() => validatePortfolioContent(approved, publicDir), /Unapproved CV must not be published/);
  assert.doesNotThrow(() => validatePortfolioContent({ ...approved, cvCatalog: { ...approved.cvCatalog, es: { ...cvCatalog.es, approved: true } } }, publicDir));
});

function luminance(hex) {
  const rgb = hex.replace('#', '').match(/../g).map((part) => parseInt(part, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); }
test('face accent text exceeds 4.5:1 against both theme surfaces and page backgrounds', () => {
  for (const face of faces) {
    for (const background of ['#080b10', '#10161e']) assert.ok(contrast(face.color, background) >= 4.5, `${face.id} dark ${background}`);
    for (const background of ['#f3f2ed', '#fffdfa']) assert.ok(contrast(face.lightColor, background) >= 4.5, `${face.id} light ${background}`);
  }
});
