import {type ElementType, type HTMLAttributes, type ReactNode} from 'react';
import {cx} from '../shared';

export type HeadingVariant =
  | 'display-large'
  | 'display-small'
  | 'headline-large'
  | 'headline-medium'
  | 'headline-small'
  | 'title-large'
  | 'title-medium'
  | 'title-small';

export type TextVariant =
  | 'title-large'
  | 'title-medium'
  | 'title-small'
  | 'body-large'
  | 'body-medium'
  | 'body-small'
  | 'detail-large'
  | 'detail-medium'
  | 'detail-small';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: HeadingVariant;
  /** @deprecated Use variant. Maintained during the typography migration. */
  size?: 'display' | 'title' | 'section' | 'subsection';
  children: ReactNode;
}

const legacyHeadingVariants = {
  display: 'display-large',
  title: 'headline-large',
  section: 'headline-small',
  subsection: 'title-large',
} as const;

export function Heading({level, variant, size = 'section', className, ...props}: HeadingProps) {
  const Element = `h${level}` as ElementType;
  const typography = variant ?? legacyHeadingVariants[size];
  return <Element {...props} className={cx('eds-heading', `eds-type-${typography}`, className)} data-size={size} data-typography={typography} />;
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'div';
  tone?: 'primary' | 'secondary' | 'inverse' | 'success' | 'danger';
  variant?: TextVariant;
  /** @deprecated Use variant. Maintained during the typography migration. */
  size?: 'caption' | 'body' | 'large';
}

const legacyTextVariants = {
  caption: 'detail-medium',
  body: 'body-large',
  large: 'title-large',
} as const;

export function Text({as: Element = 'span', tone = 'primary', variant, size = 'body', className, ...props}: TextProps) {
  const typography = variant ?? legacyTextVariants[size];
  return <Element {...props} className={cx('eds-text', `eds-type-${typography}`, className)} data-tone={tone} data-size={size} data-typography={typography} />;
}
