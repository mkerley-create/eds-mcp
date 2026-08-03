import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import {registrySchema} from '../packages/docs-schema/src/index';

describe('generated contracts', () => {
  it('emits a valid registry with unique IDs', async () => {
    const registry = registrySchema.parse(JSON.parse(await readFile('generated/registry.json', 'utf8')));
    expect(new Set(registry.items.map(item => item.id)).size).toBe(registry.items.length);
    expect(registry.sourceComponents).toHaveLength(4);
    expect(registry.sourceComponents.map(component => component.name)).toEqual([
      'EDSButton',
      'EDSTextInput',
      'EDSDropdown',
      'EDSLabel',
    ]);
  });

  it('emits code and Figma mappings for documented components', async () => {
    const registry = registrySchema.parse(JSON.parse(await readFile('generated/registry.json', 'utf8')));
    const mappings = JSON.parse(await readFile('packages/figma/generated/code-connect.json', 'utf8')) as Array<{component: string}>;
    expect(mappings.map(item => item.component).sort()).toEqual(
      registry.items
        .flatMap(item => item.kind === 'component' && item.figma.status !== 'pending' ? [item.name] : [])
        .sort(),
    );
  });

  it('preserves Venom token names in generated contracts', async () => {
    const contracts = JSON.parse(await readFile('packages/tokens/generated/token-contracts.json', 'utf8')) as Array<{
      source: string;
      sourceName?: string;
      cssVariable: string;
      value: string;
    }>;
    const venom = contracts.filter(token => token.source === 'venom');
    const venomButton = contracts.filter(token => token.source === 'venom-component');

    expect(contracts.length).toBeGreaterThan(600);
    expect(venom.length).toBeGreaterThan(300);
    expect(venomButton.length).toBeGreaterThan(250);
    expect(venom.find(token => token.sourceName === 'eds-color-blue-03')).toMatchObject({
      cssVariable: '--eds-color-blue-03',
    });
    expect(venom.find(token => token.sourceName === 'eds-font-size-md')).toBeDefined();
    expect(venomButton.find(token => token.sourceName === 'eds-comp-shared-btn-color-bg-primary-2-default')).toMatchObject({
      cssVariable: '--eds-comp-shared-btn-color-bg-primary-2-default',
      value: '#1a854a',
    });
  });

  it('emits the constrained semantic typography scale', async () => {
    const typography = JSON.parse(await readFile('generated/typography.json', 'utf8')) as {
      styles: Array<{id: string; cssClass: string; properties: Record<string, {value: string; cssVariable: string}>}>;
    };
    const css = await readFile('packages/tokens/generated/tokens.css', 'utf8');
    expect(typography.styles).toHaveLength(14);
    expect(typography.styles.find(style => style.id === 'typography:display-medium')).toBeUndefined();
    expect(typography.styles.find(style => style.id === 'typography:display-large')).toMatchObject({
      cssClass: 'eds-type-display-large',
      properties: {
        fontFamily: {value: 'Helvetica Neue, Helvetica, Arial, sans-serif'},
        fontSize: {value: '3.5rem'},
        fontWeight: {value: '700'},
      },
    });
    expect(css).toContain('.eds-type-body-large');
    expect(css).toContain('font-family: var(--eds-typography-body-large-font-family)');
  });

  it('emits living HTML artifacts and golden examples from the same version', async () => {
    const registry = registrySchema.parse(JSON.parse(await readFile('generated/registry.json', 'utf8')));
    const golden = JSON.parse(await readFile('generated/golden-examples.json', 'utf8')) as {
      version: string;
      components: Array<{id: string}>;
    };
    const artifact = await readFile('apps/docs/public/design-system.html', 'utf8');
    const scratchpad = await readFile('apps/docs/public/scratchpad.html', 'utf8');
    expect(golden.version).toBe(registry.version);
    expect(golden.components.map(item => item.id).sort()).toEqual(
      registry.items.filter(item => item.kind === 'component').map(item => item.id).sort(),
    );
    expect(artifact).toContain(`meta name="eds-version" content="${registry.version}"`);
    expect(artifact).toContain('id="eds-contract"');
    expect(scratchpad).toContain('Throwaway prototype · not production source');
  });
});
