import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {
  registrySchema,
  sourceComponentContractSchema,
  type ComponentDoc,
  type RegistryItem,
} from '../packages/docs-schema/src/index';
import {referenceDocs} from '../packages/docs-schema/src/reference-docs';
import {buttonDoc} from '../packages/core/src/Button/Button.doc';
import {textFieldDoc} from '../packages/core/src/TextField/TextField.doc';
import {vehicleCardDoc} from '../packages/patterns/src/VehicleCard/VehicleCard.doc';
import {inventoryResultsTemplate} from '../packages/templates/src/inventory-results.template';

type TokenLeaf = {$type: string; $value: string | string[]};
interface TokenTree {
  [key: string]: TokenTree | TokenLeaf | string;
}
type VenomTokenLeaf = {
  value: string | string[];
  name: string;
  attributes?: {category?: string; type?: string; item?: string};
};
interface VenomTokenTree {
  [key: string]: VenomTokenTree | VenomTokenLeaf | string;
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokenPath = resolve(projectRoot, 'packages/tokens/src/tokens.json');
const venomTokenPath = resolve(projectRoot, 'packages/tokens/src/venom.tokens.json');
const venomComponentTokenPath = resolve(projectRoot, 'packages/tokens/src/venom.component.tokens.json');
const venomContractsPath = resolve(projectRoot, 'packages/venom-adapter/generated/source-contracts.json');
const tokenTree = JSON.parse(await readFile(tokenPath, 'utf8')) as TokenTree;
const venomTokenTree = JSON.parse(await readFile(venomTokenPath, 'utf8')) as VenomTokenTree;
const venomComponentTokenTree = JSON.parse(await readFile(venomComponentTokenPath, 'utf8')) as VenomTokenTree;
const venomComponentContracts = sourceComponentContractSchema.array().parse(
  JSON.parse(await readFile(venomContractsPath, 'utf8')),
);
const coreCss = await readFile(resolve(projectRoot, 'packages/core/src/styles.css'), 'utf8');
const patternCss = await readFile(resolve(projectRoot, 'packages/patterns/src/styles.css'), 'utf8');

function isLeaf(value: unknown): value is TokenLeaf {
  return typeof value === 'object' && value !== null && '$value' in value;
}

function isVenomLeaf(value: unknown): value is VenomTokenLeaf {
  return typeof value === 'object' && value !== null && 'value' in value && 'name' in value;
}

function cssName(path: string[], sourceName?: string): string {
  if (sourceName) return `--${sourceName}`;
  const normalized =
    path[0] === 'color' ? path.slice(1) :
    path[0] === 'semantic' ? path.slice(1) :
    path;
  return `--eds-${normalized.map(segment => segment.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)).join('-')}`;
}

const leaves = new Map<string, {path: string[]; token: TokenLeaf; sourceName?: string; source: 'eds' | 'venom' | 'venom-component'}>();
function visit(tree: TokenTree, path: string[] = []) {
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$') || typeof value !== 'object' || value === null) continue;
    const next = [...path, key];
    if (isLeaf(value)) leaves.set(next.join('.'), {path: next, token: value, source: 'eds'});
    else visit(value, next);
  }
}
visit(tokenTree);

function visitVenom(tree: VenomTokenTree, path: string[] = [], source: 'venom' | 'venom-component' = 'venom') {
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$') || typeof value !== 'object' || value === null) continue;
    const next = [...path, key];
    if (isVenomLeaf(value)) {
      const type = value.name.includes('-color-') ? 'color' : 'string';
      leaves.set(`venom.${next.join('.')}`, {
        path: ['venom', ...next],
        token: {$type: type, $value: value.value},
        sourceName: value.name,
        source,
      });
    } else visitVenom(value, next, source);
  }
}
visitVenom(venomTokenTree);
visitVenom(venomComponentTokenTree, [], 'venom-component');

const outputLeaves = [...leaves.values()].filter((item, index, all) =>
  all.findIndex(candidate => cssName(candidate.path, candidate.sourceName) === cssName(item.path, item.sourceName)) === index,
);

function resolveValue(value: string | string[]): string {
  if (Array.isArray(value)) return value.join(', ');
  const alias = value.match(/^\{(.+)\}$/)?.[1];
  if (!alias) return value;
  const target = leaves.get(alias);
  if (!target) throw new Error(`Unknown token alias: ${alias}`);
  return resolveValue(target.token.$value);
}

const cssLines = outputLeaves.map(({path, token, sourceName}) =>
  `    ${cssName(path, sourceName)}: ${resolveValue(token.$value)};`,
);
const foundationTokenCss = `/* Generated from packages/tokens/src/tokens.json and automated Venom snapshots. */\n@layer eds-foundations {\n  :root,\n  [data-eds-theme="edmunds"] {\n${cssLines.join('\n')}\n  }\n}\n`;

const scssLines = outputLeaves.map(({path, token, sourceName}) => {
  const name = cssName(path, sourceName).replace('--eds-', '$eds-');
  return `${name}: ${resolveValue(token.$value)};`;
});
const bootstrapScss = `// Generated EDS variables for Bootstrap 5.3 integration.\n${scssLines.join('\n')}\n\n$primary: $eds-action-primary;\n$danger: $eds-status-danger;\n$border-radius: $eds-radius-control;\n$font-family-sans-serif: $eds-font-family-body;\n`;

const tokenExports = Object.fromEntries(
  outputLeaves.map(({path, token, sourceName}) => [
    cssName(path, sourceName).replace('--eds-', '').replaceAll('-', '_'),
    resolveValue(token.$value),
  ]),
);

const tokenContracts = [...leaves.values()].map(({path, token, sourceName, source}) => ({
  id: sourceName ?? path.join('.'),
  source,
  sourceName,
  path: path.join('.'),
  cssVariable: cssName(path, sourceName),
  type: token.$type,
  value: resolveValue(token.$value),
}));
const tokenCounts = Object.fromEntries(
  ['eds', 'venom', 'venom-component'].map(source => [
    source,
    tokenContracts.filter(token => token.source === source).length,
  ]),
);

const typographyRoles = ['display', 'headline', 'title', 'body', 'detail'] as const;
const typographySizes = ['large', 'medium', 'small'] as const;
const typographyScale = typographyRoles.flatMap(role =>
  typographySizes
    .filter(size => !(role === 'display' && size === 'medium'))
    .map(size => ({role, size})),
);
const typographyProperties = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'] as const;
const typography = {
  version: '0.1.0',
  family: 'Helvetica Neue',
  styles: typographyScale.map(({role, size}) => ({
    id: `typography:${role}-${size}`,
    role,
    size,
    cssClass: `eds-type-${role}-${size}`,
    properties: Object.fromEntries(typographyProperties.map(property => {
      const path = ['semantic', 'typography', role, size, property];
      const token = leaves.get(path.join('.'));
      if (!token) throw new Error(`Missing typography token: ${path.join('.')}`);
      return [property, {
        value: resolveValue(token.token.$value),
        cssVariable: cssName(token.path, token.sourceName),
      }];
    })),
  })),
};
const typographyCss = `@layer eds-components {\n${typography.styles.map(style => `  .${style.cssClass} {\n${Object.entries(style.properties).map(([property, contract]) => `    ${property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}: var(${contract.cssVariable});`).join('\n')}\n  }`).join('\n')}\n}\n`;
const tokenCss = `${foundationTokenCss}${typographyCss}`;

const figmaVariables = {
  version: '0.1.0',
  collections: [{
    name: 'EDS Foundations',
    modes: ['Light'],
    variables: outputLeaves.map(({path, token, sourceName}) => ({
      name: sourceName ?? path.join('/'),
      type: token.$type,
      valuesByMode: {Light: resolveValue(token.$value)},
      codeSyntax: {WEB: `var(${cssName(path, sourceName)})`},
    })),
  }],
};

const items: RegistryItem[] = [
  ...referenceDocs,
  buttonDoc,
  textFieldDoc,
  vehicleCardDoc,
  inventoryResultsTemplate,
];
const componentDocs = items.filter(
  (item): item is ComponentDoc => item.kind === 'component',
);

function validateDocumentedProps(doc: ComponentDoc) {
  const sourcePath = resolve(projectRoot, doc.source.path);
  return readFile(sourcePath, 'utf8').then(source => {
    const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const declaration = sourceFile.statements.find(
      statement => ts.isInterfaceDeclaration(statement) && statement.name.text === doc.source.propsType,
    );
    if (!declaration || !ts.isInterfaceDeclaration(declaration)) {
      throw new Error(`${doc.id}: ${doc.source.propsType} was not found in ${doc.source.path}`);
    }
    const codeProps = new Map(
      declaration.members.flatMap(member =>
        ts.isPropertySignature(member) && member.name
          ? [[member.name.getText(sourceFile).replaceAll(/["']/g, ''), !member.questionToken] as const]
          : [],
      ),
    );
    const docsProps = new Map(doc.props.map(prop => [prop.name, prop.required === true]));
    const missing = [...codeProps.keys()].filter(name => !docsProps.has(name));
    const extra = [...docsProps.keys()].filter(name => !codeProps.has(name));
    const requiredMismatch = [...codeProps].filter(([name, required]) => docsProps.get(name) !== required).map(([name]) => name);
    if (missing.length || extra.length || requiredMismatch.length) {
      throw new Error(`${doc.id}: code/docs prop drift (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}; required mismatch: ${requiredMismatch.join(', ') || 'none'})`);
    }
  });
}

await Promise.all(componentDocs.map(validateDocumentedProps));

const registryPayload = {
  name: 'Edmunds Design System',
  version: '0.1.0',
  items,
  sourceComponents: venomComponentContracts,
} as const;
const contentHash = `sha256:${createHash('sha256').update(JSON.stringify(registryPayload)).digest('hex')}`;
const registry = registrySchema.parse({...registryPayload, contentHash});
const mappedDocs = componentDocs.filter(doc => doc.figma.status !== 'pending');
const codeConnect = mappedDocs.map(doc => ({
  component: doc.name,
  importPath: doc.importPath,
  fileKey: doc.figma.fileKey,
  nodeId: doc.figma.nodeId,
  nodeUrl: doc.figma.nodeUrl,
  status: doc.figma.status,
  target: doc.figma.target,
}));

const goldenExamples = {
  version: registry.version,
  contentHash: registry.contentHash,
  instruction:
    'Use these examples as the primary reference for EDS imports, prop names, and composition. Retrieve the full record through `eds component <Name>` or MCP get before implementation.',
  components: componentDocs.map(doc => ({
    id: doc.id,
    importPath: doc.importPath,
    examples: doc.examples,
  })),
  templates: items
    .filter(item => item.kind === 'template')
    .map(template => ({
      id: template.id,
      skeleton: template.skeleton,
      sourcePath: template.sourcePath,
    })),
};

const embeddedContract = JSON.stringify(registry).replaceAll('<', '\\u003c');
const standaloneSharedCss = `
@layer app {
  :root { color-scheme: light; font-family: var(--eds-font-family-body); }
  * { box-sizing: border-box; }
  body { background: var(--eds-surface-page); color: var(--eds-text-primary); margin: 0; }
  button, input, select { font: inherit; }
  button:focus-visible, input:focus-visible, select:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--eds-action-focus) 35%, transparent);
    outline-offset: 2px;
  }
  .artifact-shell { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }
  .artifact-nav { background: var(--eds-blue-700); color: white; padding: 28px 20px; position: sticky; top: 0; height: 100vh; }
  .artifact-nav strong { display: block; font-size: 1.1rem; }
  .artifact-nav small { display: block; font-family: var(--eds-font-family-data); letter-spacing: .1em; margin-top: 4px; opacity: .75; }
  .artifact-nav nav { display: grid; gap: 8px; margin-top: 40px; }
  .artifact-nav a { border-radius: var(--eds-radius-control); color: white; padding: 9px 10px; text-decoration: none; }
  .artifact-nav a:hover { background: rgb(255 255 255 / 12%); }
  .artifact-main { margin: 0 auto; max-width: 1180px; padding: clamp(28px, 6vw, 72px); width: 100%; }
  .artifact-hero { border-bottom: 1px solid var(--eds-border-default); display: grid; gap: 24px; grid-template-columns: 1fr auto; padding-bottom: 42px; }
  .artifact-eyebrow { color: var(--eds-text-secondary); font-family: var(--eds-font-family-data); font-size: 11px; letter-spacing: .1em; }
  .artifact-title { font-family: var(--eds-font-family-display); font-size: clamp(2.5rem, 7vw, 5rem); letter-spacing: -.045em; line-height: .95; margin: 12px 0; max-width: 800px; }
  .artifact-lede { color: var(--eds-text-secondary); font-size: 1.15rem; line-height: 1.55; max-width: 700px; }
  .artifact-mode { align-self: start; background: var(--eds-surface-raised); border: 1px solid var(--eds-border-default); border-radius: var(--eds-radius-pill); cursor: pointer; padding: 10px 14px; }
  .artifact-section { border-bottom: 1px solid var(--eds-border-default); padding: 48px 0; }
  .artifact-section h2 { font-family: var(--eds-font-family-display); font-size: 2rem; margin: 0 0 8px; }
  .artifact-section > p { color: var(--eds-text-secondary); line-height: 1.6; max-width: 760px; }
  .artifact-flow { display: grid; gap: 12px; grid-template-columns: repeat(6, 1fr); margin-top: 28px; }
  .artifact-flow div { background: var(--eds-surface-raised); border: 1px solid var(--eds-border-default); min-height: 108px; padding: 14px; }
  .artifact-flow span { color: var(--eds-blue-600); display: block; font-family: var(--eds-font-family-data); font-size: 11px; margin-bottom: 24px; }
  .artifact-grid { display: grid; gap: 20px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 28px; }
  .artifact-specimen { background: var(--eds-surface-raised); border: 1px solid var(--eds-border-default); border-radius: var(--eds-radius-surface); padding: 24px; }
  .artifact-specimen h3 { margin: 0 0 18px; }
  .artifact-controls { align-items: end; display: grid; gap: 12px; grid-template-columns: 1fr 180px; margin-bottom: 18px; }
  .artifact-controls label { display: grid; font-size: 13px; font-weight: 700; gap: 5px; }
  .artifact-controls input, .artifact-controls select { background: var(--eds-surface-raised); border: 1px solid var(--eds-border-strong); border-radius: var(--eds-radius-control); color: var(--eds-text-primary); min-height: 44px; padding: 0 12px; }
  .artifact-vehicle { max-width: 370px; }
  .artifact-tokens { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); margin-top: 24px; }
  .artifact-token { align-items: center; background: var(--eds-surface-raised); border: 1px solid var(--eds-border-default); display: flex; gap: 10px; padding: 10px; }
  .artifact-token i { background: var(--swatch); border: 1px solid var(--eds-border-default); border-radius: 50%; height: 32px; width: 32px; }
  .artifact-token code { font-family: var(--eds-font-family-data); font-size: 10px; }
  .artifact-code { background: var(--eds-ink-900); color: #d9edf7; font-family: var(--eds-font-family-data); font-size: 12px; line-height: 1.7; overflow: auto; padding: 18px; white-space: pre-wrap; }
  .artifact-type-grid { border-top: 1px solid var(--eds-border-default); margin-top: 28px; }
  .artifact-type-row { align-items: baseline; border-bottom: 1px solid var(--eds-border-default); display: grid; gap: 24px; grid-template-columns: 150px minmax(0, 1fr); padding: 20px 0; }
  .artifact-type-meta { color: var(--eds-text-secondary); font-family: var(--eds-font-family-data); font-size: 11px; }
  .artifact-type-sample { margin: 0; overflow-wrap: anywhere; }
  .artifact-rule { border-top: 1px solid var(--eds-border-default); display: grid; gap: 16px; grid-template-columns: 150px 1fr; padding: 14px 0; }
  .artifact-rule strong { color: var(--eds-blue-600); }
  [data-mode="dark"] { color-scheme: dark; --eds-surface-page:#111c24; --eds-surface-raised:#1a2934; --eds-text-primary:#f7fafb; --eds-text-secondary:#bdc9d0; --eds-border-default:#354754; --eds-border-strong:#61727d; --eds-action-primary:#4bb4e8; --eds-action-primary-hover:#79c9ef; }
  @media (max-width: 800px) {
    .artifact-shell { grid-template-columns: 1fr; }
    .artifact-nav { height: auto; position: static; }
    .artifact-nav nav { display: flex; margin-top: 18px; overflow: auto; }
    .artifact-hero, .artifact-grid { grid-template-columns: 1fr; }
    .artifact-flow { grid-template-columns: repeat(2, 1fr); }
  }
}
`;

const standaloneScripts = `
const root = document.documentElement;
document.querySelector('[data-mode-toggle]')?.addEventListener('click', event => {
  const next = root.dataset.mode === 'dark' ? 'light' : 'dark';
  root.dataset.mode = next;
  event.currentTarget.textContent = next === 'dark' ? 'Use light mode' : 'Use dark mode';
});
const labelInput = document.querySelector('[data-label-control]');
const variantInput = document.querySelector('[data-variant-control]');
const actionButton = document.querySelector('[data-action-preview]');
const syncButton = () => {
  if (!actionButton || !labelInput || !variantInput) return;
  actionButton.querySelector('span').textContent = labelInput.value || 'Action';
  actionButton.dataset.variant = variantInput.value;
};
labelInput?.addEventListener('input', syncButton);
variantInput?.addEventListener('change', syncButton);
document.querySelector('[data-save-preview]')?.addEventListener('click', event => {
  const saved = event.currentTarget.getAttribute('aria-pressed') !== 'true';
  event.currentTarget.setAttribute('aria-pressed', String(saved));
  event.currentTarget.textContent = saved ? '♥' : '♡';
});
`;

const designSystemHtml = `<!doctype html>
<html lang="en" data-eds-theme="edmunds" data-mode="light">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="eds-version" content="${registry.version}">
  <title>EDS machine-readable design system</title>
  <style>@layer reset, eds-foundations, eds-components, app;${tokenCss}${coreCss}${patternCss}${standaloneSharedCss}</style>
</head>
<body>
  <div class="artifact-shell">
    <aside class="artifact-nav"><strong>Edmunds Design System</strong><small>AGENT CONTRACT · ${registry.version}</small>
      <nav><a href="#contract">Contract</a><a href="#golden">Golden examples</a><a href="#typography">Typography</a><a href="#tokens">Tokens</a><a href="#rules">Agent rules</a></nav>
    </aside>
    <main class="artifact-main">
      <header class="artifact-hero"><div><span class="artifact-eyebrow">LIVING ARTIFACT · GENERATED FROM THE REGISTRY</span><h1 class="artifact-title">One truth for people and agents.</h1><p class="artifact-lede">This file is a portable overview. For exact props and current examples, query <code>eds component</code> or the EDS MCP before writing code.</p></div><button class="artifact-mode" data-mode-toggle type="button">Use dark mode</button></header>
      <section class="artifact-section" id="contract"><h2>The execution contract</h2><p>Design intent moves through a deterministic pipeline. The generated registry—not this rendered page—is the canonical machine interface.</p>
        <div class="artifact-flow">${['DTCG tokens','Typed docs','Registry','CLI + MCP','Golden examples','CI validation'].map((label,index)=>`<div><span>${String(index+1).padStart(2,'0')}</span><strong>${label}</strong></div>`).join('')}</div>
      </section>
      <section class="artifact-section" id="golden"><h2>Golden examples</h2><p>These live specimens demonstrate canonical imports, semantic variants, accessible state, and composition.</p>
        <div class="artifact-grid">
          <div class="artifact-specimen"><h3>Action hierarchy</h3><div class="artifact-controls"><label>Label<input data-label-control value="Save vehicle"></label><label>Variant<select data-variant-control><option>primary</option><option>secondary</option><option>tertiary</option><option>destructive</option></select></label></div><button class="eds-button" data-action-preview data-variant="primary" data-size="md"><span>Save vehicle</span></button><pre class="artifact-code">import {Button} from '@edmunds/eds-core/Button';\n\n&lt;Button label="Save vehicle" variant="primary" /&gt;</pre></div>
          <div class="artifact-specimen"><h3>Inventory result</h3><article class="eds-card eds-vehicle-card artifact-vehicle" data-padding="none" data-variant="outlined"><div class="eds-vehicle-card__media"><div class="eds-vehicle-card__silhouette" role="img" aria-label="Vehicle photo unavailable"><span></span></div><span class="eds-vehicle-card__deal">Great price</span><button data-save-preview class="eds-vehicle-card__save" type="button" aria-label="Save 2023 Honda CR-V" aria-pressed="false">♡</button></div><div class="eds-stack eds-vehicle-card__content" data-direction="column" data-gap="3"><div><span class="eds-text" data-size="caption" data-tone="secondary">EX-L AWD</span><h3 class="eds-heading" data-size="subsection">2023 Honda CR-V</h3></div><div class="eds-vehicle-card__price-row"><strong class="eds-vehicle-card__price">$28,990</strong><span class="eds-text" data-size="caption" data-tone="secondary">Est. $472/mo</span></div><button class="eds-button" data-variant="primary" data-size="md"><span>View details</span></button></div></article></div>
        </div>
      </section>
      <section class="artifact-section" id="typography"><h2>Typography</h2><p>Five semantic roles express hierarchy independently from HTML structure. Each role is a complete contract: family, size, weight, line height, and letter spacing.</p><div class="artifact-type-grid">${typography.styles.map(style => `<div class="artifact-type-row"><span class="artifact-type-meta">${style.role} / ${style.size}<br>${style.properties.fontSize!.value} · ${style.properties.fontWeight!.value} · ${style.properties.lineHeight!.value}</span><p class="artifact-type-sample ${style.cssClass}">Find the right car with confidence.</p></div>`).join('')}</div></section>
      <section class="artifact-section" id="tokens"><h2>Semantic tokens</h2><p>Product code uses semantic roles. Primitive ramps are theme inputs and must not appear in feature code.</p><div class="artifact-tokens">${[['Action primary','--eds-action-primary'],['Surface page','--eds-surface-page'],['Surface raised','--eds-surface-raised'],['Text primary','--eds-text-primary'],['Price good','--eds-price-good'],['Status danger','--eds-status-danger']].map(([label,name])=>`<div class="artifact-token"><i style="--swatch:var(${name})"></i><div><strong>${label}</strong><br><code>${name}</code></div></div>`).join('')}</div></section>
      <section class="artifact-section" id="rules"><h2>Agent rules</h2>${[['Discover first','Search templates, inspect the closest skeleton, then retrieve every component used.'],['No invention','Use only documented import paths, props, variants, and composition patterns.'],['Semantic values','Never add raw hex colors, arbitrary pixel spacing, or inline style objects to product UI.'],['Prototype uncertainty','When product intent is ambiguous, render the smallest option in scratchpad.html and request approval before integration.'],['Validate','Run pnpm lint:eds, typecheck, interaction tests, and accessibility checks before submission.']].map(([title,body])=>`<div class="artifact-rule"><strong>${title}</strong><span>${body}</span></div>`).join('')}</section>
    </main>
  </div>
  <script type="application/json" id="eds-contract">${embeddedContract}</script>
  <script>${standaloneScripts}</script>
</body></html>`;

const scratchpadHtml = `<!doctype html>
<html lang="en" data-eds-theme="edmunds" data-mode="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>EDS scratchpad</title>
<style>@layer reset, eds-foundations, eds-components, app;${tokenCss}${coreCss}${patternCss}${standaloneSharedCss}
.scratch { margin:0 auto; max-width:1100px; padding:clamp(24px,6vw,72px); }
.scratch-banner { background:var(--eds-blue-700); color:white; display:flex; gap:16px; justify-content:space-between; padding:16px; }
.scratch-layout { display:grid; gap:20px; grid-template-columns:280px 1fr; margin-top:20px; min-height:600px; }
.scratch-controls,.scratch-canvas { background:var(--eds-surface-raised); border:1px solid var(--eds-border-default); padding:20px; }
.scratch-controls { display:grid; gap:18px; align-content:start; }
.scratch-controls label { display:grid; font-size:13px; font-weight:700; gap:6px; }
.scratch-controls input,.scratch-controls select { background:var(--eds-surface-raised); border:1px solid var(--eds-border-strong); border-radius:var(--eds-radius-control); color:var(--eds-text-primary); min-height:44px; padding:0 12px; width:100%; }
.scratch-controls .artifact-rule { grid-template-columns:1fr; }
.scratch-canvas { align-items:center; background-image:radial-gradient(var(--eds-border-default) 1px,transparent 1px); background-size:20px 20px; display:flex; justify-content:center; }
.scratch-note { color:var(--eds-text-secondary); font-size:13px; line-height:1.5; }
@media(max-width:720px){.scratch-layout{grid-template-columns:1fr}.scratch-banner{align-items:flex-start;flex-direction:column}}</style></head>
<body><main class="scratch"><header class="scratch-banner"><div><strong>EDS scratchpad</strong><div>Throwaway prototype · not production source</div></div><button class="artifact-mode" data-mode-toggle type="button">Use dark mode</button></header>
<p class="scratch-note">Agents: use this page only to resolve an ambiguous design decision. Keep the prototype small, state the decision being tested, and wait for approval before moving it into product code.</p>
<div class="scratch-layout"><aside class="scratch-controls"><label>Action label<input data-label-control value="Check availability"></label><label>Variant<select data-variant-control><option>primary</option><option>secondary</option><option>tertiary</option><option>destructive</option></select></label><div class="artifact-rule"><strong>Question</strong><span>Which action hierarchy best supports the shopper’s next step?</span></div></aside><section class="scratch-canvas" aria-label="Prototype canvas"><button class="eds-button" data-action-preview data-variant="primary" data-size="md"><span>Check availability</span></button></section></div></main><script>${standaloneScripts}</script></body></html>`;

async function output(path: string, value: string) {
  const absolute = resolve(projectRoot, path);
  await mkdir(dirname(absolute), {recursive: true});
  await writeFile(absolute, value);
}

function renderCodeConnect(doc: ComponentDoc) {
  const {target, nodeUrl} = doc.figma;
  if (!target || !nodeUrl) throw new Error(`${doc.id}: active Figma mapping is incomplete`);
  const declarations = target.properties.map(property => {
    if (property.kind === 'boolean') {
      return `  ${property.propName}: figma.boolean(${JSON.stringify(property.figmaName)}),`;
    }
    if (property.kind === 'string') {
      return `  ${property.propName}: figma.string(${JSON.stringify(property.figmaName)}),`;
    }
    return `  ${property.propName}: figma.enum(${JSON.stringify(property.figmaName)}, ${JSON.stringify(property.mapping ?? {}, null, 2).replaceAll('\n', '\n  ')}),`;
  });
  const props = target.properties.map(property => `${property.propName}={props.${property.propName}}`).join(' ');
  return `// This file is generated. Edit ${doc.source.path} and its component doc instead.\nimport figma from 'figma';\nimport {${target.componentName}} from '${target.importPath}';\n\nfigma.connect(${target.componentName}, ${JSON.stringify(nodeUrl)}, {\n  props: {\n${declarations.join('\n')}\n  },\n  example: props => <${target.componentName} ${props} />,\n});\n`;
}

const codeConnectOutputs = mappedDocs.map(doc =>
  output(`packages/figma/generated/code-connect/${doc.name}.figma.js`, renderCodeConnect(doc)),
);

await Promise.all([
  output('packages/tokens/generated/tokens.css', tokenCss),
  output('packages/tokens/generated/bootstrap.scss', bootstrapScss),
  output('packages/tokens/generated/tokens.json', `${JSON.stringify(tokenExports, null, 2)}\n`),
  output('packages/tokens/generated/token-contracts.json', `${JSON.stringify(tokenContracts, null, 2)}\n`),
  output('packages/tokens/generated/typography.json', `${JSON.stringify(typography, null, 2)}\n`),
  output('generated/typography.json', `${JSON.stringify(typography, null, 2)}\n`),
  output('generated/source-component-contracts.json', `${JSON.stringify(venomComponentContracts, null, 2)}\n`),
  output('packages/tokens/generated/figma-variables.json', `${JSON.stringify(figmaVariables, null, 2)}\n`),
  output('packages/figma/generated/figma-variables.json', `${JSON.stringify(figmaVariables, null, 2)}\n`),
  output('packages/figma/generated/code-connect.json', `${JSON.stringify(codeConnect, null, 2)}\n`),
  ...codeConnectOutputs,
  output('generated/registry.json', `${JSON.stringify(registry, null, 2)}\n`),
  output('generated/golden-examples.json', `${JSON.stringify(goldenExamples, null, 2)}\n`),
  output('generated/token-report.md', `# Token generation report\n\nGenerated ${leaves.size} tokens across CSS, Sass, TypeScript-compatible JSON, and Figma Variables. Sources: ${tokenCounts.eds} EDS foundation tokens, ${tokenCounts.venom} Venom foundation tokens, and ${tokenCounts['venom-component']} Venom component tokens.\n`),
  output('apps/docs/public/design-system.html', designSystemHtml),
  output('apps/docs/public/scratchpad.html', scratchpadHtml),
]);

console.log(`Generated ${outputLeaves.length} unique variables from ${leaves.size} token contracts and ${items.length} registry records.`);
