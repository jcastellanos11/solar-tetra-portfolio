import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

function shape(value) {
  if (typeof value === 'string') {
    assert.ok(value.trim(), 'Translation strings must not be empty');
    return 'string';
  }
  if (Array.isArray(value)) return value.map(shape);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, shape(value[key])]));
}

export function validatePortfolioContent(content, publicDir = fileURLToPath(new URL('../public', import.meta.url))) {
  const { languages, sections, translations, links, cvCatalog, selectCv } = content;
  assert.deepEqual(languages, ['en', 'es', 'tr']);
  assert.deepEqual(sections, ['home', 'projects', 'experience', 'education', 'contact']);
  assert.deepEqual(content.careerPeriods, {
    pariveda: { start: '2025-11', end: null }, infometrika: { start: '2018-09', end: '2025-10' }, assistance: { start: '2017-07', end: '2018-09' },
  });
  assert.equal(content.academicRecords.length, 7);
  assert.deepEqual(content.academicRecords.filter((record) => record.category === 'certificates').map((record) => record.id), ['scrum']);
  assert.equal(content.academicRecords.find((record) => record.id === 'lpic').kind, 'preparation');
  const research = content.academicRecords.find((record) => record.id === 'research');
  assert.equal(research.institution, 'Grupo Linux Universidad Distrital (GLUD)');
  assert.equal(research.website, 'https://glud.org/');
  assert.equal(research.start, '2017');
  assert.deepEqual(shape(content.technologyCopy.en), shape(content.technologyCopy.es));
  assert.deepEqual(shape(content.technologyCopy.en), shape(content.technologyCopy.tr));
  assert.deepEqual(shape(content.loadingCopy.en), shape(content.loadingCopy.es));
  assert.deepEqual(shape(content.loadingCopy.en), shape(content.loadingCopy.tr));
  assert.deepEqual(shape(content.projectCopy.en), shape(content.projectCopy.es));
  assert.deepEqual(shape(content.projectCopy.en), shape(content.projectCopy.tr));
  assert.deepEqual(content.projects.map((project) => project.id), ['travel-maps', 'break-my-api']);
  assert.deepEqual(content.projects.map((project) => project.demo), ['https://travel-map.jhonjaner11.workers.dev/', 'https://break-my-api.jhonjaner11.workers.dev/']);
  assert.equal(content.projects[0].developmentStatus, 'in-development');
  for (const project of content.projects) {
    assert.ok(project.technologies.length);
    assert.equal(project.repository, undefined, 'Project repository URLs are not confirmed');
    for (const lang of languages) assert.ok(content.projectCopy[lang][project.id]);
    for (const width of [600, 1200]) assert.ok(existsSync(join(publicDir, `${project.image.base}-${width}.jpg`)), 'Project capture must exist');
  }
  assert.equal(new Set(content.technologies.map((item) => item.id)).size, content.technologies.length);
  for (const item of content.technologies) {
    assert.ok(item.evidence);
    assert.ok(content.technologyCategories.includes(item.category));
    assert.ok(['professional', 'projects'].includes(item.scope));
    for (const lang of languages) assert.ok(item.name || content.technologyCopy[lang].practices[item.term]);
  }
  const expected = shape(translations.en);
  for (const language of languages) {
    const t = translations[language];
    assert.deepEqual(shape(t), expected, `Translation keys/types differ: ${language}`);
    assert.deepEqual(Object.keys(t.navigation), sections, `Missing section: ${language}`);
    assert.deepEqual(t.experience.map((job) => job.id), ['pariveda', 'infometrika', 'assistance']);
    const infometrika = t.experience.find((job) => job.id === 'infometrika');
    assert.ok(!infometrika.summary.includes('PHP'), `PHP must not dominate the ${language} summary`);
    assert.ok(content.experienceStacks.infometrika.includes('PHP'));
    assert.ok(infometrika.details.some((detail) => detail.includes('PHP')), `PHP missing from ${language} details`);
    assert.ok(t.aiToolsBody.includes('OpenAI Codex'));
    for (const record of content.academicRecords) assert.ok(t.educationDescriptions[record.id]);
    assert.doesNotMatch(JSON.stringify(t), /Claude Code|Cursor|GitHub Copilot/);
  }
  assert.equal(translations.en.headline, 'Senior Full-Stack Software Engineer');
  assert.equal(translations.en.aiSkillsTitle, 'AI-Assisted Software Development');
  assert.equal(translations.en.projectStatus, 'In development');
  assert.equal(links.email, 'jhonjaner11@gmail.com');
  assert.equal(links.github, 'https://github.com/jcastellanos11');
  assert.equal(links.linkedin, 'https://www.linkedin.com/in/jhonjaner11/');
  const approvedFiles = new Set();
  for (const [language, asset] of Object.entries(cvCatalog)) {
    assert.ok(languages.includes(language), 'Unknown CV language');
    assert.equal(typeof asset.approved, 'boolean', 'CV approval must be explicit');
    assert.equal(asset.file, `john-castellanos-cv-${language}.pdf`, 'CV filename must be local and match its language');
    if (!asset.approved) continue;
    approvedFiles.add(asset.file);
    const path = join(publicDir, 'cv', asset.file);
    assert.ok(statSync(path).isFile(), 'Approved CV must exist in public/cv/');
    assert.equal(readFileSync(path).subarray(0, 5).toString('ascii'), '%PDF-', 'Approved CV asset must be a PDF');
  }
  const cvDir = join(publicDir, 'cv');
  if (existsSync(cvDir)) for (const file of readdirSync(cvDir)) {
    if (/\.pdf$/i.test(file)) assert.ok(approvedFiles.has(file), `Unapproved CV must not be published: ${file}`);
  }
  for (const language of languages) {
    const cv = selectCv(language, cvCatalog);
    if (cv) {
      assert.ok(approvedFiles.has(cv.file), 'CV selection must refer to an approved asset');
      assert.equal(cv.href, `/cv/${cv.file}`);
    }
  }
}

export async function loadPortfolioContent() {
  const { outputFiles } = await build({ entryPoints: [fileURLToPath(new URL('../src/data/content.ts', import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node' });
  const code = outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const content = await loadPortfolioContent();
  validatePortfolioContent(content);
  console.log('Content validation passed: EN / ES / TR parity, approved professional content and contacts, project/CV publication gates.');
}
