import { redirect } from 'next/navigation';
import { BookingForm } from '../../../../../features/booking/booking-form';
import { getPassengerSession } from '../../../../../lib/auth';
import { buildLoginHref, pathWithSearch } from '../../../../../lib/format';
import { getPassengerProfile } from '../../../../../lib/profile';
import { PageHeader } from '../../../../../shared/components/PageHeader';

export const metadata = { title: 'Passenger details · Bus Booking' };

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: {
    fare?: string;
    currency?: string;
    routeId?: string;
    departureAt?: string;
    from?: string;
  };
}) {
  const session = await getPassengerSession();
  if (!session) {
    redirect(
      buildLoginHref(
        pathWithSearch(`/trips/${params.tripId}/booking`, searchParams),
      ),
    );
  }

  const profile = await getPassengerProfile(session.userId);
  const fare = Number(searchParams.fare);
  const seatMapHref = pathWithSearch(`/trips/${params.tripId}`, {
    fare: searchParams.fare,
    currency: searchParams.currency,
    routeId: searchParams.routeId,
    departureAt: searchParams.departureAt,
    from: searchParams.from,
  });

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        backHref={seatMapHref}
        backLabel="Back to seat map"
        subtitle="We use these details on the ticket and for trip updates."
        title="Passenger details"
      />
      <BookingForm
        currency={searchParams.currency ?? 'LKR'}
        defaultName={profile?.name ?? ''}
        defaultPhone={profile?.phone ?? session.phone ?? ''}
        fareAmount={Number.isFinite(fare) && fare > 0 ? fare : undefined}
        seatMapHref={seatMapHref}
        tripId={params.tripId}
        userId={session.userId}
      />
    </div>
  );
}
