import Link from 'next/link';
import { RegisterForm } from '../../../features/auth/register-form';
import { safeInternalPath } from '../../../lib/format';

export const metadata = { title: 'Create account · Bus Booking' };

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = safeInternalPath(searchParams.next, '/');

  return (
    <div className="mx-auto w-full max-w-md">
      <section className="ui-card space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            One account for every trip, seat, and receipt.
          </p>
        </div>

        <RegisterForm next={next} />

        <p className="text-sm text-slate-500">
          Already registered?{' '}
          <Link
            className="font-semibold text-brand-700 hover:underline"
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
