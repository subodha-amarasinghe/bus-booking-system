import { BookingSchema, type Booking } from '@bus-booking/shared-types';
import { getAccessToken } from './auth';
import { API_GATEWAY_URL } from './route-proxy';

/** Server-side read of the signed-in passenger's bookings. */
export async function getMyBookings(): Promise<Booking[]> {
  const token = getAccessToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_GATEWAY_URL}/bookings/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const body = await response.json().catch(() => []);
    const items = Array.isArray(body) ? body : body?.items;
    return BookingSchema.array().safeParse(items).data ?? [];
  } catch {
    return [];
  }
}

/**
 * The gateway has no single-booking endpoint, so the payment page resolves its
 * context from the passenger's own booking list.
 */
export async function getBookingById(
  bookingId: string,
): Promise<Booking | null> {
  const bookings = await getMyBookings();
  return bookings.find((booking) => booking.id === bookingId) ?? null;
}
