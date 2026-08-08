import { redirect } from 'next/navigation';
import { SeatMapClient } from '../../../../features/seat-selection/seat-map-client';
import { RouteMapCard } from '../../../../features/route-map/route-map-card';
import { getPassengerSession } from '../../../../lib/auth';
import {
  buildLoginHref,
  formatDateTime,
  formatMoney,
  pathWithSearch,
  safeInternalPath,
} from '../../../../lib/format';
import { PageHeader } from '../../../../shared/components/PageHeader';

export const metadata = { title: 'Choose your seats · Bus Booking' };

/**
 * Fare and departure arrive as optional query params from the search results so
 * the header can show trip context without a per-trip gateway endpoint.
 */
function parseFare(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const fare = Number(value);
  return Number.isFinite(fare) && fare >= 0 ? fare : undefined;
}

export default async function TripPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: {
    routeId?: string;
    fare?: string;
    currency?: string;
    departureAt?: string;
    from?: string;
  };
}) {
  const session = await getPassengerSession();
  if (!session) {
    redirect(
      buildLoginHref(pathWithSearch(`/trips/${params.tripId}`, searchParams)),
    );
  }

  const fareAmount = parseFare(searchParams.fare);
  const currency = searchParams.currency ?? 'LKR';
  const departure = searchParams.departureAt
    ? new Date(searchParams.departureAt)
    : undefined;
  const departureLabel =
    departure && !Number.isNaN(departure.getTime())
      ? formatDateTime(departure)
      : undefined;

  const searchBackHref = safeInternalPath(searchParams.from, '/search');
  const bookingHref = pathWithSearch(`/trips/${params.tripId}/booking`, {
    fare: searchParams.fare,
    currency: searchParams.currency,
    routeId: searchParams.routeId,
    departureAt: searchParams.departureAt,
    from: searchParams.from,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={searchBackHref}
        backLabel="Back to results"
        subtitle={
          [
            departureLabel,
            fareAmount === undefined
              ? undefined
              : `${formatMoney(fareAmount, currency)} per seat`,
          ]
            .filter(Boolean)
            .join(' · ') || 'Tap a seat to select it, then hold your seats.'
        }
        title="Choose your seats"
      />

      {searchParams.routeId ? (
        <RouteMapCard routeId={searchParams.routeId} />
      ) : null}

      <SeatMapClient
        bookingHref={bookingHref}
        currency={currency}
        fareAmount={fareAmount}
        tripId={params.tripId}
        userId={session.userId}
      />
    </div>
  );
}
