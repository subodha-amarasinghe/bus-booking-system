import { Armchair, ShieldCheck, Ticket, Zap } from 'lucide-react';
import Link from 'next/link';
import { TripSearchForm } from '../../features/search/trip-search-form';
import { LoginLink } from '../../features/auth/login-link';
import { getLocations, getPopularRoutes } from '../../lib/locations';
import { toDateInputValue } from '../../lib/format';

const TRUST_POINTS = [
  {
    icon: Armchair,
    title: 'Live seat map',
    body: 'See exactly which seats are free, held, or booked in real time.',
  },
  {
    icon: ShieldCheck,
    title: 'Held while you pay',
    body: 'Your seats are reserved for a few minutes so nobody takes them.',
  },
  {
    icon: Zap,
    title: 'Instant confirmation',
    body: 'Tickets appear under My bookings the moment payment succeeds.',
  },
];

export default async function LandingPage() {
  const locations = await getLocations();
  const popular = getPopularRoutes(locations);
  const today = toDateInputValue();

  return (
    <div className="space-y-10">
      <section className="text-center sm:text-left">
        <span className="ui-badge bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
          Sri Lanka intercity network
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Find your next bus
        </h1>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300 sm:max-w-xl">
          Compare departures, pick your seat on a live map, and pay securely —
          all in under a minute.
        </p>
      </section>

      <section aria-labelledby="search-heading" className="ui-card">
        <h2 className="sr-only" id="search-heading">
          Search for a trip
        </h2>
        <TripSearchForm locations={locations} />
      </section>

      {popular.length > 0 && (
        <section aria-labelledby="popular-heading">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            id="popular-heading"
          >
            Popular routes
          </h2>
          <ul className="flex flex-wrap gap-2">
            {popular.map((route) => (
              <li key={route.label}>
                <Link
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:bg-brand-950 hover:text-brand-700 dark:text-brand-300"
                  href={`/search?originLocationId=${route.originLocationId}&destinationLocationId=${route.destinationLocationId}&departureDate=${today}`}
                >
                  <Ticket aria-hidden="true" className="h-4 w-4 text-brand-600" />
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="why-heading">
        <h2 className="sr-only" id="why-heading">
          Why book here
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {TRUST_POINTS.map((point) => (
            <li className="ui-card" key={point.title}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600">
                <point.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {point.title}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{point.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Already booked?{' '}
        <Link className="font-semibold text-brand-700 dark:text-brand-300 hover:underline" href="/bookings">
          View my bookings
        </Link>{' '}
        or{' '}
        <LoginLink
          className="font-semibold text-brand-700 dark:text-brand-300 hover:underline"
          fallbackNext="/bookings"
        >
          sign in
        </LoginLink>
        .
      </p>
    </div>
  );
}
