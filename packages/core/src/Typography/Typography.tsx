import {type ElementType, type HTMLAttributes, type ReactNode} from 'react';
import {cx} from '../shared';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'display' | 'title' | 'section' | 'subsection';
  children: ReactNode;
}

export function Heading({level, size = 'section', className, ...props}: HeadingProps) {
  const Element = `h${level}` as ElementType;
  return <Element {...props} className={cx('eds-heading', className)} data-size={size} />;
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div';
  tone?: 'primary' | 'secondary' | 'inverse' | 'success' | 'danger';
  size?: 'caption' | 'body' | 'large';
}

export function Text({as: Element = 'span', tone = 'primary', size = 'body', className, ...props}: TextProps) {
  return <Element {...props} className={cx('eds-text', className)} data-tone={tone} data-size={size} />;
}
