import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegisterForm } from '../../../features/auth/register-form';
import { getPassengerSession, getReturnToCookie } from '../../../lib/auth';
import { resolvePostAuthPath } from '../../../lib/format';

export const metadata = { title: 'Create account · Bus Booking' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string | string[] };
}) {
  const next = resolvePostAuthPath(searchParams.next, getReturnToCookie(), '/');
  const session = await getPassengerSession();
  if (session) redirect(next);

  return (
    <div className="mx-auto w-full max-w-md">
      <section className="ui-card space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            One account for every trip, seat, and receipt.
          </p>
        </div>

        <RegisterForm next={next} />

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link
            className="font-semibold text-brand-700 dark:text-brand-300 hover:underline"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Sign in
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
