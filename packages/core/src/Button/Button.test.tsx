import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {Button} from './Button';

describe('Button', () => {
  it('uses a native button with an accessible name', () => {
    render(<Button label="Save vehicle" />);
    expect(screen.getByRole('button', {name: 'Save vehicle'})).toHaveAttribute('type', 'button');
  });

  it('manages async action progress', async () => {
    let finish: (() => void) | undefined;
    const action = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const user = userEvent.setup();
    render(<Button label="Check availability" onAction={action} />);
    await user.click(screen.getByRole('button', {name: 'Check availability'}));
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    finish?.();
    await screen.findByRole('button', {name: 'Check availability'});
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
