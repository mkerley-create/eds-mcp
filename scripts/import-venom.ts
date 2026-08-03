import {execFile} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import ts from 'typescript';
import {sourceComponentContractSchema, type SourceComponentContract} from '../packages/docs-schema/src/index';

const execFileAsync = promisify(execFile);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootArgument = process.argv.find(argument => argument.startsWith('--root='))?.slice('--root='.length);
const venomRoot = resolve(rootArgument ?? process.env.VENOM_REPO_PATH ?? '');
const checkOnly = process.argv.includes('--check');

if (!rootArgument && !process.env.VENOM_REPO_PATH) {
  throw new Error('Provide --root=/path/to/node-site-venom or set VENOM_REPO_PATH.');
}

type ComponentDescriptor = Omit<SourceComponentContract, 'props' | 'figma'> & {
  figmaDefinitionPath?: string;
};

const components: ComponentDescriptor[] = [
  {
    id: 'source-component:EDSButton',
    name: 'EDSButton',
    source: 'node-site-venom',
    sourcePath: 'client/site-modules/edmunds-design-system/components/eds-button/eds-button.jsx',
    implementation: 'React component backed by Reactstrap Button',
    adapter: 'reactstrap',
    adapterPackage: '@edmunds/eds-venom-adapter',
    canonicalComponent: '@edmunds/eds-core/Button',
    notes: [
      'Renders an anchor when href is provided, otherwise a button.',
      'Disabled anchors expose aria-disabled and data-disabled instead of native disabled behavior.',
      'The public EDS contract owns the API; Reactstrap is an implementation detail.',
      'Import @edmunds/eds-venom-adapter/styles.css after @edmunds/eds-core/styles.css for exact numbered-variant styling.',
    ],
    figmaDefinitionPath:
      'client/site-modules/edmunds-design-system/components/eds-button/eds-button.figma.js',
  },
  {
    id: 'source-component:EDSTextInput',
    name: 'EDSTextInput',
    source: 'node-site-venom',
    sourcePath: 'client/site-modules/edmunds-design-system/components/text-input/eds-text-input.jsx',
    implementation: 'Controlled visual input with EDSLabel and status messaging',
    notes: [
      'The status prop controls disabled, success, warning, and error presentation.',
      'Nested labels change the effective input size to small.',
      'Use the source contract when migrating Venom forms; the canonical EDS TextField API may differ.',
    ],
  },
  {
    id: 'source-component:EDSDropdown',
    name: 'EDSDropdown',
    source: 'node-site-venom',
    sourcePath: 'client/site-modules/edmunds-design-system/components/dropdown/eds-dropdown.jsx',
    implementation: 'Native select with EDSLabel, status messaging, and rich option presentation',
    notes: [
      'Options support primary, secondary, and highlighted display text while rendering a native select.',
      'The selected option determines whether nested labels and compact sizing are used.',
      'The control composes EDSLabel and EDSDropdownLabel internally.',
    ],
  },
  {
    id: 'source-component:EDSLabel',
    name: 'EDSLabel',
    source: 'node-site-venom',
    sourcePath: 'client/site-modules/edmunds-design-system/components/label/eds-label.jsx',
    implementation: 'Native label with optional, required, nested, and icon affordances',
    notes: [
      'Always associate the label with a control through isFor.',
      'Use one required indicator mode per field to avoid duplicate announcements.',
      'Text input and dropdown source contracts compose this label.',
    ],
  },
];

function findAssignedObject(sourceFile: ts.SourceFile, componentName: string, propertyName: string) {
  let result: ts.ObjectLiteralExpression | undefined;
  function visit(node: ts.Node) {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.expression.getText(sourceFile) === componentName &&
      node.left.name.text === propertyName &&
      ts.isObjectLiteralExpression(node.right)
    ) {
      result = node.right;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return result;
}

function propertyName(property: ts.ObjectLiteralElementLike) {
  if (!('name' in property) || !property.name) return undefined;
  return ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
    ? property.name.text
    : property.name.getText();
}

function propType(expression: ts.Expression): {type: string; required: boolean} {
  if (ts.isPropertyAccessExpression(expression) && expression.name.text === 'isRequired') {
    const nested = propType(expression.expression);
    return {...nested, required: true};
  }
  if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression)) {
    const method = expression.expression.name.text;
    const firstArgument = expression.arguments[0];
    if (method === 'oneOf' && firstArgument && ts.isArrayLiteralExpression(firstArgument)) {
      return {
        type: firstArgument.elements.map(element => element.getText()).join(' | '),
        required: false,
      };
    }
    if (method === 'oneOfType' && firstArgument && ts.isArrayLiteralExpression(firstArgument)) {
      return {
        type: firstArgument.elements.map(element => propType(element as ts.Expression).type).join(' | '),
        required: false,
      };
    }
    if (method === 'arrayOf' && firstArgument) {
      return {type: `Array<${propType(firstArgument).type}>`, required: false};
    }
    if (method === 'shape') return {type: 'object', required: false};
  }
  const names: Record<string, string> = {
    'PropTypes.any': 'unknown',
    'PropTypes.array': 'unknown[]',
    'PropTypes.bool': 'boolean',
    'PropTypes.element': 'React.ReactElement',
    'PropTypes.elementType': 'React.ElementType',
    'PropTypes.func': '(...args: unknown[]) => unknown',
    'PropTypes.node': 'React.ReactNode',
    'PropTypes.number': 'number',
    'PropTypes.object': 'object',
    'PropTypes.string': 'string',
  };
  return {type: names[expression.getText()] ?? expression.getText(), required: false};
}

async function extractContract(descriptor: ComponentDescriptor): Promise<SourceComponentContract> {
  const absolutePath = resolve(venomRoot, descriptor.sourcePath);
  const source = await readFile(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(absolutePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const propTypes = findAssignedObject(sourceFile, descriptor.name, 'propTypes');
  const defaults = findAssignedObject(sourceFile, descriptor.name, 'defaultProps');
  if (!propTypes) throw new Error(`${descriptor.name}.propTypes was not found in ${descriptor.sourcePath}`);

  const defaultValues = new Map(
    defaults?.properties.flatMap(property => {
      const name = propertyName(property);
      return name && ts.isPropertyAssignment(property) ? [[name, property.initializer.getText(sourceFile)] as const] : [];
    }) ?? [],
  );
  const props = propTypes.properties.flatMap(property => {
    const name = propertyName(property);
    if (!name || !ts.isPropertyAssignment(property)) return [];
    const contract = propType(property.initializer);
    return [{
      name,
      type: contract.type,
      ...(contract.required ? {required: true} : {}),
      ...(defaultValues.has(name) ? {default: defaultValues.get(name)!} : {}),
    }];
  });

  let figma: SourceComponentContract['figma'];
  if (descriptor.figmaDefinitionPath) {
    const definition = await readFile(resolve(venomRoot, descriptor.figmaDefinitionPath), 'utf8');
    const nodeUrl = definition.match(/^\/\/ url=(.+)$/m)?.[1];
    const match = nodeUrl?.match(/figma\.com\/(?:design|file)\/([^/]+)\/[^?]+\?node-id=(\d+)-(\d+)/);
    if (!nodeUrl || !match) throw new Error(`Portable Figma URL was not found in ${descriptor.figmaDefinitionPath}`);
    figma = {
      fileKey: match[1]!,
      nodeId: `${match[2]}:${match[3]}`,
      nodeUrl,
      status: 'mapped',
    };
  }

  const {figmaDefinitionPath: _figmaDefinitionPath, ...base} = descriptor;
  return sourceComponentContractSchema.parse({...base, props, ...(figma ? {figma} : {})});
}

async function normalizedJson(path: string) {
  return `${JSON.stringify(JSON.parse(await readFile(path, 'utf8')), null, 2)}\n`;
}

async function writeOrCheck(path: string, value: string) {
  if (checkOnly) {
    const current = await readFile(path, 'utf8').catch(() => '');
    if (current !== value) throw new Error(`Venom snapshot is stale: ${path}`);
    return;
  }
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, value);
}

const contracts = await Promise.all(components.map(extractContract));
const {stdout: sourceCommit} = await execFileAsync('git', ['rev-parse', 'HEAD'], {cwd: venomRoot});
const {stdout: sourceRemote} = await execFileAsync('git', ['config', '--get', 'remote.origin.url'], {cwd: venomRoot});
const foundationSource = resolve(
  venomRoot,
  'client/site-modules/edmunds-design-system/eds-design-tokens.json',
);
const componentSource = resolve(
  venomRoot,
  'client/site-modules/edmunds-design-system/eds-component-tokens.json',
);

await Promise.all([
  writeOrCheck(
    resolve(projectRoot, 'packages/tokens/src/venom.tokens.json'),
    await normalizedJson(foundationSource),
  ),
  writeOrCheck(
    resolve(projectRoot, 'packages/tokens/src/venom.component.tokens.json'),
    await normalizedJson(componentSource),
  ),
  writeOrCheck(
    resolve(projectRoot, 'packages/venom-adapter/generated/source-contracts.json'),
    `${JSON.stringify(contracts, null, 2)}\n`,
  ),
  writeOrCheck(
    resolve(projectRoot, 'packages/venom-adapter/generated/source-manifest.json'),
    `${JSON.stringify({
      source: 'node-site-venom',
      remote: sourceRemote.trim(),
      commit: sourceCommit.trim(),
      contracts: contracts.map(contract => ({id: contract.id, sourcePath: contract.sourcePath})),
    }, null, 2)}\n`,
  ),
]);

console.log(`${checkOnly ? 'Verified' : 'Imported'} ${contracts.length} Venom contracts from ${sourceCommit.trim()}.`);
