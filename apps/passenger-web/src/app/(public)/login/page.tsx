import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { LoginForm } from '../../../features/auth/login-form';
import { safeInternalPath } from '../../../lib/format';

export const metadata = { title: 'Sign in · Bus Booking' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = safeInternalPath(searchParams.next, '/');

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <section className="ui-card space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to hold seats and manage your trips.
          </p>
        </div>

        <LoginForm next={next} />

        <p className="text-sm text-slate-500">
          New here?{' '}
          <Link
            className="font-semibold text-brand-700 hover:underline"
            href={`/register?next=${encodeURIComponent(next)}`}
          >
            Create an account
          </Link>
          .
        </p>
      </section>

      <aside className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
        <p className="flex items-center gap-2 font-semibold">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Demo passenger
        </p>
        <p className="mt-1 font-mono text-xs">0771111111 · Password123!</p>
        <p className="mt-1 text-xs text-brand-800">
          Seeded by <code className="font-mono">pnpm db:seed</code>.
        </p>
      </aside>
    </div>
  );
}
