import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Heading, Text} from './Typography';

describe('Typography', () => {
  it('keeps document hierarchy independent from visual hierarchy', () => {
    render(<Heading level={2} variant="display-small">Inventory</Heading>);
    const heading = screen.getByRole('heading', {level: 2, name: 'Inventory'});
    expect(heading).toHaveClass('eds-type-display-small');
    expect(heading).toHaveAttribute('data-typography', 'display-small');
  });

  it('maps legacy sizes to semantic variants during migration', () => {
    render(<Text size="caption">Updated today</Text>);
    expect(screen.getByText('Updated today')).toHaveClass('eds-type-detail-medium');
  });
});
