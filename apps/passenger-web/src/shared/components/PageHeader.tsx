import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import clsx from 'clsx';

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
  action,
  compact = false,
}: {
  title?: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
  /** Tighter spacing / type for pages where content below should lead (e.g. search). */
  compact?: boolean;
}) {
  return (
    <header
      className={clsx(
        'flex flex-col',
        compact ? 'mb-3 gap-2 md:mb-4' : 'mb-6 gap-2',
        backHref && 'md:flex-row md:items-start md:justify-between md:gap-6',
      )}
    >
      {backHref && (
        <Link
          className={clsx(
            'inline-flex shrink-0 items-center gap-1 self-start font-medium text-slate-500 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300',
            compact ? 'min-h-[36px] text-sm' : 'min-h-[44px] text-sm',
            'md:mt-1.5',
          )}
          href={backHref}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          {backLabel}
        </Link>
      )}

      <div
        className={clsx(
          'flex min-w-0 flex-col sm:flex-row sm:items-end sm:justify-between',
          compact ? 'gap-2' : 'gap-3',
          backHref && 'md:flex-1 md:justify-end md:text-right',
        )}
      >
        {(title || subtitle) && (
          <div className="min-w-0">
            {title && (
              <h1
                className={clsx(
                  'font-bold tracking-tight text-slate-900 dark:text-slate-100',
                  compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl',
                )}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p
                className={clsx(
                  'text-sm text-slate-500 dark:text-slate-400',
                  compact ? 'mt-0.5 md:mt-1' : 'mt-1.5',
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
