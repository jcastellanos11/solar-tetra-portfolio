import type { Language } from './content';

export type CvAsset = { approved: boolean; file: string };
export type CvCatalog = Partial<Record<Language, CvAsset>>;
export type CvSelection = { language: Language; file: string; href: string };

// Approval is explicit. Add a reviewed asset and update only its metadata here.
export const cvCatalog: CvCatalog = {
  en: { approved: true, file: 'john-castellanos-cv-en.pdf' },
  es: { approved: false, file: 'john-castellanos-cv-es.pdf' },
  tr: { approved: false, file: 'john-castellanos-cv-tr.pdf' },
};

export function selectCv(language: Language, catalog: CvCatalog = cvCatalog): CvSelection | null {
  const approved = (code: Language): CvSelection | null => {
    const asset = catalog[code];
    // Fixed local filenames prevent traversal, remote targets, or a mislabeled PDF language.
    return asset?.approved === true && asset.file === `john-castellanos-cv-${code}.pdf`
      ? { language: code, file: asset.file, href: `/cv/${asset.file}` } : null;
  };
  return approved(language) ?? (language === 'en' ? null : approved('en'));
}
