import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-card flex flex-col items-center gap-3 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </span>
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
