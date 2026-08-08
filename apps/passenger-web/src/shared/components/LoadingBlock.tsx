import clsx from 'clsx';

/** Skeleton placeholder that keeps layout height stable while data loads. */
export function LoadingBlock({
  label = 'Loading…',
  rows = 3,
  className,
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={clsx('ui-card space-y-3', className)}
      role="status"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          className="h-4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700"
          key={index}
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  );
}

/** Inline spinner for buttons and small status rows. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  );
}
