import clsx from 'clsx';

type Tone = 'positive' | 'pending' | 'negative' | 'info' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  positive: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  negative: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  info: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
};

const STATUS_TONES: Record<string, Tone> = {
  ACTIVE: 'positive',
  APPROVED: 'positive',
  COMPLETED: 'positive',
  CONFIRMED: 'positive',
  SCHEDULED: 'positive',
  SUCCEEDED: 'positive',
  AVAILABLE: 'positive',
  BOARDING: 'pending',
  IN_PROGRESS: 'pending',
  LOCKED: 'pending',
  PENDING: 'pending',
  CANCELLED: 'negative',
  EXPIRED: 'negative',
  FAILED: 'negative',
  INACTIVE: 'negative',
  REJECTED: 'negative',
  UNAVAILABLE: 'negative',
  ADMIN_STAFF: 'info',
  CUSTOMER_STAFF: 'info',
  REFUNDED: 'info',
  PASSENGER: 'neutral',
};

function humanize(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type StatusBadgeProps = {
  status: string;
  tone?: Tone;
  label?: string;
  className?: string;
};

export function StatusBadge({
  status,
  tone,
  label,
  className,
}: StatusBadgeProps) {
  const resolved = tone ?? STATUS_TONES[status.toUpperCase()] ?? 'neutral';
  return (
    <span className={clsx('ui-badge', TONE_CLASSES[resolved], className)}>
      {label ?? humanize(status)}
    </span>
  );
}
