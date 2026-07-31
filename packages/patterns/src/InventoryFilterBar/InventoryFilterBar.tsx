import {Button} from '@edmunds/eds-core/Button';
import {SearchInput} from '@edmunds/eds-core/SearchInput';
import {Stack} from '@edmunds/eds-core/Stack';

export interface InventoryFilterBarProps {
  query: string;
  resultCount: number;
  activeFilterCount?: number;
  onQueryChange: (query: string) => void;
  onOpenFilters: () => void;
}

export function InventoryFilterBar({
  query,
  resultCount,
  activeFilterCount = 0,
  onQueryChange,
  onOpenFilters,
}: InventoryFilterBarProps) {
  return (
    <div className="eds-inventory-filter-bar" aria-label="Inventory controls">
      <SearchInput
        label="Search make or model"
        isLabelHidden
        value={query}
        onChange={event => onQueryChange(event.currentTarget.value)}
      />
      <Stack direction="row" gap={3} align="center">
        <span aria-live="polite">{resultCount.toLocaleString()} vehicles</span>
        <Button
          label={activeFilterCount ? `Filters, ${activeFilterCount} active` : 'Filters'}
          variant="secondary"
          onAction={onOpenFilters}
        />
      </Stack>
    </div>
  );
}
