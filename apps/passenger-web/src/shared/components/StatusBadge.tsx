import clsx from 'clsx';

/**
 * Booking, trip, payment and refund statuses all share one visual language so
 * a passenger learns the colours once.
 */
const TONES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  SUCCEEDED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  LOCKED: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  BOARDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200',
  EXPIRED: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  UNAVAILABLE: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  SCHEDULED: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
  IN_PROGRESS: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
  REFUNDED: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200',
  AVAILABLE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  BOOKED: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'ui-badge',
        TONES[status] ?? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        className,
      )}
    >
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}
