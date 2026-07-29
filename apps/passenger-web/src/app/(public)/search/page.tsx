import { SearchTripsRequestSchema, TripSchema, type Trip } from '@bus-booking/shared-types';
import Link from 'next/link';
import { API_GATEWAY_URL } from '../../../lib/route-proxy';

type Params = Record<string, string | string[] | undefined>;

async function searchTrips(searchParams: Params): Promise<Trip[]> {
  const parsed = SearchTripsRequestSchema.safeParse({
    originLocationId: searchParams.originLocationId || undefined,
    destinationLocationId: searchParams.destinationLocationId || undefined,
    departureDate: searchParams.departureDate || undefined,
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
    const body = await response.json();
    const trips = Array.isArray(body) ? body : body.items;
    return TripSchema.array().safeParse(trips).data ?? [];
  } catch {
    return [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const trips = await searchTrips(searchParams);
  return (
    <main className="stack">
      <div>
        <h1>Available trips</h1>
        <p className="muted">Live availability is confirmed on the seat map.</p>
      </div>
      <div className="grid trip-grid">
        {trips.map((trip) => (
          <article className="card stack" key={trip.id}>
            <strong>{new Date(trip.departureAt).toLocaleString()}</strong>
            <span>{trip.availableSeats ?? '—'} seats available</span>
            <span>{trip.currency} {trip.fareAmount.toFixed(2)}</span>
            <Link className="button" href={`/trips/${trip.id}`}>Choose seats</Link>
          </article>
        ))}
        {!trips.length && (
          <div className="card">
            <p>No matching trips were returned. Check the search details or try again.</p>
          </div>
        )}
      </div>
    </main>
  );
}
