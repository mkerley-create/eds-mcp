import {Button, type ButtonProps, type ButtonSize, type ButtonVariant} from '@edmunds/eds-core/Button';
import type {ElementType, MouseEvent, ReactNode} from 'react';

export type VenomButtonType = 'primary-1' | 'secondary-1' | 'primary-2' | 'secondary-2';
export type VenomButtonSize = 'small' | 'medium' | 'large';
export type VenomButtonStyle = 'squared' | 'rounded' | 'circular';

const typeToVariant: Record<VenomButtonType, ButtonVariant> = {
  'primary-1': 'primary',
  'secondary-1': 'secondary',
  'primary-2': 'primary',
  'secondary-2': 'secondary',
};

const sizeToButtonSize: Record<VenomButtonSize, ButtonSize> = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
};

export function venomButtonTypeToVariant(type: VenomButtonType): ButtonVariant {
  return typeToVariant[type];
}

export interface EDSButtonProps
  extends Omit<ButtonProps, 'children' | 'label' | 'variant' | 'size' | 'isDisabled' | 'startIcon' | 'endIcon' | 'className' | 'onClick' | 'onAction' | 'type' | 'style'> {
  children?: ReactNode;
  tag?: ElementType;
  href?: string;
  className?: string;
  hideLabel?: boolean;
  isDisabled?: boolean;
  iconName?: string;
  iconPosition?: 'left' | 'right';
  type?: VenomButtonType;
  size?: VenomButtonSize;
  style?: VenomButtonStyle;
  isFluid?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
}

function Icon({name}: {name: string}) {
  return <span className={`eds-icon icon-${name}`} aria-hidden="true" />;
}

export function EDSButton({
  children,
  tag,
  href,
  className,
  hideLabel = false,
  isDisabled = false,
  iconName,
  iconPosition = 'left',
  type = 'primary-1',
  size = 'medium',
  style = 'squared',
  isFluid = false,
  onClick,
  ...props
}: EDSButtonProps) {
  const content = (
    <>
      {iconPosition === 'left' && iconName && <Icon name={iconName} />}
      {!hideLabel && <span className="eds-button-text">{children}</span>}
      {iconPosition === 'right' && iconName && <Icon name={iconName} />}
    </>
  );
  const adapterClassName = [
    'eds-venom-button',
    `eds-venom-button--${style}`,
    isFluid && 'eds-venom-button--fluid',
    className,
  ].filter(Boolean).join(' ');
  const variant = venomButtonTypeToVariant(type);
  const buttonSize = sizeToButtonSize[size];

  if (href || (tag && tag !== 'button')) {
    const Link = tag ?? 'a';
    return (
      <Link
        {...props}
        href={href}
        className={`eds-button ${adapterClassName}`}
        data-variant={variant}
        data-size={buttonSize}
        data-venom-type={type}
        aria-disabled={isDisabled || undefined}
        data-disabled={isDisabled || undefined}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <Button
      {...props}
      className={adapterClassName}
      label={hideLabel ? '' : typeof children === 'string' ? children : 'EDS action'}
      variant={variant}
      size={buttonSize}
      isDisabled={isDisabled}
      startIcon={iconPosition === 'left' && iconName ? <Icon name={iconName} /> : undefined}
      endIcon={iconPosition === 'right' && iconName ? <Icon name={iconName} /> : undefined}
      data-venom-type={type}
      onClick={onClick as ButtonProps['onClick']}
    >
      {hideLabel ? undefined : children}
    </Button>
  );
}
