// Facts transcribed from docs/ACADEMIC_RECORDS_FROM_CV.md. Source PDF is private.
export const academicRecords = [
  { id: 'masters', title: 'Master in Software Engineering & Computer Systems', institution: 'Universidad Internacional de La Rioja', start: '2025', end: '2026', category: 'degrees', kind: 'masters' },
  { id: 'systems', title: 'Systems Engineering', institution: 'Universidad Distrital Francisco José de Caldas', start: '2013', end: '2019', category: 'degrees', kind: 'degree' },
  { id: 'exchange', title: 'Academic Exchange', institution: 'Universidad Autónoma de México', start: '2017', end: null, category: 'academic', kind: 'exchange' },
  { id: 'research', title: 'GNU/Linux', institution: 'Grupo Linux Universidad Distrital (GLUD)', website: 'https://glud.org/', start: '2017', end: null, category: 'academic', kind: 'research' },
  { id: 'scrum', title: 'Scrum Developer Professional Certificate', institution: 'CertiProf Professional Knowledge', start: '2022', end: null, category: 'certificates', kind: 'certificate' },
  { id: 'fullstack', title: 'Full Stack Web Development', institution: 'Cymetria', start: '2022', end: null, category: 'training', kind: 'training' },
  { id: 'lpic', title: 'LPIC-1 Certification Preparatory Course', institution: 'Fundación Correlibre', start: '2022', end: null, category: 'training', kind: 'preparation' },
] as const;

export const careerPeriods = {
  pariveda: { start: '2025-11', end: null },
  infometrika: { start: '2018-09', end: '2025-10' },
  assistance: { start: '2017-07', end: '2018-09' },
} as const;

export function formatCareerMonth(value: string, language: string) {
  return new Intl.DateTimeFormat(language, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}-01T00:00:00Z`)).replace(/^./u, (letter) => letter.toLocaleUpperCase(language));
}
