# EDS architecture

## Contracts

- DTCG token JSON is the visual source of truth.
- Colocated typed component documentation is the product/API source of truth.
- `generated/registry.json` is a build artifact consumed by docs, CLI, MCP,
  Figma validation, and agent evaluations.
- `design-system.html`, `scratchpad.html`, and `golden-examples.json` are
  generated views of that registry; none is maintained by hand.
- `@edmunds/eds-core` owns the public API. Bootstrap and Venom are adapters.

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
