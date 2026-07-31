export type EDSDataAttributes = {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export interface EDSBaseProps extends EDSDataAttributes {
  className?: string;
  id?: string;
}

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
