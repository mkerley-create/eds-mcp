import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {EDSButton, venomButtonTypeToVariant} from './EDSButton';

describe('EDSButton Venom adapter', () => {
  it('maps Venom variants and sizes to the canonical Button contract', () => {
    render(<EDSButton type="secondary-2" size="large">Compare</EDSButton>);
    const button = screen.getByRole('button', {name: 'Compare'});
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button).toHaveAttribute('data-venom-type', 'secondary-2');
    expect(button).toHaveClass('eds-venom-button--squared');
    expect(venomButtonTypeToVariant('primary-2')).toBe('primary');
  });

  it('preserves Venom icons, fluid mode, and hidden labels', () => {
    render(<EDSButton aria-label="Save vehicle" iconName="plus3" iconPosition="left" isFluid hideLabel>Save</EDSButton>);
    const button = screen.getByRole('button', {name: 'Save vehicle'});
    expect(button).toHaveClass('eds-venom-button--fluid');
    expect(button.querySelector('.icon-plus3')).toBeTruthy();
    expect(button).not.toHaveTextContent('Save');
  });

  it('renders href actions as links and preserves disabled semantics', () => {
    render(<EDSButton href="/details" isDisabled style="rounded">View details</EDSButton>);
    const link = screen.getByRole('link', {name: 'View details'});
    expect(link).toHaveAttribute('href', '/details');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveClass('eds-venom-button--rounded');
  });

  it('preserves the green primary-2 variant for token-backed styling', () => {
    render(<EDSButton type="primary-2">Confirm</EDSButton>);
    expect(screen.getByRole('button', {name: 'Confirm'})).toHaveAttribute('data-venom-type', 'primary-2');
  });
});
