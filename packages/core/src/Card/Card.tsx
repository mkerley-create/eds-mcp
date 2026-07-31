import {forwardRef, type HTMLAttributes} from 'react';
import {cx} from '../shared';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  variant?: 'outlined' | 'raised' | 'quiet';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  {as: Element = 'div', variant = 'outlined', padding = 'md', className, ...props},
  ref,
) {
  return (
    <Element
      {...props}
      ref={ref as never}
      className={cx('eds-card', className)}
      data-variant={variant}
      data-padding={padding}
    />
  );
});
