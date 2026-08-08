import {
  SearchTripsRequestSchema,
  TripSchema,
  type Trip,
} from '@bus-booking/shared-types';
import { ArrowRight, Armchair, Bus, CalendarDays, Clock } from 'lucide-react';
import Link from 'next/link';
import { TripSearchForm } from '../../../features/search/trip-search-form';
import {
  formatDate,
  formatDuration,
  formatMoney,
  formatTime,
  pathWithSearch,
  shiftDateInputValue,
  toDateInputValue,
} from '../../../lib/format';
import { getLocations, getRouteLabels, type RouteLabel } from '../../../lib/locations';
import { API_GATEWAY_URL } from '../../../lib/route-proxy';
import { EmptyState } from '../../../shared/components/EmptyState';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatusBadge } from '../../../shared/components/StatusBadge';

type Params = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value || undefined;
}

async function searchTrips(searchParams: Params): Promise<Trip[]> {
  const parsed = SearchTripsRequestSchema.safeParse({
    originLocationId: first(searchParams.originLocationId),
    destinationLocationId: first(searchParams.destinationLocationId),
    departureDate: first(searchParams.departureDate),
    page: 1,
    limit: 30,
  });
  if (!parsed.success) return [];

  try {
    const response = await fetch(`${API_GATEWAY_URL}/trips/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const body = await response.json().catch(() => []);
    const trips = Array.isArray(body) ? body : body?.items;
    return TripSchema.array().safeParse(trips).data ?? [];
  } catch {
    return [];
  }
}

function TripCard({
  trip,
  route,
  searchFrom,
}: {
  trip: Trip;
  route?: RouteLabel;
  /** Current search URL so "Back to results" restores filters. */
  searchFrom: string;
}) {
  const duration = formatDuration(trip.departureAt, trip.arrivalAt);
  const seatsLeft = trip.availableSeats;
  const soldOut = seatsLeft === 0;
  const tripHref = `/trips/${trip.id}?routeId=${trip.routeId}&fare=${trip.fareAmount}&currency=${trip.currency}&departureAt=${encodeURIComponent(
    new Date(trip.departureAt).toISOString(),
  )}&from=${encodeURIComponent(searchFrom)}`;

  return (
    <li className="ui-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {formatDate(trip.departureAt)}
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {formatTime(trip.departureAt)}
            </span>
            {trip.arrivalAt && (
              <>
                <ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                  {formatTime(trip.arrivalAt)}
                </span>
              </>
            )}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Bus aria-hidden="true" className="h-4 w-4 text-brand-600" />
            {route?.origin && route.destination
              ? `${route.origin} → ${route.destination}`
              : route?.name ?? 'Intercity service'}
            {route?.routeNumber ? (
              <span className="rounded-md bg-brand-50 dark:bg-brand-950 px-2 py-0.5 font-bold text-brand-700 dark:text-brand-300">
                [{route.routeNumber}]
              </span>
            ) : null}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatMoney(trip.fareAmount, trip.currency)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">per seat</p>
          <StatusBadge className="mt-2" status={trip.status} />
        </div>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <Armchair aria-hidden="true" className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <dt className="sr-only">Seats available</dt>
          <dd>
            {seatsLeft === undefined
              ? 'Seats shown on the map'
              : `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} available`}
          </dd>
        </div>
        {duration && (
          <div className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <dt className="sr-only">Journey time</dt>
            <dd>{duration}</dd>
          </div>
        )}
      </dl>

      {soldOut ? (
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          This departure is fully booked.
        </p>
      ) : (
        <Link
          className="ui-btn-primary mt-4 min-h-[48px] w-full sm:w-auto"
          href={tripHref}
        >
          Select seats
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </li>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const originLocationId = first(searchParams.originLocationId);
  const destinationLocationId = first(searchParams.destinationLocationId);
  const departureDate = first(searchParams.departureDate);
  const hasQuery = Boolean(originLocationId && destinationLocationId);

  const [locations, routeLabels, trips] = await Promise.all([
    getLocations(),
    getRouteLabels(),
    hasQuery ? searchTrips(searchParams) : Promise.resolve<Trip[]>([]),
  ]);

  const byId = new Map(locations.map((location) => [location.id, location.name]));
  const journey =
    originLocationId && destinationLocationId
      ? `${byId.get(originLocationId) ?? 'Origin'} → ${byId.get(destinationLocationId) ?? 'Destination'}`
      : undefined;

  const baseDate = departureDate ?? toDateInputValue();
  const nearbyDates = hasQuery
    ? [-1, 1].map((offset) => {
        const date = shiftDateInputValue(baseDate, offset);
        return {
          date,
          href: `/search?originLocationId=${originLocationId}&destinationLocationId=${destinationLocationId}&departureDate=${date}`,
        };
      })
    : [];

  const searchFrom = pathWithSearch('/search', {
    originLocationId,
    destinationLocationId,
    departureDate,
  });

  return (
    <div className="space-y-4 md:space-y-5">
      <PageHeader
        backHref="/"
        backLabel="Home"
        compact
        subtitle={
          journey
            ? `${journey}${departureDate ? ` · ${formatDate(departureDate)}` : ''}`
            : 'Pick an origin and destination to see departures.'
        }
      />

      <section
        aria-labelledby="refine-heading"
        className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4 lg:p-3"
      >
        <h2
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:sr-only"
          id="refine-heading"
        >
          Refine your search
        </h2>
        <TripSearchForm
          compact
          defaults={{ originLocationId, destinationLocationId, departureDate }}
          locations={locations}
          submitLabel="Update results"
        />
      </section>

      {!hasQuery ? (
        <EmptyState
          description="Choose where you are travelling from and to, then search to see live departures."
          icon={Bus}
          title="Start with your route"
        />
      ) : trips.length === 0 ? (
        <EmptyState
          action={
            nearbyDates.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {nearbyDates.map((option) => (
                  <Link
                    className="ui-btn-secondary min-h-[44px]"
                    href={option.href}
                    key={option.date}
                  >
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    {formatDate(option.date)}
                  </Link>
                ))}
              </div>
            ) : undefined
          }
          description="No departures matched this route and date. Try a different date."
          icon={CalendarDays}
          title="Nothing scheduled yet"
        />
      ) : (
        <section aria-labelledby="results-heading">
          <h2
            className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
            id="results-heading"
          >
            {trips.length} departure{trips.length === 1 ? '' : 's'}
          </h2>
          <ul className="space-y-4">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                route={routeLabels[trip.routeId]}
                searchFrom={searchFrom}
                trip={trip}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
