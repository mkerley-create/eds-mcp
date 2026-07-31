import {readdir, readFile} from 'node:fs/promises';
import {extname, resolve, relative} from 'node:path';

interface Violation {
  file: string;
  line: number;
  rule: string;
  excerpt: string;
}

const projectRoot = process.cwd();
const roots = [
  resolve(projectRoot, 'apps/examples'),
  resolve(projectRoot, 'packages/templates/source'),
];

const rules = [
  {
    name: 'no-hardcoded-color',
    pattern: /#[0-9a-fA-F]{3,8}\b/,
    message: 'Use an EDS semantic color token instead of a hex value.',
  },
  {
    name: 'no-inline-style',
    pattern: /\bstyle\s*=\s*\{\{/,
    message: 'Use an EDS component, semantic token, or approved class instead of inline styles.',
  },
  {
    name: 'no-raw-react-bootstrap',
    pattern: /from\s+['"]react-bootstrap(?:\/[^'"]*)?['"]/,
    message: 'Use the Edmunds-owned EDS component API instead of React-Bootstrap directly.',
  },
  {
    name: 'no-bootstrap-javascript',
    pattern: /from\s+['"]bootstrap(?:\/[^'"]*)?['"]/,
    message: 'Use the EDS Bootstrap adapter; product code must not import Bootstrap behavior directly.',
  },
] as const;

async function collect(path: string): Promise<string[]> {
  const entries = await readdir(path, {withFileTypes: true});
  const nested = await Promise.all(
    entries.map(entry => {
      const target = resolve(path, entry.name);
      if (entry.isDirectory()) return collect(target);
      return ['.ts', '.tsx', '.js', '.jsx'].includes(extname(entry.name))
        ? Promise.resolve([target])
        : Promise.resolve([]);
    }),
  );
  return nested.flat();
}

const files = (await Promise.all(roots.map(collect))).flat();
const violations: Violation[] = [];

for (const file of files) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  lines.forEach((line, index) => {
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        violations.push({
          file: relative(projectRoot, file),
          line: index + 1,
          rule: rule.name,
          excerpt: `${rule.message} ${line.trim()}`,
        });
      }
    }
  });
}

if (violations.length) {
  console.error(`EDS compliance failed with ${violations.length} violation(s):`);
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} [${violation.rule}] ${violation.excerpt}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(`EDS compliance passed for ${files.length} product and template source files.`);
}
