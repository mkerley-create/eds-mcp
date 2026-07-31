import {forwardRef, useId, type InputHTMLAttributes, type ReactNode} from 'react';
import {cx} from '../shared';

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  isLabelHidden?: boolean;
  description?: string;
  errorMessage?: string;
  startContent?: ReactNode;
  endContent?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      isLabelHidden = false,
      description,
      errorMessage,
      startContent,
      endContent,
      size = 'md',
      className,
      id: providedId,
      required,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = errorMessage ? `${id}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cx('eds-field', className)} data-size={size} data-invalid={errorMessage ? 'true' : undefined}>
        <label className={isLabelHidden ? 'eds-sr-only' : 'eds-field__label'} htmlFor={id}>
          {label}{required && <span aria-hidden="true"> *</span>}
        </label>
        {description && <span id={descriptionId} className="eds-field__description">{description}</span>}
        <div className="eds-field__control">
          {startContent}
          <input
            {...props}
            ref={ref}
            id={id}
            required={required}
            aria-invalid={Boolean(errorMessage) || undefined}
            aria-describedby={describedBy}
          />
          {endContent}
        </div>
        {errorMessage && <span id={errorId} className="eds-field__error">{errorMessage}</span>}
      </div>
    );
  },
);
