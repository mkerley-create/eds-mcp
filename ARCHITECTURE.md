# EDS architecture

## Contracts

- DTCG token JSON is the visual source of truth.
- Colocated typed component documentation is the product/API source of truth.
- `generated/registry.json` is a build artifact consumed by docs, CLI, MCP,
  Figma validation, and agent evaluations.
- `design-system.html`, `scratchpad.html`, and `golden-examples.json` are
  generated views of that registry; none is maintained by hand.
- `@edmunds/eds-core` owns the public API. Bootstrap and Venom are adapters.

## One-source pipeline

```text
Venom React + JSON/SCSS ── import-venom ─┐
Typed EDS docs + DTCG tokens ────────────┼─ generated registry (content hash)
                                        ├─ docs / CLI / MCP / agent retrieval
                                        ├─ Figma variables + Code Connect
                                        └─ Venom read-only registry snapshot
```

Venom owns its implementation source. `pnpm venom:import -- --root=/path/to/node-site-venom`
extracts prop contracts and token snapshots; those generated snapshots must not be
edited by hand. EDS-MCP is the sole cross-tool control plane. Venom's
`eds:discover` command consumes the generated registry rather than maintaining an
independent index.

Every component doc names its TypeScript props interface and its Figma mapping
status. Generation fails on code/documentation prop drift. Active mappings emit
Code Connect definitions; `pnpm figma:verify` validates them locally and checks
live Figma nodes/variables when credentials are present.

## Maturity

Components move through `experimental`, `beta`, `stable`, and `deprecated`.
Stable APIs follow semantic versioning. A deprecated API remains documented for
one major version and must include migration guidance.

## CSS order

```css
@layer reset, bootstrap, eds-foundations, eds-components, app-utilities, app-overrides;
```

Applications may add rules to `app-utilities` or `app-overrides`; they must not
patch private `--_eds-*` properties.

## Required checks

Every stable component needs source, tests, a typed documentation record, Figma
mapping, accessible interaction coverage, and at least one example. Registry
generation fails when those contracts disagree.

`pnpm check:generated` regenerates every derived contract and requires a clean
diff. A changed `contentHash` is the explicit signal consumers use to synchronize.
