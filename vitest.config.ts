import {defineConfig} from 'vitest/config';
import {resolve} from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@edmunds/eds-docs-schema': resolve(__dirname, 'packages/docs-schema/src/index.ts'),
      '@edmunds/eds-tokens': resolve(__dirname, 'packages/tokens/src/index.ts'),
      '@edmunds/eds-core/Button': resolve(__dirname, 'packages/core/src/Button/index.ts'),
      '@edmunds/eds-core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@edmunds/eds-patterns': resolve(__dirname, 'packages/patterns/src/index.ts'),
      '@edmunds/eds-venom-adapter': resolve(__dirname, 'packages/venom-adapter/src/index.ts'),
      '@edmunds/eds-templates': resolve(__dirname, 'packages/templates/src/index.ts'),
      '@edmunds/eds-mcp': resolve(__dirname, 'packages/mcp/src/index.ts')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html']
    }
  }
});
