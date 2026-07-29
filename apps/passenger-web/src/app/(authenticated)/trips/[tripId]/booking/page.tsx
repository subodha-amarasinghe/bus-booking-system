import { BookingForm } from '../../../../../features/booking/booking-form';
import { getPassengerSession } from '../../../../../lib/auth';
import { redirect } from 'next/navigation';

export default async function BookingPage({
  params,
}: {
  params: { tripId: string };
}) {
  const session = await getPassengerSession();
  if (!session) redirect('/login');
  return (
    <main className="stack">
      <h1>Passenger details</h1>
      <BookingForm tripId={params.tripId} userId={session.userId} />
    </main>
  );
}
