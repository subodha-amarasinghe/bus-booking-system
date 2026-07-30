import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

export function AlertBanner({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success';
  children: ReactNode;
}) {
  const Icon = tone === 'success' ? CircleCheck : CircleAlert;
  return (
    <p
      className={tone === 'success' ? 'ui-alert-success' : 'ui-alert-error'}
      role={tone === 'success' ? 'status' : 'alert'}
    >
      <span className="flex items-start gap-2">
        <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{children}</span>
      </span>
    </p>
  );
}
