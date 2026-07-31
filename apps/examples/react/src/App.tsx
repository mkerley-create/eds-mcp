import '@edmunds/eds-theme-edmunds/theme.css';
import '@edmunds/eds-core/styles.css';
import '@edmunds/eds-patterns/styles.css';
import {Heading, Stack} from '@edmunds/eds-core';
import {VehicleCard} from '@edmunds/eds-patterns';

export function App() {
  return (
    <main data-eds-theme="edmunds">
      <Stack gap={5}>
        <Heading level={1} size="title">Saved vehicles</Heading>
        <VehicleCard year={2023} make="Honda" model="CR-V" price={28990} mileage={18420} />
      </Stack>
    </main>
  );
}
