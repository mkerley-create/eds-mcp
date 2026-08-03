import {readFile} from 'node:fs/promises';

interface TypographyContract {
  styles: Array<{
    id: string;
    role: string;
    size: string;
    properties: Record<string, {value: string; cssVariable: string}>;
  }>;
}

const contract = JSON.parse(await readFile('generated/typography.json', 'utf8')) as TypographyContract;
const roles = ['display', 'headline', 'title', 'body', 'detail'];
const sizes = ['large', 'medium', 'small'];
const expectedStyles = roles.flatMap(role =>
  sizes
    .filter(size => !(role === 'display' && size === 'medium'))
    .map(size => ({role, size})),
);
const properties = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];

for (const {role, size} of expectedStyles) {
  const style = contract.styles.find(item => item.role === role && item.size === size);
  if (!style) throw new Error(`Missing typography style: ${role}-${size}`);
  const missing = properties.filter(property => !style.properties[property]);
  if (missing.length) throw new Error(`${style.id} is missing: ${missing.join(', ')}`);
}

if (contract.styles.some(style => style.id === 'typography:display-medium')) {
  throw new Error('Removed typography style is still published: display-medium');
}

const styleSources = await Promise.all([
  readFile('packages/core/src/styles.css', 'utf8'),
  readFile('packages/patterns/src/styles.css', 'utf8'),
]);
const declaration = /^\s*(font-family|font-size|font-weight|line-height|letter-spacing):\s*([^;]+);/gm;
for (const source of styleSources) {
  for (const match of source.matchAll(declaration)) {
    if (!match[2]?.includes('var(--eds-')) {
      throw new Error(`Typography declaration must use an EDS token: ${match[0].trim()}`);
    }
  }
}

console.log(`Typography valid: ${contract.styles.length} semantic styles with ${properties.length} properties each.`);
