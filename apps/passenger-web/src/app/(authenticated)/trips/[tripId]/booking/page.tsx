import { redirect } from 'next/navigation';
import { BookingForm } from '../../../../../features/booking/booking-form';
import { getPassengerSession } from '../../../../../lib/auth';
import { getPassengerProfile } from '../../../../../lib/profile';
import { PageHeader } from '../../../../../shared/components/PageHeader';

export const metadata = { title: 'Passenger details · Bus Booking' };

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: { tripId: string };
  searchParams: { fare?: string; currency?: string };
}) {
  const session = await getPassengerSession();
  if (!session) redirect(`/login?next=/trips/${params.tripId}/booking`);

  const profile = await getPassengerProfile(session.userId);
  const fare = Number(searchParams.fare);

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <PageHeader
        backHref={`/trips/${params.tripId}`}
        backLabel="Back to seat map"
        subtitle="We use these details on the ticket and for trip updates."
        title="Passenger details"
      />
      <BookingForm
        currency={searchParams.currency ?? 'LKR'}
        defaultName={profile?.name ?? ''}
        defaultPhone={profile?.phone ?? session.phone ?? ''}
        fareAmount={Number.isFinite(fare) && fare > 0 ? fare : undefined}
        tripId={params.tripId}
        userId={session.userId}
      />
    </div>
  );
}
