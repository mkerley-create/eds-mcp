import {type HTMLAttributes, type ReactNode} from 'react';
import {cx} from '../shared';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  status?: 'info' | 'success' | 'warning' | 'danger';
  action?: ReactNode;
}

export function Alert({title, status = 'info', action, className, children, ...props}: AlertProps) {
  return (
    <div {...props} className={cx('eds-alert', className)} data-status={status} role={status === 'danger' ? 'alert' : 'status'}>
      <div><strong>{title}</strong>{children && <div>{children}</div>}</div>
      {action}
    </div>
  );
}
