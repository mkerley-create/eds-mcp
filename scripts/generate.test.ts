import {readFile} from 'node:fs/promises';
import {describe, expect, it} from 'vitest';
import {registrySchema} from '../packages/docs-schema/src/index';

describe('generated contracts', () => {
  it('emits a valid registry with unique IDs', async () => {
    const registry = registrySchema.parse(JSON.parse(await readFile('generated/registry.json', 'utf8')));
    expect(new Set(registry.items.map(item => item.id)).size).toBe(registry.items.length);
  });

  it('emits code and Figma mappings for documented components', async () => {
    const registry = registrySchema.parse(JSON.parse(await readFile('generated/registry.json', 'utf8')));
    const mappings = JSON.parse(await readFile('packages/figma/generated/code-connect.json', 'utf8')) as Array<{component: string}>;
    expect(mappings.map(item => item.component).sort()).toEqual(
      registry.items.filter(item => item.kind === 'component').map(item => item.name).sort(),
    );
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
