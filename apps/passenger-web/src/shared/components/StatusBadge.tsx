import clsx from 'clsx';

/**
 * Booking, trip, payment and refund statuses all share one visual language so
 * a passenger learns the colours once.
 */
const TONES: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  SUCCEEDED: 'bg-emerald-100 text-emerald-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  LOCKED: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-amber-100 text-amber-800',
  BOARDING: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-rose-100 text-rose-700',
  FAILED: 'bg-rose-100 text-rose-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  EXPIRED: 'bg-slate-200 text-slate-600',
  UNAVAILABLE: 'bg-slate-200 text-slate-600',
  SCHEDULED: 'bg-brand-100 text-brand-800',
  IN_PROGRESS: 'bg-brand-100 text-brand-800',
  REFUNDED: 'bg-brand-100 text-brand-800',
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  BOOKED: 'bg-slate-200 text-slate-600',
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
        TONES[status] ?? 'bg-slate-200 text-slate-600',
        className,
      )}
    >
      {status.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}
