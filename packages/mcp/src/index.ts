import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import type {Registry, RegistryItem, SourceComponentContract} from '@edmunds/eds-docs-schema';

export async function loadRegistry(path = resolve(process.cwd(), 'generated/registry.json')): Promise<Registry> {
  return JSON.parse(await readFile(path, 'utf8')) as Registry;
}

type SearchKind = RegistryItem['kind'] | 'source-component';
type SearchResult = {id: string; kind: SearchKind; name: string; description: string};

export function searchRegistry(registry: Registry, query: string, kind?: SearchKind): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const itemResults = registry.items
    .filter(item => !kind || item.kind === kind)
    .map(item => {
      const haystack = JSON.stringify(item).toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return {item, score};
    })
    .filter(result => result.score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({item}) => ({
      id: item.id,
      kind: item.kind,
      name: 'title' in item ? item.title : item.name,
      description: item.description,
    }));
  const sourceResults = (registry.sourceComponents ?? [])
    .filter(contract => !kind || kind === 'source-component')
    .map(contract => ({
      id: contract.id,
      kind: 'source-component' as const,
      name: contract.name,
      description: contract.implementation,
      contract,
    }))
    .filter(result => terms.length === 0 || terms.every(term => JSON.stringify(result.contract).toLowerCase().includes(term)))
    .map(({contract, ...result}) => result);

  return [...itemResults, ...sourceResults].slice(0, 20);
}

export function getRegistryItem(registry: Registry, id: string) {
  return registry.items.find(item => item.id.toLowerCase() === id.toLowerCase());
}

export function getSourceComponent(registry: Registry, id: string): SourceComponentContract | undefined {
  return (registry.sourceComponents ?? []).find(contract => contract.id.toLowerCase() === id.toLowerCase());
}

export async function createEdsMcpServer(registryPath?: string) {
  const registry = await loadRegistry(registryPath);
  const server = new McpServer({name: 'edmunds-design-system', version: registry.version});

  server.registerTool(
    'search',
    {
      title: 'Search EDS',
      description: 'Search components, guides, foundations, and templates in the installed EDS registry.',
      inputSchema: {
        query: z.string().describe('Natural-language query such as vehicle result or validation input.'),
        kind: z.enum(['component', 'doc', 'template', 'source-component']).optional(),
      },
    },
    async ({query, kind}) => {
      const results = searchRegistry(registry, query, kind);
      return {
        content: [{type: 'text', text: JSON.stringify(results, null, 2)}],
        structuredContent: {results},
      };
    },
  );

  server.registerTool(
    'get',
    {
      title: 'Get EDS record',
      description: 'Retrieve the authoritative versioned record by stable ID.',
      inputSchema: {
      id: z.string().describe('Stable ID such as component:Button or template:inventory-results.'),
        format: z.enum(['full', 'dense']).default('full'),
      },
    },
    async ({id, format}) => {
      const item = getRegistryItem(registry, id);
      const sourceComponent = getSourceComponent(registry, id);
      if (!item && !sourceComponent) return {isError: true, content: [{type: 'text', text: `Unknown EDS ID: ${id}`}]};
      if (sourceComponent) {
        const dense = `${sourceComponent.name} from node-site-venom. Props: ${sourceComponent.props.map(prop => `${prop.name}${prop.required ? '*' : ''}: ${prop.type}`).join('; ')}.`;
        return {content: [{type: 'text', text: format === 'dense' ? dense : JSON.stringify(sourceComponent, null, 2)}]};
      }
      return {content: [{type: 'text', text: format === 'dense' ? item!.dense : JSON.stringify(item, null, 2)}]};
    },
  );
  return server;
}
