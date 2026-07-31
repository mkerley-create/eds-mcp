export interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({label = 'Loading', size = 'md'}: SpinnerProps) {
  return (
    <span className="eds-spinner" data-size={size} role="status">
      <span aria-hidden="true" />
      <span className="eds-sr-only">{label}</span>
    </span>
  );
}
