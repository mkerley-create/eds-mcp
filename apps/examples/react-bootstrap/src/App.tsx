import '@edmunds/eds-bootstrap-adapter/bootstrap-bridge.css';
import {Button, Heading, Stack} from '@edmunds/eds-core';

export function App() {
  return (
    <main className="container py-5" data-eds-theme="edmunds" data-bootstrap-version="5.3.8">
      <Stack gap={4}>
        <Heading level={1} size="title">Bootstrap host example</Heading>
        <div className="row">
          <div className="col-md-6"><Button label="Check availability" variant="primary" /></div>
        </div>
      </Stack>
    </main>
  );
}
