import {defineTemplateDoc} from '@edmunds/eds-docs-schema';

export const inventoryResultsTemplate = defineTemplateDoc({
  kind: 'template',
  id: 'template:inventory-results',
  name: 'Inventory results',
  category: 'Vehicle shopping',
  description: 'Responsive search results with query controls, filters, count, and comparable vehicle cards.',
  components: ['InventoryFilterBar', 'VehicleCard', 'Heading', 'Stack', 'Alert'],
  sourcePath: 'packages/templates/source/InventoryResultsPage.tsx',
  skeleton: `InventoryResultsPage
├── page heading + saved-search action
├── InventoryFilterBar
├── optional status Alert
└── results grid
    └── VehicleCard × n`,
  maturity: 'beta',
  dense: 'Inventory results template: heading, filter bar, optional alert, responsive VehicleCard grid.',
});
