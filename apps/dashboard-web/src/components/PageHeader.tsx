import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:flex">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        ) : null}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
