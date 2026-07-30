import { redirect } from 'next/navigation';
import { Bus, ShieldCheck } from 'lucide-react';
import { getStaffSession } from '../../lib/auth';
import { LoginForm } from '../../features/auth';

export const dynamic = 'force-dynamic';

const HIGHLIGHTS = [
  'Register buses and draw their seat maps',
  'Publish routes and schedule departures',
  'Handle cancellations, refunds and counter payments',
];

/** Only in-app destinations are honoured, so `next` cannot bounce elsewhere. */
function safeNextPath(next?: string): string {
  return next?.startsWith('/dashboard') ? next : '/dashboard';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await getStaffSession();
  if (session) {
    redirect(safeNextPath(searchParams.next));
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-slate-900 p-10 text-slate-300 lg:flex">
        <div className="flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
            <Bus className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold">Bus Booking</span>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight text-white">
            Everything your counter team needs, in one place.
          </h2>
          <ul className="mt-6 space-y-3 text-sm">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-500">
          Passengers book on the passenger site — this dashboard is for staff.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Bus className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Bus Booking
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Staff sign in
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Use the phone number and password for your staff account.
          </p>

          <div className="ui-card mt-6">
            <LoginForm nextPath={safeNextPath(searchParams.next)} />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Demo credentials</p>
            <p className="mt-1">
              Admin staff — phone{' '}
              <span className="font-mono text-slate-700">0770000001</span>,
              password{' '}
              <span className="font-mono text-slate-700">Password123!</span>
            </p>
            <p className="mt-1">
              Customer staff — phone{' '}
              <span className="font-mono text-slate-700">0770000002</span>, same
              password.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
