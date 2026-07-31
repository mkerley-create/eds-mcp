import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {TextField} from './TextField';

describe('TextField', () => {
  it('associates label, help, and error content', () => {
    render(<TextField label="ZIP code" description="Used to find nearby vehicles." errorMessage="Enter five digits." />);
    const field = screen.getByRole('textbox', {name: 'ZIP code'});
    expect(field).toHaveAccessibleDescription('Used to find nearby vehicles. Enter five digits.');
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });
});
