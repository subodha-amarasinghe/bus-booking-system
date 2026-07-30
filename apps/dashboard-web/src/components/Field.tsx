import type { ReactNode } from 'react';
import clsx from 'clsx';

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={clsx('min-w-0', className)}>
      <label className="ui-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
