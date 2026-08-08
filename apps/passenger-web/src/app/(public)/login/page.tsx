import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '../../../features/auth/login-form';
import { getPassengerSession, getReturnToCookie } from '../../../lib/auth';
import { resolvePostAuthPath } from '../../../lib/format';

export const metadata = { title: 'Sign in · Bus Booking' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string | string[] };
}) {
  const next = resolvePostAuthPath(searchParams.next, getReturnToCookie(), '/');
  const session = await getPassengerSession();
  if (session) redirect(next);

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <section className="ui-card space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to hold seats and manage your trips.
          </p>
        </div>

        <LoginForm next={next} />

        <p className="text-sm text-slate-500 dark:text-slate-400">
          New here?{' '}
          <Link
            className="font-semibold text-brand-700 dark:text-brand-300 hover:underline"
            href={`/register?next=${encodeURIComponent(next)}`}
          >
            Create an account
          </Link>
          .
        </p>
      </section>

      <aside className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-100">
        <p className="flex items-center gap-2 font-semibold">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Demo passenger
        </p>
        <p className="mt-1 font-mono text-xs">0771111111 · Password123!</p>
        <p className="mt-1 text-xs text-brand-800 dark:text-brand-200">
          Seeded by <code className="font-mono">pnpm db:seed</code>.
        </p>
      </aside>
    </div>
  );
}
