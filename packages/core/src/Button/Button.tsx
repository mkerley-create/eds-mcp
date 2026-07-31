import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import {cx} from '../shared';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children?: ReactNode;
  onAction?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      label,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      startIcon,
      endIcon,
      children,
      className,
      onAction,
      onClick,
      type = 'button',
      ...props
    },
    ref,
  ) {
    const [isPending, setIsPending] = useState(false);
    const busy = isLoading || isPending;

    async function handleClick(event: MouseEvent<HTMLButtonElement>) {
      onClick?.(event);
      if (event.defaultPrevented || !onAction) return;
      const result = onAction(event);
      if (result instanceof Promise) {
        setIsPending(true);
        try {
          await result;
        } finally {
          setIsPending(false);
        }
      }
    }

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={cx('eds-button', className)}
        data-variant={variant}
        data-size={size}
        aria-busy={busy || undefined}
        disabled={isDisabled || busy}
        onClick={handleClick}>
        {busy ? <span className="eds-button__spinner" aria-hidden="true" /> : startIcon}
        <span>{children ?? label}</span>
        {!busy && endIcon}
        {busy && <span className="eds-sr-only" role="status">Loading</span>}
      </button>
    );
  },
);
