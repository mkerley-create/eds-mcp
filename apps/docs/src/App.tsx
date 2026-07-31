import {useEffect, useMemo, useState} from 'react';
import {Button, Card, Heading, SearchInput, Stack, Text, TextField} from '@edmunds/eds-core';
import {VehicleCard} from '@edmunds/eds-patterns';
import registry from '../../../generated/registry.json';
import tokenValues from '../../../packages/tokens/generated/tokens.json';
import type {ComponentDoc, ReferenceDoc, Registry, RegistryItem, TemplateDoc} from '@edmunds/eds-docs-schema';

type Section = 'home' | 'components' | 'foundations' | 'guides' | 'patterns' | 'templates' | 'figma' | 'playground';

const registryData = registry as unknown as Registry;
const components = registryData.items.filter((item): item is ComponentDoc => item.kind === 'component');
const docs = registryData.items.filter((item): item is ReferenceDoc => item.kind === 'doc');
const templates = registryData.items.filter((item): item is TemplateDoc => item.kind === 'template');

function routeFromHash(): {section: Section; id?: string} {
  const value = window.location.hash.replace('#/', '');
  if (!value) return {section: 'home'};
  const [section, ...rest] = value.split('/');
  const id = rest.join('/');
  return id ? {section: section as Section, id} : {section: section as Section};
}

function NavLink({section, children}: {section: Section; children: React.ReactNode}) {
  return <a href={`#/${section}`}>{children}</a>;
}

function Code({children}: {children: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-block">
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(children);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        }}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre><code>{children}</code></pre>
    </div>
  );
}

function StatusPill({value}: {value: string}) {
  return <span className="status-pill" data-status={value}>{value}</span>;
}

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero__copy">
          <Text size="caption" tone="inverse">EDS 0.1 · PRIVATE BETA</Text>
          <Heading level={1} size="display">Build the car-shopping journey once.</Heading>
          <Text as="p" size="large" tone="inverse">
            One system for product teams, Figma, and the agents shipping alongside them.
          </Text>
          <Stack direction="row" gap={3} wrap>
            <a className="hero-link hero-link--primary" href="#/guides/doc:getting-started">Start building</a>
            <a className="hero-link" href="#/components">Browse components</a>
          </Stack>
          <div className="hero__telemetry" aria-label="System coverage">
            <span><strong>{components.length}</strong> documented components</span>
            <span><strong>{templates.length}</strong> production template</span>
            <span><strong>2</strong> MCP tools</span>
          </div>
        </div>
        <div className="hero__specimen">
          <div className="specimen-label"><span>LIVE SPECIMEN</span><span>360 px</span></div>
          <VehicleCard
            year={2023}
            make="Honda"
            model="CR-V"
            trim="EX-L AWD"
            price={28990}
            monthlyPayment={472}
            mileage={18420}
            dealLabel="Great price"
            location="Santa Monica, CA"
          />
        </div>
      </section>

      <section className="system-map" aria-labelledby="system-map-title">
        <div>
          <Text size="caption" tone="secondary">ONE CONTRACT · SIX OUTPUTS</Text>
          <Heading level={2} size="title" id="system-map-title">A design system agents can read.</Heading>
        </div>
        <div className="system-map__rail">
          {['DTCG tokens', 'Typed docs', 'Registry', 'Docs', 'CLI', 'MCP', 'Figma'].map((label, index) => (
            <div key={label} className="rail-stop">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="start-grid">
        <Card className="start-card start-card--wide" padding="lg">
          <Text size="caption" tone="secondary">QUICK START WITH AI</Text>
          <Heading level={2} size="section">Give your agent the installed contract.</Heading>
          <Text as="p" tone="secondary">
            Initialization writes a versioned EDS block without replacing existing project instructions.
          </Text>
          <Code>{`pnpm add @edmunds/eds-core @edmunds/eds-theme-edmunds @edmunds/eds-cli\npnpm eds init`}</Code>
          <Stack direction="row" gap={4} wrap>
            <a href="/design-system.html">Open living artifact →</a>
            <a href="/scratchpad.html">Open scratchpad →</a>
          </Stack>
        </Card>
        <Card className="start-card" padding="lg">
          <Text size="caption" tone="secondary">FOR DESIGNERS</Text>
          <Heading level={2} size="section">Variables match code.</Heading>
          <Text as="p" tone="secondary">DTCG tokens generate Figma collections, modes, and Code Connect records.</Text>
          <a href="#/figma">Review Figma parity →</a>
        </Card>
        <Card className="start-card" padding="lg">
          <Text size="caption" tone="secondary">FOR BUILDERS</Text>
          <Heading level={2} size="section">Bootstrap compatible.</Heading>
          <Text as="p" tone="secondary">EDS owns the API while explicit cascade layers preserve Venom migration paths.</Text>
          <a href="#/guides/doc:migration">Read migration guidance →</a>
        </Card>
      </section>
    </div>
  );
}

function ComponentList({query}: {query: string}) {
  const filtered = components.filter(item =>
    `${item.name} ${item.category} ${item.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <PageIntro eyebrow="LIBRARY" title="Components" description="Typed, accessible building blocks with Edmunds-owned APIs.">
      <div className="component-grid">
        {filtered.map(component => (
          <a className="component-tile" href={`#/components/${component.id}`} key={component.id}>
            <div className="component-tile__preview">
              {component.name === 'Button' && <Button label="Save vehicle" variant="primary" />}
              {component.name === 'TextField' && <TextField label="ZIP code" placeholder="90404" />}
              {component.name === 'VehicleCard' && <div className="mini-car" aria-hidden="true" />}
            </div>
            <div>
              <Stack direction="row" justify="space-between" align="center">
                <Heading level={2} size="subsection">{component.displayName}</Heading>
                <StatusPill value={component.maturity} />
              </Stack>
              <Text as="p" tone="secondary">{component.description}</Text>
              <Text size="caption" tone="secondary">{component.importPath}</Text>
            </div>
          </a>
        ))}
      </div>
    </PageIntro>
  );
}

function ComponentDetail({doc}: {doc: ComponentDoc}) {
  return (
    <PageIntro eyebrow={`${doc.category.toUpperCase()} · ${doc.version}`} title={doc.displayName} description={doc.description}>
      <Stack direction="row" gap={2} align="center"><StatusPill value={doc.maturity} /><Text size="caption">{doc.importPath}</Text></Stack>
      <section className="detail-section">
        <Heading level={2} size="section">Preview</Heading>
        <div className="detail-preview">
          {doc.name === 'Button' && <Stack direction="row" gap={3} wrap>{(['primary', 'secondary', 'tertiary', 'destructive'] as const).map(variant => <Button key={variant} label={variant} variant={variant} />)}</Stack>}
          {doc.name === 'TextField' && <div className="field-examples"><TextField label="ZIP code" placeholder="90404" /><TextField label="Email" defaultValue="shopper@example.com" errorMessage="Enter a valid email address." /></div>}
          {doc.name === 'VehicleCard' && <div className="vehicle-preview"><VehicleCard year={2023} make="Honda" model="CR-V" trim="EX-L AWD" price={28990} monthlyPayment={472} mileage={18420} dealLabel="Great price" location="Santa Monica, CA" /></div>}
        </div>
      </section>
      <section className="detail-section">
        <Heading level={2} size="section">Properties</Heading>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Property</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>{doc.props.map(prop => <tr key={prop.name}><td><code>{prop.name}{prop.required ? '*' : ''}</code></td><td><code>{prop.type}</code></td><td>{prop.default ?? '—'}</td><td>{prop.description}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="detail-columns">
        <div>
          <Heading level={2} size="section">Use it well</Heading>
          {doc.bestPractices.map(item => <div className="practice" data-type={item.type} key={item.description}><strong>{item.type === 'do' ? 'Do' : "Don't"}</strong><span>{item.description}</span></div>)}
        </div>
        <div>
          <Heading level={2} size="section">Accessibility</Heading>
          <ul>{doc.accessibility.map(item => <li key={item}>{item}</li>)}</ul>
          <Heading level={3} size="subsection">Keyboard</Heading>
          <ul>{doc.keyboard.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>
      <section className="detail-section">
        <Heading level={2} size="section">Example</Heading>
        <Text as="p" tone="secondary">{doc.examples[0]?.description}</Text>
        <Code>{doc.examples[0]?.code ?? ''}</Code>
      </section>
    </PageIntro>
  );
}

function DocDetail({doc}: {doc: ReferenceDoc}) {
  return (
    <PageIntro eyebrow={doc.category.toUpperCase()} title={doc.title} description={doc.description}>
      {doc.sections.map(section => (
        <section className="detail-section prose-section" key={section.title}>
          <Heading level={2} size="section">{section.title}</Heading>
          <Text as="p" tone="secondary">{section.body}</Text>
          {section.code && <Code>{section.code}</Code>}
        </section>
      ))}
    </PageIntro>
  );
}

function DocsList({category}: {category: ReferenceDoc['category']}) {
  const matches = docs.filter(doc => doc.category === category);
  return (
    <PageIntro
      eyebrow={category === 'guide' ? 'MAKE THE SYSTEM WORK' : 'VISUAL CONTRACT'}
      title={category === 'guide' ? 'Guides' : 'Foundations'}
      description={category === 'guide' ? 'Adopt EDS consistently across product, design, and agent workflows.' : 'The shared visual decisions behind every Edmunds experience.'}>
      <div className="doc-list">{matches.map(doc => <a href={`#/${category === 'guide' ? 'guides' : 'foundations'}/${doc.id}`} key={doc.id}><Heading level={2} size="subsection">{doc.title}</Heading><Text as="p" tone="secondary">{doc.description}</Text><span>Read guide →</span></a>)}</div>
    </PageIntro>
  );
}

function Templates() {
  return (
    <PageIntro eyebrow="PRODUCTION STARTERS" title="Templates" description="Copyable page structures built from verified EDS contracts.">
      {templates.map(template => (
        <Card className="template-card" padding="lg" key={template.id}>
          <div>
            <Stack direction="row" gap={2} align="center"><StatusPill value={template.maturity} /><Text size="caption">{template.category}</Text></Stack>
            <Heading level={2} size="section">{template.name}</Heading>
            <Text as="p" tone="secondary">{template.description}</Text>
            <Code>eds template inventory-results --write --out=src/pages/InventoryResultsPage.tsx</Code>
          </div>
          <pre className="skeleton">{template.skeleton}</pre>
        </Card>
      ))}
    </PageIntro>
  );
}

function FigmaPage() {
  return (
    <PageIntro eyebrow="DESIGN ↔ CODE" title="Figma parity" description="Variables and component mappings are generated from the same EDS release contract.">
      <div className="parity-grid">
        <Card padding="lg"><Text size="caption" tone="secondary">VARIABLES</Text><strong>{Object.keys(tokenValues).length}</strong><Text as="p" tone="secondary">generated CSS and Figma values</Text></Card>
        <Card padding="lg"><Text size="caption" tone="secondary">MODES</Text><strong>3</strong><Text as="p" tone="secondary">Light, dark, high contrast</Text></Card>
        <Card padding="lg"><Text size="caption" tone="secondary">CODE CONNECT</Text><strong>{components.length}</strong><Text as="p" tone="secondary">records pending Figma component keys</Text></Card>
      </div>
      <section className="detail-section">
        <Heading level={2} size="section">Release contract</Heading>
        <div className="table-wrap"><table><thead><tr><th>Component</th><th>Import</th><th>Figma</th></tr></thead><tbody>{components.map(component => <tr key={component.id}><td>{component.displayName}</td><td><code>{component.importPath}</code></td><td><StatusPill value={component.figma.status} /></td></tr>)}</tbody></table></div>
      </section>
    </PageIntro>
  );
}

function Playground() {
  const [variant, setVariant] = useState<'primary' | 'secondary' | 'tertiary' | 'destructive'>('primary');
  const [label, setLabel] = useState('Check availability');
  const [saved, setSaved] = useState(false);
  return (
    <PageIntro eyebrow="INTERACTIVE WORKSHOP" title="Playground" description="Exercise real component state against the current theme.">
      <div className="playground">
        <aside>
          <TextField label="Button label" value={label} onChange={event => setLabel(event.currentTarget.value)} />
          <label className="native-label">Variant<select value={variant} onChange={event => setVariant(event.currentTarget.value as typeof variant)}><option>primary</option><option>secondary</option><option>tertiary</option><option>destructive</option></select></label>
        </aside>
        <div className="playground__canvas">
          <Button label={label || 'Action'} variant={variant} />
          <div className="vehicle-preview"><VehicleCard year={2024} make="Toyota" model="RAV4" trim="XLE" price={31750} mileage={9200} dealLabel="Fair price" location="Culver City, CA" isSaved={saved} onSave={() => setSaved(value => !value)} /></div>
        </div>
      </div>
    </PageIntro>
  );
}

function PageIntro({eyebrow, title, description, children}: {eyebrow: string; title: string; description: string; children: React.ReactNode}) {
  return <div className="content-page"><header className="page-intro"><Text size="caption" tone="secondary">{eyebrow}</Text><Heading level={1} size="title">{title}</Heading><Text as="p" size="large" tone="secondary">{description}</Text></header>{children}</div>;
}

export function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const listener = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  const current = useMemo(() => {
    if (!route.id) return undefined;
    return registryData.items.find((item: RegistryItem) => item.id === route.id);
  }, [route]);

  return (
    <div className="docs-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <a className="brand" href="#/"><span className="brand__mark">E</span><span>Edmunds <small>Design System</small></span></a>
        <nav aria-label="Primary">
          <NavLink section="components">Components</NavLink>
          <NavLink section="patterns">Patterns</NavLink>
          <NavLink section="templates">Templates</NavLink>
          <NavLink section="figma">Figma</NavLink>
          <NavLink section="playground">Playground</NavLink>
        </nav>
        <button className="mode-toggle" type="button" onClick={() => setMode(value => value === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>{mode === 'light' ? '◐' : '◑'}</button>
      </header>
      <aside className="sidebar">
        <SearchInput label="Search EDS" isLabelHidden placeholder="Search components…" value={query} onChange={event => setQuery(event.currentTarget.value)} />
        <nav aria-label="Documentation">
          <div><span>START</span><a href="#/guides/doc:getting-started">Getting started</a><a href="#/guides/doc:principles">Principles</a></div>
          <div><span>BUILD</span><a href="#/components">Components</a><a href="#/patterns">Automotive patterns</a><a href="#/templates">Templates</a><a href="#/playground">Playground</a></div>
          <div><span>FOUNDATIONS</span><a href="#/foundations/doc:tokens">Design tokens</a><a href="#/guides/doc:accessibility">Accessibility</a></div>
          <div><span>OPERATE</span><a href="#/guides/doc:migration">Venom migration</a><a href="#/guides/doc:working-with-ai">Working with AI</a><a href="#/figma">Figma parity</a></div>
        </nav>
        <div className="sidebar__version"><span>EDS</span><strong>0.1.0</strong><StatusPill value="beta" /></div>
      </aside>
      <main id="main">
        {route.section === 'home' && <Home />}
        {route.section === 'components' && (current?.kind === 'component' ? <ComponentDetail doc={current as ComponentDoc} /> : <ComponentList query={query} />)}
        {route.section === 'foundations' && (current?.kind === 'doc' ? <DocDetail doc={current as ReferenceDoc} /> : <DocsList category="foundation" />)}
        {route.section === 'guides' && (current?.kind === 'doc' ? <DocDetail doc={current as ReferenceDoc} /> : <DocsList category="guide" />)}
        {route.section === 'patterns' && <ComponentList query={query || 'Automotive'} />}
        {route.section === 'templates' && <Templates />}
        {route.section === 'figma' && <FigmaPage />}
        {route.section === 'playground' && <Playground />}
      </main>
    </div>
  );
}
