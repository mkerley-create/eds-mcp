#!/usr/bin/env node
import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {basename, dirname, resolve} from 'node:path';
import type {Registry, RegistryItem} from '@edmunds/eds-docs-schema';

const args = process.argv.slice(2);
const command = args[0] ?? 'help';
const subject = args[1];
const isJson = args.includes('--json');
const isDense = args.includes('--dense');
const isDryRun = args.includes('--dry-run');
const cwd = process.cwd();

async function loadRegistry(): Promise<Registry> {
  const candidates = [
    resolve(cwd, 'generated/registry.json'),
    resolve(dirname(new URL(import.meta.url).pathname), '../../../generated/registry.json'),
  ];
  const path = candidates.find(existsSync);
  if (!path) throw new Error('EDS registry not found. Run `pnpm generate`.');
  return JSON.parse(await readFile(path, 'utf8')) as Registry;
}

function present(item: RegistryItem | RegistryItem[] | undefined) {
  if (!item) throw new Error(`No matching EDS record for ${subject ?? command}.`);
  if (isJson) {
    console.log(JSON.stringify(item, null, 2));
    return;
  }
  if (Array.isArray(item)) {
    for (const entry of item) console.log(`${entry.id.padEnd(35)} ${entry.description}`);
    return;
  }
  if (isDense) {
    console.log(item.dense);
    return;
  }
  console.log(`${item.kind.toUpperCase()} · ${'title' in item ? item.title : item.name}`);
  console.log(item.description);
  if (item.kind === 'component') {
    console.log(`\nImport: ${item.importPath}\nMaturity: ${item.maturity}\n\nProps`);
    for (const prop of item.props) {
      console.log(`  ${prop.name}${prop.required ? '*' : ''}: ${prop.type}${prop.default ? ` = ${prop.default}` : ''}`);
      console.log(`    ${prop.description}`);
    }
    console.log(`\nExample\n${item.examples[0]?.code ?? ''}`);
  } else if (item.kind === 'doc') {
    for (const section of item.sections) {
      console.log(`\n${section.title}\n${section.body}`);
      if (section.code) console.log(`\n${section.code}`);
    }
  } else {
    console.log(`\n${item.skeleton}`);
  }
}

function findItem(items: RegistryItem[], kind: RegistryItem['kind'], name?: string) {
  const scoped = items.filter(item => item.kind === kind);
  if (!name) return scoped;
  const needle = name.toLowerCase();
  return scoped.find(item =>
    item.id.toLowerCase() === `${kind}:${needle}` ||
    ('name' in item && item.name.toLowerCase() === needle) ||
    ('title' in item && item.title.toLowerCase() === needle),
  );
}

async function initProject() {
  const packagePath = resolve(cwd, 'package.json');
  if (!existsSync(packagePath)) throw new Error('package.json is required before running eds init.');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  const required = {
    '@edmunds/eds-core': '^0.1.0',
    '@edmunds/eds-theme-edmunds': '^0.1.0',
    '@edmunds/eds-bootstrap-adapter': '^0.1.0',
    bootstrap: '^5.3.8',
  };
  const nextPackage = {
    ...packageJson,
    dependencies: {...packageJson.dependencies, ...required},
    scripts: {...packageJson.scripts, eds: 'eds'},
  };
  const agentPath = resolve(cwd, 'AGENTS.md');
  const current = existsSync(agentPath) ? await readFile(agentPath, 'utf8') : '';
  const block = `<!-- EDS:START -->\n## Edmunds Design System 0.1.0\n\nEDS is an execution contract for people and agents. The installed registry, CLI, and MCP are canonical. \`design-system.html\` is the portable human overview.\n\nBefore writing UI:\n1. Run \`eds template --list\` and choose the closest workflow.\n2. Run \`eds template <name> --skeleton\` to study structure.\n3. Run \`eds component <Name> --dense\` for every component used.\n4. Run \`eds golden <Name>\` and follow the closest approved composition.\n\nRules:\n- Use EDS components before Bootstrap elements or custom controls.\n- Never invent imports, props, variants, or component composition.\n- Never add hardcoded hex colors, arbitrary pixel spacing, or inline style objects to product UI. Use semantic \`--eds-*\` tokens.\n- If product intent is ambiguous, render the smallest option in \`scratchpad.html\`, state the decision being tested, and wait for approval before integration.\n- Before submitting, run \`pnpm lint:eds\`, typecheck, interaction tests, and accessibility checks.\n\nSelf-check: every component is approved, every prop exists in the installed record, every visual value is semantic, and the implementation follows a golden example or documented template.\n<!-- EDS:END -->`;
  const nextAgent = current.match(/<!-- EDS:START -->[\s\S]*?<!-- EDS:END -->/)
    ? current.replace(/<!-- EDS:START -->[\s\S]*?<!-- EDS:END -->/, block)
    : `${current.trim()}${current.trim() ? '\n\n' : ''}${block}\n`;
  const receipt = {command: 'init', dryRun: isDryRun, packageJson: packagePath, agentDocs: agentPath, dependencies: required};
  if (!isDryRun) {
    await writeFile(packagePath, `${JSON.stringify(nextPackage, null, 2)}\n`);
    await writeFile(agentPath, nextAgent);
  }
  console.log(isJson ? JSON.stringify(receipt, null, 2) : `${isDryRun ? 'Would update' : 'Updated'} package.json and ${basename(agentPath)}.`);
}

async function writeTemplate(registry: Registry, name: string) {
  const item = findItem(registry.items, 'template', name);
  if (!item || Array.isArray(item) || item.kind !== 'template') throw new Error(`Unknown template: ${name}`);
  const source = resolve(cwd, item.sourcePath);
  const targetArg = args.find(value => value.startsWith('--out='))?.split('=')[1] ?? `${item.name.replaceAll(' ', '')}.tsx`;
  const target = resolve(cwd, targetArg);
  if (isDryRun) {
    console.log(isJson ? JSON.stringify({source, target, dryRun: true}) : `Would write ${target}`);
    return;
  }
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, await readFile(source, 'utf8'), {flag: 'wx'});
  console.log(`Wrote ${target}`);
}

async function doctor(registry: Registry) {
  const checks = [
    ['registry', registry.items.length > 0, `${registry.items.length} records`],
    ['package.json', existsSync(resolve(cwd, 'package.json')), 'project manifest'],
    ['agent docs', existsSync(resolve(cwd, 'AGENTS.md')), 'run eds init to generate'],
    ['living artifact', existsSync(resolve(cwd, 'apps/docs/public/design-system.html')), 'run pnpm generate'],
    ['golden examples', existsSync(resolve(cwd, 'generated/golden-examples.json')), 'run pnpm generate'],
    ['bootstrap', existsSync(resolve(cwd, 'node_modules/bootstrap')), 'Bootstrap 5.3 expected'],
  ] as const;
  if (isJson) console.log(JSON.stringify({checks: checks.map(([name, pass, detail]) => ({name, pass, detail}))}, null, 2));
  else for (const [name, pass, detail] of checks) console.log(`${pass ? '✓' : '○'} ${name}: ${detail}`);
  process.exitCode = checks.some(([, pass]) => !pass) ? 1 : 0;
}

async function main() {
  if (command === 'init') return initProject();
  const registry = await loadRegistry();
  if (command === 'component') return present(findItem(registry.items, 'component', subject));
  if (command === 'docs') return present(findItem(registry.items, 'doc', subject));
  if (command === 'tokens') {
    const tokens = JSON.parse(await readFile(resolve(cwd, 'packages/tokens/generated/tokens.json'), 'utf8')) as Record<string, string>;
    const query = subject?.toLowerCase();
    const filtered = Object.fromEntries(Object.entries(tokens).filter(([name]) => !query || name.includes(query)));
    console.log(isJson ? JSON.stringify(filtered, null, 2) : Object.entries(filtered).map(([name, value]) => `${name.padEnd(30)} ${value}`).join('\n'));
    return;
  }
  if (command === 'golden') {
    const goldenPath = resolve(cwd, 'generated/golden-examples.json');
    const golden = JSON.parse(await readFile(goldenPath, 'utf8')) as {
      components: Array<{id: string; importPath: string; examples: Array<{name: string; description: string; code: string}>}>;
      templates: Array<{id: string; skeleton: string; sourcePath: string}>;
    };
    if (!subject) {
      console.log(isJson ? JSON.stringify(golden, null, 2) : [
        ...golden.components.map(item => `${item.id.padEnd(35)} ${item.examples[0]?.name ?? 'Example'}`),
        ...golden.templates.map(item => `${item.id.padEnd(35)} ${item.sourcePath}`),
      ].join('\n'));
      return;
    }
    const id = `component:${subject}`.toLowerCase();
    const match = golden.components.find(item => item.id.toLowerCase() === id);
    if (!match) throw new Error(`No golden example for ${subject}.`);
    console.log(isJson ? JSON.stringify(match, null, 2) : `${match.importPath}\n\n${match.examples.map(example => `${example.name}\n${example.description}\n${example.code}`).join('\n\n')}`);
    return;
  }
  if (command === 'template') {
    if (args.includes('--list') || !subject) return present(findItem(registry.items, 'template'));
    if (args.includes('--skeleton')) return present(findItem(registry.items, 'template', subject));
    if (args.includes('--write')) return writeTemplate(registry, subject);
  }
  if (command === 'doctor') return doctor(registry);
  if (command === 'theme' && subject === 'build') return console.log('Theme artifacts are generated by `pnpm generate` from DTCG tokens.');
  if (command === 'upgrade') return console.log(isDryRun ? 'No upgrades would be applied at 0.1.0.' : 'EDS is already at 0.1.0.');
  console.log(`EDS CLI 0.1.0

Commands:
  eds init [--dry-run] [--json]
  eds component [name] [--dense|--json]
  eds docs [topic] [--dense|--json]
  eds tokens [query] [--json]
  eds golden [component] [--json]
  eds template --list
  eds template <name> --skeleton
  eds template <name> --write [--out=file] [--dry-run]
  eds theme build
  eds doctor [--json]
  eds upgrade [--dry-run]`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
