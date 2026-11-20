import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { academicRecords, careerPeriods, formatCareerMonth } from '../src/data/academic.ts';
import { translations, experienceStacks } from '../src/data/content.ts';

test('all seven academic facts match the supplied CV extraction without inferred institutions or dates', () => {
  const source = readFileSync(new URL('../docs/ACADEMIC_RECORDS_FROM_CV.md', import.meta.url), 'utf8');
  assert.deepEqual(academicRecords.map((r) => [r.title, r.institution, r.start, r.end, r.kind]), [
    ['Master in Software Engineering & Computer Systems', 'Universidad Internacional de La Rioja', '2025', '2026', 'masters'],
    ['Systems Engineering', 'Universidad Distrital Francisco José de Caldas', '2013', '2019', 'degree'],
    ['Academic Exchange', 'Universidad Autónoma de México', '2017', null, 'exchange'],
    ['GNU/Linux', 'Grupo Linux Universidad Distrital (GLUD)', '2017', null, 'research'],
    ['Scrum Developer Professional Certificate', 'CertiProf Professional Knowledge', '2022', null, 'certificate'],
    ['Full Stack Web Development', 'Cymetria', '2022', null, 'training'],
    ['LPIC-1 Certification Preparatory Course', 'Fundación Correlibre', '2022', null, 'preparation'],
  ]);
  for (const record of academicRecords) {
    assert.ok(source.includes(record.title));
    if (record.institution && record.id !== 'research') assert.ok(source.includes(record.institution));
    assert.ok(source.includes(record.start));
  }
  assert.deepEqual(academicRecords.filter((r) => r.category === 'certificates').map((r) => r.id), ['scrum']);
  assert.equal(academicRecords.find((r) => r.id === 'lpic').category, 'training');
  assert.equal(academicRecords.filter((r) => r.category === 'degrees').length, 2);
  assert.equal(academicRecords.find((r) => r.id === 'research').website, 'https://glud.org/');
});

test('employment periods retain the confirmed month precision and localized Present', () => {
  assert.deepEqual(careerPeriods, {
    pariveda: { start: '2025-11', end: null }, infometrika: { start: '2018-09', end: '2025-10' }, assistance: { start: '2017-07', end: '2018-09' },
  });
  assert.equal(formatCareerMonth('2025-11', 'en'), 'November 2025');
  assert.equal(formatCareerMonth('2018-09', 'en'), 'September 2018');
  assert.equal(formatCareerMonth('2025-10', 'en'), 'October 2025');
  assert.equal(formatCareerMonth('2017-07', 'en'), 'July 2017');
  assert.equal(formatCareerMonth('2025-11', 'es'), 'Noviembre de 2025');
  assert.equal(formatCareerMonth('2025-11', 'tr'), 'Kasım 2025');
  assert.equal(translations.en.presentLabel, 'Present');
  assert.equal(translations.es.presentLabel, 'Actualidad');
  assert.equal(translations.tr.presentLabel, 'Günümüz');
});

test('PHP remains in the technical stack and maintenance detail, outside every main summary', () => {
  assert.ok(experienceStacks.infometrika.includes('PHP'));
  for (const t of Object.values(translations)) {
    const job = t.experience.find((record) => record.id === 'infometrika');
    assert.doesNotMatch(job.summary, /PHP/);
    assert.ok(job.details.some((detail) => detail.includes('PHP')));
    assert.doesNotMatch(t.experienceIntro, /PHP/);
    assert.doesNotMatch(job.position, /AI|PHP/);
    assert.ok(t.educationDescriptions.lpic);
  }
});
