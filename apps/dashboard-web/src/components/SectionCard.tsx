import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

type SectionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  className,
  children,
}: SectionCardProps) {
  return (
    <section className={clsx('ui-card', className)}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2.5">
          {Icon ? (
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
          ) : null}
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
