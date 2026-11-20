import type { Language } from './content';

export const technologyCategories = ['frontend', 'backend', 'data', 'cloud', 'quality', 'ai'] as const;
export type TechnologyCategory = typeof technologyCategories[number];
type Practice = 'rest' | 'microservices' | 'unitTesting' | 'review' | 'architecture' | 'assistants' | 'agentic' | 'prompts' | 'aiTesting';
type Technology = { id: string; category: TechnologyCategory; scope: 'professional' | 'projects'; evidence: string } & ({ name: string; term?: never } | { term: Practice; name?: never });

// Product names occur once. Practices are translated by key; evidence is retained for future edits.
const approved = 'docs/SOLAR_TETRA_CONTENT_REWRITE.md';
export const technologies: readonly Technology[] = [
  { id: 'javascript', name: 'JavaScript', category: 'frontend', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'typescript', name: 'TypeScript', category: 'frontend', scope: 'professional', evidence: `${approved}#pariveda` },
  { id: 'react', name: 'React', category: 'frontend', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'vue', name: 'Vue.js', category: 'frontend', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'html', name: 'HTML5', category: 'frontend', scope: 'projects', evidence: 'index.html (Solar Tetra)' },
  { id: 'css', name: 'CSS3', category: 'frontend', scope: 'projects', evidence: 'src/styles.css (Solar Tetra)' },
  { id: 'python', name: 'Python', category: 'backend', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'django', name: 'Django', category: 'backend', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'node', name: 'Node.js', category: 'backend', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'php', name: 'PHP', category: 'backend', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'rest', term: 'rest', category: 'backend', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'microservices', term: 'microservices', category: 'backend', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'postgresql', name: 'PostgreSQL', category: 'data', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'mongodb', name: 'MongoDB', category: 'data', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'postgis', name: 'PostGIS', category: 'data', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'aws', name: 'AWS', category: 'cloud', scope: 'professional', evidence: `${approved}#pariveda` },
  { id: 'docker', name: 'Docker', category: 'cloud', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'cicd', name: 'CI/CD', category: 'cloud', scope: 'professional', evidence: `${approved}#infometrika` },
  { id: 'jest', name: 'Jest', category: 'quality', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'pytest', name: 'Pytest', category: 'quality', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'unit-testing', term: 'unitTesting', category: 'quality', scope: 'professional', evidence: `${approved}#assistance-team` },
  { id: 'code-review', term: 'review', category: 'quality', scope: 'professional', evidence: `${approved}#pariveda` },
  { id: 'architecture', term: 'architecture', category: 'quality', scope: 'professional', evidence: `${approved}#pariveda` },
  { id: 'assistants', term: 'assistants', category: 'ai', scope: 'projects', evidence: `${approved}#ai-related-skills` },
  { id: 'agentic', term: 'agentic', category: 'ai', scope: 'projects', evidence: `${approved}#ai-related-skills` },
  { id: 'prompts', term: 'prompts', category: 'ai', scope: 'projects', evidence: `${approved}#ai-related-skills` },
  { id: 'ai-testing', term: 'aiTesting', category: 'ai', scope: 'projects', evidence: `${approved}#ai-related-skills` },
  { id: 'codex', name: 'OpenAI Codex', category: 'ai', scope: 'projects', evidence: `${approved}#tools-used-in-current-projects` },
];

type StackCopy = {
  title: string; intro: string; projectLabel: string; projectLegend: string; listLabel: string;
  categories: Record<TechnologyCategory, string>; descriptions: Record<TechnologyCategory, string>; practices: Record<Practice, string>;
};
export const technologyCopy: Record<Language, StackCopy> = {
  en: {
    title: 'Technology Stack', intro: 'Technologies and engineering practices across my work. Project-only experience is marked separately.', projectLabel: 'Current projects', projectLegend: '* Demonstrated in current projects; no claim of use at a past employer.', listLabel: 'Technologies and practices',
    categories: { frontend: 'Frontend', backend: 'Backend & APIs', data: 'Databases & Geospatial', cloud: 'Cloud & DevOps', quality: 'Testing & Software Quality', ai: 'AI-Assisted Development' },
    descriptions: { frontend: 'Interfaces and web applications.', backend: 'Services, integrations, and enterprise systems.', data: 'Application data and geospatial features.', cloud: 'Cloud-backed features and delivery workflows.', quality: 'Maintainable software and reliable releases.', ai: 'Current project workflows, with human review and validation.' },
    practices: { rest: 'REST APIs', microservices: 'Microservices', unitTesting: 'Unit Testing', review: 'Code Review', architecture: 'Software Architecture', assistants: 'AI Coding Assistants', agentic: 'Agentic Development Workflows', prompts: 'Prompt & Task Specification', aiTesting: 'AI-Assisted Testing & Debugging' },
  },
  es: {
    title: 'Tecnologías y prácticas', intro: 'Tecnologías y prácticas de ingeniería utilizadas a lo largo de mi trayectoria. La experiencia solo en proyectos se indica por separado.', projectLabel: 'Proyectos actuales', projectLegend: '* Demostrado en proyectos actuales; no implica uso en empleos anteriores.', listLabel: 'Tecnologías y prácticas',
    categories: { frontend: 'Frontend', backend: 'Backend y APIs', data: 'Bases de datos y sistemas geoespaciales', cloud: 'Nube y DevOps', quality: 'Pruebas y calidad de software', ai: 'Desarrollo asistido por IA' },
    descriptions: { frontend: 'Interfaces y aplicaciones web.', backend: 'Servicios, integraciones y sistemas empresariales.', data: 'Datos de aplicaciones y funcionalidades geoespaciales.', cloud: 'Funcionalidades en la nube y flujos de entrega.', quality: 'Software mantenible y entregas fiables.', ai: 'Flujos de proyectos actuales, con revisión y validación humana.' },
    practices: { rest: 'APIs REST', microservices: 'Microservicios', unitTesting: 'Pruebas unitarias', review: 'Revisión de código', architecture: 'Arquitectura de software', assistants: 'Asistentes de programación con IA', agentic: 'Flujos de desarrollo con agentes', prompts: 'Especificación de instrucciones y tareas', aiTesting: 'Pruebas y depuración asistidas por IA' },
  },
  tr: {
    title: 'Teknolojiler ve mühendislik pratikleri', intro: 'Kariyerim boyunca kullandığım teknolojiler ve mühendislik pratikleri. Yalnızca projelerde edindiğim deneyim ayrıca belirtilmiştir.', projectLabel: 'Güncel projeler', projectLegend: '* Güncel projelerde kullanılmıştır; önceki işverenlerde kullanıldığı anlamına gelmez.', listLabel: 'Teknolojiler ve pratikler',
    categories: { frontend: 'Ön yüz', backend: 'Arka uç ve API’ler', data: 'Veritabanları ve coğrafi bilgi sistemleri', cloud: 'Bulut ve DevOps', quality: 'Test ve yazılım kalitesi', ai: 'Yapay zekâ destekli geliştirme' },
    descriptions: { frontend: 'Arayüzler ve web uygulamaları.', backend: 'Servisler, entegrasyonlar ve kurumsal sistemler.', data: 'Uygulama verileri ve coğrafi özellikler.', cloud: 'Bulut destekli özellikler ve teslimat süreçleri.', quality: 'Bakımı kolay yazılım ve güvenilir sürümler.', ai: 'İnsan incelemesi ve doğrulamasıyla yürütülen güncel proje süreçleri.' },
    practices: { rest: 'REST API’leri', microservices: 'Mikroservisler', unitTesting: 'Birim testleri', review: 'Kod incelemesi', architecture: 'Yazılım mimarisi', assistants: 'Yapay zekâ kodlama asistanları', agentic: 'Ajan tabanlı geliştirme süreçleri', prompts: 'İstem ve görev tanımlama', aiTesting: 'Yapay zekâ destekli test ve hata ayıklama' },
  },
};
