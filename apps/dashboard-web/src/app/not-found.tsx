import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="ui-card max-w-md text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Compass className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-3 text-lg font-semibold text-slate-900">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          The link may be out of date. Head back to the dashboard to carry on.
        </p>
        <Link href="/dashboard" className="ui-btn-primary mt-5">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
