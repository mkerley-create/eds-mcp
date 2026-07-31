import {Button} from '@edmunds/eds-core/Button';
import {Card} from '@edmunds/eds-core/Card';
import {Stack} from '@edmunds/eds-core/Stack';
import {Heading, Text} from '@edmunds/eds-core/Typography';

export interface VehicleCardProps {
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  monthlyPayment?: number;
  mileage?: number;
  imageUrl?: string;
  imageAlt?: string;
  dealLabel?: string;
  location?: string;
  isSaved?: boolean;
  onSave?: () => void;
  onViewDetails?: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMileage(value: number) {
  return `${new Intl.NumberFormat('en-US').format(value)} mi`;
}

export function VehicleCard({
  year,
  make,
  model,
  trim,
  price,
  monthlyPayment,
  mileage,
  imageUrl,
  imageAlt = '',
  dealLabel,
  location,
  isSaved = false,
  onSave,
  onViewDetails,
}: VehicleCardProps) {
  const name = `${year} ${make} ${model}`;
  return (
    <Card as="article" className="eds-vehicle-card" padding="none">
      <div className="eds-vehicle-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} />
        ) : (
          <div className="eds-vehicle-card__silhouette" role="img" aria-label="Vehicle photo unavailable">
            <span aria-hidden="true" />
          </div>
        )}
        {dealLabel && <span className="eds-vehicle-card__deal">{dealLabel}</span>}
        <button
          type="button"
          className="eds-vehicle-card__save"
          aria-label={isSaved ? `Remove ${name} from saved vehicles` : `Save ${name}`}
          aria-pressed={isSaved}
          onClick={onSave}>
          {isSaved ? '♥' : '♡'}
        </button>
      </div>
      <Stack gap={3} className="eds-vehicle-card__content">
        <div>
          <Text as="div" size="caption" tone="secondary">{trim ?? 'Available now'}</Text>
          <Heading level={3} size="subsection">{name}</Heading>
        </div>
        <div className="eds-vehicle-card__price-row">
          <strong className="eds-vehicle-card__price">{formatCurrency(price)}</strong>
          {monthlyPayment && <Text size="caption" tone="secondary">Est. {formatCurrency(monthlyPayment)}/mo</Text>}
        </div>
        <Stack direction="row" gap={3} wrap>
          {mileage !== undefined && <Text size="caption">{formatMileage(mileage)}</Text>}
          {location && <Text size="caption">{location}</Text>}
        </Stack>
        <Button label="View details" variant="primary" onAction={onViewDetails} />
      </Stack>
    </Card>
  );
}
