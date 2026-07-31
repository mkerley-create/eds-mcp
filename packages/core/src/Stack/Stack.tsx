import {forwardRef, type CSSProperties, type HTMLAttributes} from 'react';
import {cx} from '../shared';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column';
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  {direction = 'column', gap = 4, align, justify, wrap = false, className, style, ...props},
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cx('eds-stack', className)}
      data-direction={direction}
      data-gap={gap}
      style={{alignItems: align, justifyContent: justify, flexWrap: wrap ? 'wrap' : undefined, ...style}}
    />
  );
});
