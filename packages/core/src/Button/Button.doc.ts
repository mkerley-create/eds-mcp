import {defineComponentDoc} from '@edmunds/eds-docs-schema';

export const buttonDoc = defineComponentDoc({
  kind: 'component',
  id: 'component:Button',
  name: 'Button',
  displayName: 'Button',
  package: '@edmunds/eds-core',
  importPath: '@edmunds/eds-core/Button',
  version: '0.1.0',
  maturity: 'beta',
  category: 'Actions',
  keywords: ['button', 'action', 'submit', 'cta', 'loading'],
  description:
    'Button starts an immediate action such as saving a vehicle, applying a filter, or submitting a lead.',
  whenNotToUse:
    'Use Link when the interaction only navigates to another location.',
  props: [
    {name: 'label', type: 'string', required: true, description: 'Visible text and accessible name.'},
    {name: 'variant', type: "'primary' | 'secondary' | 'tertiary' | 'destructive'", default: "'secondary'", description: 'Semantic action emphasis.'},
    {name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Control density.'},
    {name: 'isLoading', type: 'boolean', default: 'false', description: 'Shows progress and prevents duplicate activation.'},
    {name: 'isDisabled', type: 'boolean', default: 'false', description: 'Prevents interaction.'},
    {name: 'onAction', type: '(event) => void | Promise<void>', description: 'Action callback with automatic async progress.'},
  ],
  anatomy: ['Container', 'Start icon', 'Action label', 'End icon', 'Progress indicator'],
  accessibility: [
    'Uses a native button and defaults type to button.',
    'Async actions expose aria-busy and a polite loading announcement.',
  ],
  keyboard: ['Enter or Space activates the button.'],
  bestPractices: [
    {type: 'do', description: 'Use one primary action per decision area.'},
    {type: 'do', description: 'Use a verb that names the result, such as Save vehicle.'},
    {type: 'dont', description: 'Use destructive styling for reversible actions.'},
  ],
  examples: [
    {
      name: 'Save vehicle',
      description: 'Primary action on a vehicle card.',
      code: '<Button label="Save vehicle" variant="primary" onAction={saveVehicle} />',
    },
  ],
  responsive: 'Labels remain visible. Use the sm size only in space-constrained toolbars.',
  theming: {
    className: 'eds-button',
    tokens: ['--eds-action-primary', '--eds-action-primary-hover', '--eds-radius-control'],
  },
  related: ['IconButton', 'Link'],
  figma: {
    componentKey: 'pending:Button',
    nodeUrl: 'https://www.figma.com/file/EDS/Edmunds-Design-System',
    status: 'pending',
  },
  dense: 'Button action trigger. import @edmunds/eds-core/Button. label required; variants primary|secondary|tertiary|destructive; async onAction manages loading.',
});
