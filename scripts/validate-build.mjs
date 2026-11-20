import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadPortfolioContent, validatePortfolioContent } from './validate-content.mjs';

const content = await loadPortfolioContent();
const output = fileURLToPath(new URL('../dist', import.meta.url));
validatePortfolioContent(content, output);
for (const asset of Object.values(content.cvCatalog)) {
  if (!asset.approved) continue;
  const source = readFileSync(new URL(`../public/cv/${asset.file}`, import.meta.url));
  const built = readFileSync(new URL(`../dist/cv/${asset.file}`, import.meta.url));
  assert.ok(source.equals(built), `Built CV must exactly match the approved source: ${asset.file}`);
}
console.log('Production asset validation passed: approved CV downloads exist and match the source byte for byte.');
