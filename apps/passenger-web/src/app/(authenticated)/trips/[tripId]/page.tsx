import { getPassengerSession } from '../../../../lib/auth';
import { SeatMapClient } from '../../../../features/seat-selection/seat-map-client';
import { redirect } from 'next/navigation';

export default async function TripPage({
  params,
}: {
  params: { tripId: string };
}) {
  const session = await getPassengerSession();
  if (!session) redirect('/login');
  return (
    <main className="stack">
      <div>
        <h1>Choose your seats</h1>
        <p className="muted">Trip {params.tripId}</p>
      </div>
      <SeatMapClient tripId={params.tripId} userId={session.userId} />
    </main>
  );
}
