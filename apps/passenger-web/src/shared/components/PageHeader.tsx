import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {backHref && (
        <Link
          className="mb-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700"
          href={backHref}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
