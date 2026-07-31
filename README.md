# Edmunds Design System

EDS is a React-first, Bootstrap-compatible design system for Edmunds consumer
experiences. Its typed registry is the source for the documentation portal,
CLI, templates, Figma exports, agent instructions, and MCP tools.

## Start

```bash
corepack pnpm install
pnpm generate
pnpm dev
```

Useful commands:

```bash
pnpm eds component Button
pnpm eds golden Button
pnpm eds docs getting-started
pnpm eds template --list
pnpm mcp
pnpm check
```

Generated agent-native artifacts:

- `apps/docs/public/design-system.html` — standalone living visual contract with
  an embedded machine-readable registry.
- `apps/docs/public/scratchpad.html` — interactive throwaway prototype surface.
- `generated/golden-examples.json` — canonical component and template examples.
- `generated/registry.json` — source for the docs, CLI, MCP, and agent context.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for package boundaries and contribution
rules.
