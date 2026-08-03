import {describe, expect, it} from 'vitest';
import type {Registry} from '@edmunds/eds-docs-schema';
import {getRegistryItem, getSourceComponent, searchRegistry} from './index';

const registry = {
  name: 'Edmunds Design System',
  version: '0.1.0',
  contentHash: `sha256:${'0'.repeat(64)}`,
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
  sourceComponents: [{
    id: 'source-component:EDSButton',
    name: 'EDSButton',
    source: 'node-site-venom',
    sourcePath: 'client/site-modules/edmunds-design-system/components/eds-button/eds-button.jsx',
    implementation: 'React component backed by Reactstrap Button',
    adapter: 'reactstrap',
    props: [{name: 'children', type: 'React.ReactNode', required: true}],
    notes: ['Uses the current Venom prop contract.'],
  }],
} satisfies Registry;

describe('EDS registry search', () => {
  it('finds records by natural-language content', () => {
    expect(searchRegistry(registry, 'vehicle listing')[0]?.id).toBe('template:inventory-results');
  });

  it('retrieves records by stable ID case-insensitively', () => {
    expect(getRegistryItem(registry, 'TEMPLATE:INVENTORY-RESULTS')?.kind).toBe('template');
  });

  it('finds source component contracts separately from canonical records', () => {
    expect(searchRegistry(registry, 'Reactstrap', 'source-component')[0]?.id).toBe('source-component:EDSButton');
    expect(getSourceComponent(registry, 'SOURCE-COMPONENT:EDSButton')?.adapter).toBe('reactstrap');
  });
});
