import { BookingSchema, type Booking } from '@bus-booking/shared-types';
import { getAccessToken } from '../../../lib/auth';
import { API_GATEWAY_URL } from '../../../lib/route-proxy';

async function getBookings(): Promise<Booking[]> {
  const token = getAccessToken();
  if (!token) return [];
  try {
    const response = await fetch(`${API_GATEWAY_URL}/bookings/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const body = await response.json();
    return BookingSchema.array().safeParse(Array.isArray(body) ? body : body.items)
      .data ?? [];
  } catch {
    return [];
  }
}

export default async function BookingsPage() {
  const bookings = await getBookings();
  return (
    <main className="stack">
      <h1>My bookings</h1>
      {bookings.map((booking) => (
        <article className="card stack" key={booking.id}>
          <strong>Seat {booking.seatNo}</strong>
          <span>{booking.status}</span>
          <span>{booking.currency} {booking.fareAmount.toFixed(2)}</span>
        </article>
      ))}
      {!bookings.length && <div className="card">No bookings were returned.</div>}
    </main>
  );
}
