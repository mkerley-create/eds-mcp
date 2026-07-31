import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from 'react';
import {cx} from '../shared';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      label,
      icon,
      variant = 'tertiary',
      size = 'md',
      className,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cx('eds-icon-button', className)}
        data-variant={variant}
        data-size={size}>
        {icon}
      </button>
    );
  },
);
