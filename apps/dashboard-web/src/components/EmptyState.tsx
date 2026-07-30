import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Inbox, type LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
