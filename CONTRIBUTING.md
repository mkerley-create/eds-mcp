# Contributing to EDS

## Before implementation

1. Link the product problem and at least two real Edmunds use cases.
2. Confirm the capability belongs in foundations, core, patterns, or templates.
3. Record accessibility, responsive, Venom, analytics, and Figma requirements.
4. For a new public API, include alternatives considered and migration impact.

## Definition of done

- Public React types follow EDS naming conventions.
- Component behavior has interaction and accessibility tests.
- A colocated typed documentation record describes usage, props, anatomy,
  keyboard behavior, theming, examples, Figma mapping, and dense agent context.
- DTCG tokens are used instead of raw product values.
- The generated registry, docs portal, CLI, MCP, and Figma outputs agree.
- Stable changes include a changeset, release note, and codemod when safe.

## Review ownership

Core changes require design-system engineering, product design, and
accessibility review. Automotive patterns also require review by the owning
consumer-product team. AI-generated contributions follow the same review path.
