import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {z} from 'zod';
import type {Registry, RegistryItem} from '@edmunds/eds-docs-schema';

export async function loadRegistry(path = resolve(process.cwd(), 'generated/registry.json')): Promise<Registry> {
  return JSON.parse(await readFile(path, 'utf8')) as Registry;
}

export function searchRegistry(registry: Registry, query: string, kind?: RegistryItem['kind']) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return registry.items
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
}

export function getRegistryItem(registry: Registry, id: string) {
  return registry.items.find(item => item.id.toLowerCase() === id.toLowerCase());
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
        kind: z.enum(['component', 'doc', 'template']).optional(),
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
      if (!item) return {isError: true, content: [{type: 'text', text: `Unknown EDS ID: ${id}`}]};
      return {content: [{type: 'text', text: format === 'dense' ? item.dense : JSON.stringify(item, null, 2)}]};
    },
  );
  return server;
}
