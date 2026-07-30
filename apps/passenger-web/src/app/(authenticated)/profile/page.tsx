import { Search, Ticket, UserRound } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton } from '../../../features/my-bookings/logout-button';
import { getPassengerSession } from '../../../lib/auth';
import { getPassengerProfile } from '../../../lib/profile';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatusBadge } from '../../../shared/components/StatusBadge';

export const metadata = { title: 'Profile · Bus Booking' };

const QUICK_LINKS = [
  {
    href: '/bookings',
    icon: Ticket,
    title: 'My bookings',
    body: 'Tickets, statuses, and cancellations.',
  },
  {
    href: '/search',
    icon: Search,
    title: 'Search trips',
    body: 'Find your next departure.',
  },
];

export default async function ProfilePage() {
  const session = await getPassengerSession();
  if (!session) redirect('/login?next=/profile');

  const profile = await getPassengerProfile(session.userId);
  const phone = profile?.phone ?? session.phone;
  const role = profile?.role ?? session.role;
  const displayName = profile?.name ?? 'Passenger';

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        subtitle="Your account details and quick links."
        title="Profile"
      />

      <section className="ui-card space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <UserRound aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-slate-900">
              {displayName}
            </p>
            {role && <StatusBadge className="mt-1" status={role} />}
          </div>
        </div>

        <dl className="grid gap-3 border-t border-slate-100 pt-4 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">Mobile</dt>
            <dd className="font-medium text-slate-900">
              {phone ?? 'Not available'}
            </dd>
          </div>
          {profile?.email && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="truncate font-medium text-slate-900">
                {profile.email}
              </dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-500">User ID</dt>
            <dd className="truncate font-mono text-xs text-slate-600">
              {session.userId}
            </dd>
          </div>
        </dl>

        <LogoutButton />
      </section>

      <section aria-labelledby="quick-links-heading">
        <h2
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500"
          id="quick-links-heading"
        >
          Quick links
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                className="ui-card flex min-h-[44px] items-start gap-3 transition hover:border-brand-300 hover:bg-brand-50/40"
                href={link.href}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <link.icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    {link.title}
                  </span>
                  <span className="block text-sm text-slate-500">{link.body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
