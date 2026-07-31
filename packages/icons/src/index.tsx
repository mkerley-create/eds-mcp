import type {SVGProps} from 'react';

export type IconName = 'car' | 'heart' | 'search' | 'filter' | 'chevronRight';

const paths: Record<IconName, string> = {
  car: 'M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5v5h-2v-2H5v2H3v-5Zm3.2-3h11.6l-1-2H7.2l-1 2ZM7 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  heart: 'M12 21s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.2-8 11-8 11Z',
  search: 'm20 20-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  filter: 'M4 6h16M7 12h10m-7 6h4',
  chevronRight: 'm9 5 7 7-7 7',
};

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  label?: string;
  size?: number;
}

export function Icon({name, label, size = 20, ...props}: IconProps) {
  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === 'car' || name === 'heart' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}>
      <path d={paths[name]} />
    </svg>
  );
}
