import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const token = process.env.FIGMA_ACCESS_TOKEN;
const requireCompleteParity = process.env.FIGMA_REQUIRE_COMPLETE_PARITY === '1';
const variableFileKey = process.env.FIGMA_VARIABLE_FILE_KEY;

interface Mapping {
  component: string;
  fileKey: string;
  nodeId: string;
  nodeUrl: string;
  status: 'mapped' | 'adapter-mapped';
  target: {componentName: string; importPath: string; sourcePath: string};
}
interface VariableExport {
  collections: Array<{
    name: string;
    modes: string[];
    variables: Array<{name: string; valuesByMode: Record<string, unknown>}>;
  }>;
}

const mappings = JSON.parse(await readFile(
  resolve(projectRoot, 'packages/figma/generated/code-connect.json'),
  'utf8',
)) as Mapping[];
const variables = JSON.parse(await readFile(
  resolve(projectRoot, 'packages/figma/generated/figma-variables.json'),
  'utf8',
)) as VariableExport;

for (const mapping of mappings) {
  if (!mapping.component || !mapping.fileKey || !/^\d+:\d+$/.test(mapping.nodeId) || !mapping.nodeUrl) {
    throw new Error(`Invalid generated Code Connect mapping: ${JSON.stringify(mapping)}`);
  }
}

for (const collection of variables.collections) {
  for (const variable of collection.variables) {
    const missingModes = collection.modes.filter(mode => !(mode in variable.valuesByMode));
    if (missingModes.length) throw new Error(`${variable.name} is missing modes: ${missingModes.join(', ')}`);
  }
}

async function figma(path: string) {
  const response = await fetch(`https://api.figma.com/v1${path}`, {headers: {'X-Figma-Token': token!}});
  if (!response.ok) throw new Error(`Figma ${response.status} for ${path}: ${await response.text()}`);
  return response.json() as Promise<Record<string, unknown>>;
}

if (!token) {
  console.log(`Verified ${mappings.length} Code Connect mappings and ${variables.collections.flatMap(item => item.variables).length} generated variables locally. Live parity skipped because FIGMA_ACCESS_TOKEN is not set.`);
  process.exit(0);
}

for (const mapping of mappings) {
  const result = await figma(`/files/${mapping.fileKey}/nodes?ids=${encodeURIComponent(mapping.nodeId)}`);
  const nodes = result.nodes as Record<string, unknown> | undefined;
  if (!nodes?.[mapping.nodeId]) throw new Error(`${mapping.component}: Figma node ${mapping.nodeId} does not exist`);
}

if (variableFileKey) {
  const result = await figma(`/files/${variableFileKey}/variables/local`);
  const meta = result.meta as {variables?: Record<string, {name: string}>} | undefined;
  const liveNames = new Set(Object.values(meta?.variables ?? {}).map(variable => variable.name));
  const generatedNames = variables.collections.flatMap(collection => collection.variables.map(variable => variable.name));
  const missing = generatedNames.filter(name => !liveNames.has(name));
  if (missing.length && requireCompleteParity) {
    throw new Error(`${missing.length} generated variables are absent from Figma: ${missing.slice(0, 20).join(', ')}`);
  }
  console.log(`Figma variable parity: ${generatedNames.length - missing.length}/${generatedNames.length} names matched${missing.length ? `; ${missing.length} missing` : ''}.`);
} else if (requireCompleteParity) {
  throw new Error('FIGMA_VARIABLE_FILE_KEY is required when FIGMA_REQUIRE_COMPLETE_PARITY=1.');
}

console.log(`Verified ${mappings.length} live Figma component nodes.`);
