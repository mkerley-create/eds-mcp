import {useState} from 'react';
import {Alert, Heading, Stack} from '@edmunds/eds-core';
import {InventoryFilterBar, VehicleCard} from '@edmunds/eds-patterns';

const vehicles = [
  {year: 2023, make: 'Honda', model: 'CR-V', trim: 'EX-L AWD', price: 28990, mileage: 18420},
  {year: 2024, make: 'Toyota', model: 'RAV4', trim: 'XLE', price: 31750, mileage: 9200},
];

export default function InventoryResultsPage() {
  const [query, setQuery] = useState('');
  return (
    <main>
      <Stack gap={5}>
        <Heading level={1} size="title">SUVs near you</Heading>
        <InventoryFilterBar
          query={query}
          resultCount={vehicles.length}
          onQueryChange={setQuery}
          onOpenFilters={() => {}}
        />
        <Alert title="Prices include dealer-provided fees" status="info">
          Taxes and registration are calculated separately.
        </Alert>
        <div className="inventory-grid">
          {vehicles.map(vehicle => <VehicleCard key={`${vehicle.year}-${vehicle.model}`} {...vehicle} />)}
        </div>
      </Stack>
    </main>
  );
}
