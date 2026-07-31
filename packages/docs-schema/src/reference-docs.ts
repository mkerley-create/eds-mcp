import {defineReferenceDoc} from './index';

export const gettingStartedDoc = defineReferenceDoc({
  kind: 'doc',
  id: 'doc:getting-started',
  title: 'Getting started',
  category: 'guide',
  description: 'Add EDS to a React, Bootstrap, or Venom project and give agents the same reference.',
  sections: [
    {
      title: 'Quick start with AI',
      body: 'Paste this into your coding agent. It installs EDS and writes version-matched project guidance without replacing your instructions.',
      code: 'Install @edmunds/eds-core, @edmunds/eds-theme-edmunds, @edmunds/eds-bootstrap-adapter, and @edmunds/eds-cli. Run `eds init`, then read the managed EDS block in AGENTS.md.',
    },
    {
      title: 'Install',
      body: 'Install the component package, Edmunds theme, Bootstrap compatibility layer, and CLI.',
      code: 'pnpm add @edmunds/eds-core @edmunds/eds-theme-edmunds @edmunds/eds-bootstrap-adapter bootstrap\npnpm add -D @edmunds/eds-cli',
    },
    {
      title: 'Add CSS in contract order',
      body: 'The bridge imports Bootstrap and EDS into explicit cascade layers. App utilities and overrides remain above the system.',
      code: '@layer reset, bootstrap, eds-foundations, eds-components, app-utilities, app-overrides;\n@import "@edmunds/eds-bootstrap-adapter/bootstrap-bridge.css";',
    },
    {
      title: 'Add your first component',
      body: 'Use per-component entry points so imports remain predictable for people, bundlers, and agents.',
      code: 'import {Button} from "@edmunds/eds-core/Button";\n\n<Button label="Save vehicle" variant="primary" />',
    },
    {
      title: 'Explore',
      body: 'Use the CLI before authoring a screen: inspect a related template, then retrieve each component contract.',
      code: 'eds template --list\neds template inventory-results --skeleton\neds component VehicleCard --dense\neds golden VehicleCard\neds docs tokens',
    },
    {
      title: 'Open the living artifacts',
      body: 'design-system.html is the portable visual contract and embeds the current registry. scratchpad.html is a throwaway interactive surface for resolving ambiguous design decisions before product integration.',
      code: 'open apps/docs/public/design-system.html\nopen apps/docs/public/scratchpad.html',
    },
  ],
  dense: 'Install core/theme/bootstrap-adapter/cli; run eds init; import bridge CSS; use per-component imports; inspect templates then component docs.',
});

export const principlesDoc = defineReferenceDoc({
  kind: 'doc',
  id: 'doc:principles',
  title: 'Principles',
  category: 'guide',
  description: 'The product promises that guide EDS decisions.',
  sections: [
    {title: 'Comparable by default', body: 'Vehicle identity, price, mileage, and dealer facts occupy consistent positions so shoppers can compare without relearning the interface.'},
    {title: 'Guidance over lock-in', body: 'EDS owns accessible behavior and semantic APIs. Teams retain controlled composition and documented CSS escape hatches.'},
    {title: 'One reference', body: 'The website, Figma mapping, CLI, agent files, and MCP are generated from the installed component and token contracts.'},
    {title: 'Earned by use', body: 'A component becomes stable only after real product use, accessibility review, and human plus agent evaluation.'},
  ],
  dense: 'Principles: comparable by default; guidance over lock-in; one generated reference; stability earned through use and evaluation.',
});

export const tokensDoc = defineReferenceDoc({
  kind: 'doc',
  id: 'doc:tokens',
  title: 'Design tokens',
  category: 'foundation',
  description: 'DTCG primitives and semantic roles shared by code and Figma.',
  sections: [
    {title: 'Use semantic roles', body: 'Build product UI with surface, text, action, status, price, and border roles. Primitive ramps are inputs to the theme rather than app-level choices.'},
    {title: 'Generated outputs', body: 'One token source produces CSS custom properties, TypeScript, Bootstrap Sass variables, registry data, and Figma Variables.'},
    {title: 'Modes', body: 'Light is the default. Dark and high-contrast modes override semantic roles without changing component source.'},
  ],
  dense: 'DTCG tokens generate CSS/TS/Sass/Figma. Apps use semantic --eds-* roles, not primitive colors. Modes override semantics.',
});

export const accessibilityDoc = defineReferenceDoc({
  kind: 'doc',
  id: 'doc:accessibility',
  title: 'Accessibility',
  category: 'guide',
  description: 'WCAG 2.2 AA behavior is part of every stable component contract.',
  sections: [
    {title: 'Native first', body: 'Prefer native controls and landmarks. Custom behavior must preserve semantics, accessible names, focus order, and keyboard operation.'},
    {title: 'State is communicated', body: 'Loading, error, selected, expanded, and saved states are exposed programmatically and never rely on color alone.'},
    {title: 'Release gate', body: 'Stable components require automated axe coverage, keyboard scenarios, zoom and reduced-motion review, and manual assistive-technology checks.'},
  ],
  dense: 'WCAG 2.2 AA: native first; expose all states; stable requires axe, keyboard, zoom, reduced motion, and manual AT review.',
});

export const workingWithAiDoc = defineReferenceDoc({
  kind: 'doc',
  id: 'doc:working-with-ai',
  title: 'Working with AI',
  category: 'guide',
  description: 'Make agents retrieve installed EDS contracts before generating UI.',
  sections: [
    {title: 'Required workflow', body: 'Search templates, inspect the closest skeleton, then retrieve documentation for every component used.'},
    {title: 'Dense output', body: 'All read commands accept --dense for a compact, version-specific contract that fits agent context windows.'},
    {title: 'Golden examples', body: 'Use `eds golden <Name>` as the primary composition reference after retrieving the component contract. Golden examples are generated from the same typed documentation.'},
    {title: 'Interactive uncertainty', body: 'When product intent is ambiguous, build the smallest option in scratchpad.html, state the decision being tested, and wait for approval before integrating it.'},
    {title: 'Fail fast', body: 'Run `pnpm lint:eds` before type checking. It rejects hardcoded colors, inline style objects, and direct React-Bootstrap or Bootstrap behavior imports in product and template source.'},
    {title: 'MCP', body: 'The authenticated MCP provides search and get over the same registry as the CLI and documentation portal.'},
  ],
  dense: 'Agents: template --list; template NAME --skeleton; component NAME --dense; golden NAME. Ambiguity goes to scratchpad.html. Run lint:eds. MCP search/get serves the same registry.',
});

export const migrationDoc = defineReferenceDoc({
  kind: 'doc',
  id: 'doc:migration',
  title: 'Venom and Bootstrap migration',
  category: 'guide',
  description: 'Introduce EDS one route at a time without changing product behavior.',
  sections: [
    {title: 'Layer first', body: 'Load Bootstrap and EDS in explicit layers before replacing controls. Verify a smoke page with Button, TextField, Card, and VehicleCard.'},
    {title: 'Migrate in product slices', body: 'Apply tokens and shell, then replace shared controls and automotive compositions, then complete routes.'},
    {title: 'Keep behavior intact', body: 'Do not mix the visual migration with changes to routing, data fetching, analytics, SEO, or business rules.'},
  ],
  dense: 'Venom migration: establish layers; smoke-test foundations; migrate shell then controls/patterns then routes; preserve business behavior.',
});

export const referenceDocs = [
  gettingStartedDoc,
  principlesDoc,
  tokensDoc,
  accessibilityDoc,
  workingWithAiDoc,
  migrationDoc,
];
