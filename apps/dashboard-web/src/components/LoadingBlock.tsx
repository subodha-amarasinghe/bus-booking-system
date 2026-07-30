import clsx from 'clsx';
import { LoaderCircle } from 'lucide-react';

type LoadingBlockProps = {
  label?: string;
  className?: string;
};

export function LoadingBlock({
  label = 'Loading…',
  className,
}: LoadingBlockProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'flex items-center justify-center gap-2.5 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-12 text-sm text-slate-500',
        className,
      )}
    >
      <LoaderCircle className="h-4 w-4 animate-spin text-brand-500" aria-hidden />
      {label}
    </div>
  );
}

/** Inline spinner for buttons and small labels. */
export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle
      className={clsx('h-4 w-4 animate-spin', className)}
      aria-hidden
    />
  );
}
