import {describe, expect, it} from 'vitest';
import type {Registry} from '@edmunds/eds-docs-schema';
import {getRegistryItem, searchRegistry} from './index';

const registry = {
  name: 'Edmunds Design System',
  version: '0.1.0',
  generatedAt: new Date(0).toISOString(),
  items: [{
    kind: 'template',
    id: 'template:inventory-results',
    name: 'Inventory results',
    category: 'Vehicle shopping',
    description: 'Vehicle listing page.',
    components: ['VehicleCard'],
    sourcePath: 'source.tsx',
    skeleton: 'Page > VehicleCard',
    maturity: 'beta',
    dense: 'inventory template',
  }],
} satisfies Registry;

describe('EDS registry search', () => {
  it('finds records by natural-language content', () => {
    expect(searchRegistry(registry, 'vehicle listing')[0]?.id).toBe('template:inventory-results');
  });

  it('retrieves records by stable ID case-insensitively', () => {
    expect(getRegistryItem(registry, 'TEMPLATE:INVENTORY-RESULTS')?.kind).toBe('template');
  });
});
